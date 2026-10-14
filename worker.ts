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

/** Limite diário por conta (30 mensagens), aplicado no banco via RPC com o token do próprio usuário. */
async function consumeQuota(request: Request, env: Env): Promise<"ok" | "limit" | "error"> {
  try {
    const response = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/consume_ai_quota`, {
      method: "POST",
      headers: {
        authorization: request.headers.get("authorization") ?? "",
        apikey: env.SUPABASE_ANON_KEY,
        "content-type": "application/json",
      },
      body: "{}",
    });
    if (!response.ok) return "error";
    return (await response.json()) === true ? "ok" : "limit";
  } catch {
    return "error";
  }
}


/** Lê uma foto de tabela nutricional sem armazenar a imagem. Os valores retornam para revisão humana. */
async function handleLabelScan(request: Request, env: Env): Promise<Response> {
  if (request.method !== "POST") return withCors(json({ error: "Método não permitido." }, 405));
  if (!(await authenticatedUser(request, env))) return withCors(json({ error: "Entre na sua conta para ler um rótulo." }, 401));
  if (!env.GEMINI_API_KEY) return withCors(json({ error: "A leitura por IA ainda não está configurada." }, 503));

  let payload: { mimeType?: unknown; imageBase64?: unknown };
  try {
    payload = await request.json() as typeof payload;
  } catch {
    return withCors(json({ error: "Envie uma imagem válida." }, 400));
  }
  const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
  if (typeof payload.mimeType !== "string" || !allowedTypes.has(payload.mimeType)) {
    return withCors(json({ error: "Use uma imagem JPG, PNG ou WebP." }, 400));
  }
  if (typeof payload.imageBase64 !== "string" || !/^[A-Za-z0-9+/]+={0,2}$/.test(payload.imageBase64)) {
    return withCors(json({ error: "A imagem enviada não é válida." }, 400));
  }
  if (payload.imageBase64.length > 5_600_000) return withCors(json({ error: "A imagem deve ter no máximo 4 MB." }, 413));

  const quota = await consumeQuota(request, env);
  if (quota === "limit") return withCors(json({ error: "Você atingiu o limite diário de 30 usos de IA. Volte amanhã." }, 429));
  if (quota === "error") return withCors(json({ error: "Não foi possível verificar seu limite de IA. Tente novamente." }, 503));

  const prompt = [
    "Você extrai informações de uma tabela nutricional de embalagem para um aplicativo brasileiro.",
    "Leia somente o que estiver visível na imagem. Não invente nem complete números ausentes. Se um valor não estiver legível, use null.",
    "Retorne somente JSON válido, sem markdown, no formato:",
    '{"name":"nome do produto ou vazio","brand":"marca ou vazio","basis":"100g ou 100ml","servingSize":"porção indicada ou vazio","calories":0,"proteins":0,"carbohydrates":0,"fats":0,"fiber":0,"saturatedFat":null,"sugars":null,"sodiumMg":null,"confidence":"high|medium|low","notes":"observações curtas"}',
    "Os nutrientes devem representar os valores por 100 g ou 100 ml, conforme basis. Se a imagem mostrar apenas valores por porção, converta para 100 g/ml somente se a quantidade da porção estiver claramente legível; caso contrário, deixe os nutrientes incertos como null e explique em notes.",
    "Calorias em kcal, macronutrientes e fibras em gramas, sódio em miligramas. Nunca conclua que o alimento é saudável nem ofereça orientação médica.",
  ].join("\n");

  try {
    const model = (env.GEMINI_MODEL || "gemini-3.5-flash-lite").trim();
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [
          { text: prompt },
          { inlineData: { mimeType: payload.mimeType, data: payload.imageBase64 } },
        ] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 500, responseMimeType: "application/json" },
      }),
    });
    if (!response.ok) {
      if (response.status === 429) return withCors(json({ error: "O limite gratuito da IA foi atingido por enquanto. Tente mais tarde." }, 429));
      console.warn("SISTCS Leve label scan provider status", { httpStatus: response.status });
      return withCors(json({ error: "Não foi possível ler o rótulo agora. Tente outra foto com boa iluminação." }, 502));
    }
    const result = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    const raw = result.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("").trim() || "";
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return withCors(json({ error: "A leitura não ficou clara o suficiente. Tente outra foto mais nítida." }, 422));
    }
    const numeric = (key: string) => {
      const value = parsed[key];
      return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100000 ? value : null;
    };
    const name = typeof parsed.name === "string" ? parsed.name.trim().slice(0, 120) : "";
    const brand = typeof parsed.brand === "string" ? parsed.brand.trim().slice(0, 80) : "";
    const basis = parsed.basis === "100ml" ? "100ml" : "100g";
    const confidence = parsed.confidence === "high" || parsed.confidence === "medium" ? parsed.confidence : "low";
    return withCors(json({
      food: {
        name: name || (brand ? brand : "Produto lido do rótulo"),
        brand,
        basis,
        servingSize: typeof parsed.servingSize === "string" ? parsed.servingSize.slice(0, 80) : "",
        calories: numeric("calories"),
        proteins: numeric("proteins"),
        carbohydrates: numeric("carbohydrates"),
        fats: numeric("fats"),
        fiber: numeric("fiber"),
        saturatedFat: numeric("saturatedFat"),
        sugars: numeric("sugars"),
        sodiumMg: numeric("sodiumMg"),
        confidence,
        notes: typeof parsed.notes === "string" ? parsed.notes.slice(0, 240) : "",
      },
    }));
  } catch {
    return withCors(json({ error: "Não foi possível conectar à leitura por IA. Verifique a conexão e tente novamente." }, 502));
  }
}

async function handleApi(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  if (request.method === "OPTIONS") return withCors(new Response(null, { status: 204 }));
  if (url.pathname === "/api/ai/status" && request.method === "GET") {
    return withCors(json({ available: Boolean(env.GEMINI_API_KEY), model: env.GEMINI_MODEL || "gemini-3.5-flash-lite" }));
  }
  if (url.pathname === "/api/ai/label") return handleLabelScan(request, env);
  if (url.pathname !== "/api/ai/chat") return withCors(json({ error: "Rota não encontrada." }, 404));
  if (request.method !== "POST") return withCors(json({ error: "Método não permitido." }, 405));
  if (!(await authenticatedUser(request, env))) return withCors(json({ error: "Entre na sua conta para usar o assistente." }, 401));
  let payload: { message?: unknown; history?: unknown; diaryContext?: unknown };
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

  const quota = await consumeQuota(request, env);
  if (quota === "limit") return withCors(json({ error: "Você atingiu o limite diário de 30 mensagens do assistente. Volte amanhã." }, 429));
  if (quota === "error") return withCors(json({ error: "Não foi possível verificar seu limite agora. Tente novamente em instantes." }, 503));

  const history = Array.isArray(payload.history)
    ? payload.history.slice(-8).flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const row = item as { role?: unknown; text?: unknown };
      if ((row.role !== "user" && row.role !== "model") || typeof row.text !== "string") return [];
      return [{ role: row.role, parts: [{ text: row.text.slice(0, 1500) }] }];
    })
    : [];

  let diaryContextText = "";
  if (payload.diaryContext && typeof payload.diaryContext === "object") {
    const context = payload.diaryContext as {
      date?: unknown; loggedMeals?: unknown;
      totals?: Record<string, unknown>; goals?: Record<string, unknown> | null;
    };
    const safeNumber = (value: unknown) => typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100000 ? value : null;
    const totals = context.totals && typeof context.totals === "object" ? context.totals : {};
    const goals = context.goals && typeof context.goals === "object" ? context.goals : {};
    const safeTotals = {
      calories: safeNumber(totals.calories),
      proteins: safeNumber(totals.proteins),
      carbohydrates: safeNumber(totals.carbohydrates),
      fats: safeNumber(totals.fats),
      fiber: safeNumber(totals.fiber),
    };
    const safeGoals = {
      calories: safeNumber(goals.calories),
      proteins: safeNumber(goals.proteins),
      carbohydrates: safeNumber(goals.carbohydrates),
      fats: safeNumber(goals.fats),
      fiber: safeNumber(goals.fiber),
    };
    const loggedMeals = safeNumber(context.loggedMeals);
    if (typeof context.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(context.date)) {
      diaryContextText = "Resumo diário agregado autorizado (não contém nomes de alimentos): " + JSON.stringify({
        date: context.date, loggedMeals, totals: safeTotals, goals: safeGoals,
      });
    }
  }

  const prompt = [
    "Você é o Assistente de Alimentação do SISTCS Leve. Responda em português brasileiro, com empatia, clareza e concisão.",
    "Ajude com ideias de refeições, receitas, substituições e educação alimentar geral. Não diagnostique, não prescreva tratamentos, medicamentos, dietas clínicas ou metas calóricas individuais.",
    "Não afirme que valores nutricionais estimados são exatos. Para calorias e nutrientes, oriente a pessoa a confirmar os alimentos e porções na base nutricional do aplicativo.",
    "Em gravidez, transtornos alimentares, doenças, alergias graves ou sintomas preocupantes, recomende orientação de profissional de saúde. Não solicite nome completo, documentos, endereço ou outros dados pessoais.",
    "A resposta é educativa e não substitui nutricionista ou médico.",
    "Se houver um resumo diário agregado autorizado, use-o apenas para contextualizar sugestões. Não deduza diagnósticos, não trate metas como prescrição clínica e deixe claro quando faltarem dados.",
  ].join("\n");

  try {
    const model = (env.GEMINI_MODEL || "gemini-3.5-flash-lite").trim();
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: prompt }] },
        contents: [...history, { role: "user", parts: [{ text: payload.message.trim() }, ...(diaryContextText ? [{ text: diaryContextText }] : [])] }],
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
