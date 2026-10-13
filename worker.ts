interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });

const corsHeaders = {
  "access-control-allow-origin": "https://leve.sistcs.com",
  "access-control-allow-methods": "POST, GET, OPTIONS",
  "access-control-allow-headers": "Authorization, Content-Type",
  "vary": "Origin",
};

function withCors(response: Response) {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(corsHeaders)) headers.set(key, value);
  return new Response(response.body, { status: response.status, headers });
}

async function authenticatedUser(request: Request, env: Env): Promise<boolean> {
  const authorization = request.headers.get("authorization") ?? "";
  if (!/^Bearer\s+[^\s]+$/i.test(authorization)) return false;
  try {
    const response = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
      headers: { authorization, apikey: env.SUPABASE_ANON_KEY },
    });
    if (!response.ok) return false;
    const user = await response.json() as { id?: unknown };
    return typeof user.id === "string" && user.id.length > 0;
  } catch {
    return false;
  }
}

async function handleApi(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  if (request.method === "OPTIONS") return withCors(new Response(null, { status: 204 }));
  if (url.pathname === "/api/ai/status" && request.method === "GET") {
    return withCors(json({ available: Boolean(env.GEMINI_API_KEY), model: env.GEMINI_MODEL || "gemini-3.5-flash-lite" }));
  }
  if (url.pathname !== "/api/ai/chat") return withCors(json({ error: "Rota não encontrada." }, 404));
  if (request.method !== "POST") return withCors(json({ error: "Método não permitido." }, 405));
  if (!(await authenticatedUser(request, env))) return withCors(json({ error: "Entre na sua conta para usar o assistente." }, 401));
  let payload: { message?: unknown; history?: unknown };
  try {
    payload = await request.json() as typeof payload;
  } catch {
    return withCors(json({ error: "Envie uma mensagem válida." }, 400));
  }
  if (typeof payload.message !== "string" || !payload.message.trim()) {
    return withCors(json({ error: "Escreva uma pergunta para continuar." }, 400));
  }
  if (payload.message.length > 4000) return withCors(json({ error: "A mensagem deve ter no máximo 4.000 caracteres." }, 413));

  if (!env.GEMINI_API_KEY) return withCors(json({ error: "O assistente ainda precisa ser configurado pelo administrador. As demais funções continuam disponíveis." }, 503));

  const history = Array.isArray(payload.history)
    ? payload.history.slice(-8).flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const row = item as { role?: unknown; text?: unknown };
      if ((row.role !== "user" && row.role !== "model") || typeof row.text !== "string") return [];
      return [{ role: row.role, parts: [{ text: row.text.slice(0, 1500) }] }];
    })
    : [];

  const prompt = [
    "Você é o Assistente de Alimentação do SISTCS Leve. Responda em português brasileiro, com empatia, clareza e concisão.",
    "Ajude com ideias de refeições, receitas, substituições e educação alimentar geral. Não diagnostique, não prescreva tratamentos, medicamentos, dietas clínicas ou metas calóricas individuais.",
    "Não afirme que valores nutricionais estimados são exatos. Para calorias e nutrientes, oriente a pessoa a confirmar os alimentos e porções na base nutricional do aplicativo.",
    "Em gravidez, transtornos alimentares, doenças, alergias graves ou sintomas preocupantes, recomende orientação de profissional de saúde. Não solicite nome completo, documentos, endereço ou outros dados pessoais.",
    "A resposta é educativa e não substitui nutricionista ou médico.",
  ].join("\n");

  try {
    const model = (env.GEMINI_MODEL || "gemini-3.5-flash-lite").trim();
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: prompt }] },
        contents: [...history, { role: "user", parts: [{ text: payload.message.trim() }] }],
        generationConfig: { temperature: 0.6, maxOutputTokens: 700 },
      }),
    });
    if (response.status === 429) return withCors(json({ error: "O limite gratuito da IA foi atingido por enquanto. Tente novamente mais tarde." }, 429));
    if (!response.ok) {
      // Log only the provider status and a short, sanitized error message; never log credentials or prompts.
      let providerCode = "";
      let providerMessage = "";
      try {
        const providerError = await response.clone().json() as { error?: { status?: unknown; message?: unknown } };
        if (typeof providerError.error?.status === "string") providerCode = providerError.error.status.slice(0, 80);
        if (typeof providerError.error?.message === "string") providerMessage = providerError.error.message.replace(/[\r\n]+/g, " ").slice(0, 240);
      } catch {
        // Keep the response generic if the provider did not return JSON.
      }
      console.warn("SISTCS Leve Gemini provider rejected request", {
        httpStatus: response.status,
        providerCode,
        providerMessage,
      });
      const clientMessage = response.status === 401 || response.status === 403
        ? "A chave do Gemini foi recusada ou não tem permissão. O administrador precisa verificar a chave e o acesso à API."
        : response.status === 404
          ? "O modelo Gemini configurado não foi encontrado. O administrador precisa revisar a configuração do modelo."
          : response.status === 400
            ? "O Gemini recusou o formato da solicitação. Tente novamente; se persistir, o administrador deve revisar a configuração."
            : "O assistente está temporariamente indisponível. Tente novamente mais tarde.";
      return withCors(json({ error: clientMessage }, 502));
    }
    const result = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    const answer = result.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("").trim();
    if (!answer) return withCors(json({ error: "Não consegui gerar uma resposta agora. Tente reformular a pergunta." }, 502));
    return withCors(json({ answer }));
  } catch {
    return withCors(json({ error: "Não foi possível conectar ao assistente. Verifique sua conexão e tente novamente." }, 502));
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/ai/")) return handleApi(request, env);
    return env.ASSETS.fetch(request);
  },
};
