import { afterEach, describe, expect, it, vi } from 'vitest';
import worker from '../worker';

const assets = { fetch: vi.fn(async () => new Response('app')) };
const env = {
  ASSETS: assets,
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_ANON_KEY: 'public-test-key',
  GEMINI_MODEL: 'gemini-2.5-flash-lite',
} as unknown as Parameters<typeof worker.fetch>[1];

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('endpoint do assistente Gemini', () => {
  it('informa que a IA precisa de configuração sem expor segredo', async () => {
    const response = await worker.fetch(new Request('https://leve.sistcs.com/api/ai/status'), env);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ available: false, model: 'gemini-2.5-flash-lite' });
  });

  it('recusa chamadas sem autenticação', async () => {
    const response = await worker.fetch(new Request('https://leve.sistcs.com/api/ai/chat', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ message: 'Oi' }),
    }), env);
    expect(response.status).toBe(401);
  });

  it('não envia prompts ao Google quando a chave não está configurada', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ id: 'user-1' }), {
      status: 200, headers: { 'content-type': 'application/json' },
    })));
    const response = await worker.fetch(new Request('https://leve.sistcs.com/api/ai/chat', {
      method: 'POST',
      headers: { authorization: 'Bearer test-token', 'content-type': 'application/json' },
      body: JSON.stringify({ message: 'Sugira um almoço' }),
    }), env);
    expect(response.status).toBe(503);
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);
  });

  it('limita o tamanho da mensagem', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ id: 'user-1' }), {
      status: 200, headers: { 'content-type': 'application/json' },
    })));
    const response = await worker.fetch(new Request('https://leve.sistcs.com/api/ai/chat', {
      method: 'POST',
      headers: { authorization: 'Bearer test-token', 'content-type': 'application/json' },
      body: JSON.stringify({ message: 'x'.repeat(4001) }),
    }), env);
    expect(response.status).toBe(413);
  });
  it('limita o corpo em streaming mesmo sem Content-Length', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ id: 'user-1' }), {
      status: 200, headers: { 'content-type': 'application/json' },
    })));
    const request = new Request('https://leve.sistcs.com/api/ai/chat', {
      method: 'POST',
      headers: { authorization: 'Bearer test-token', 'content-type': 'application/json' },
      body: JSON.stringify({ message: 'x'.repeat(6_100_000) }),
    });
    expect(request.headers.has('content-length')).toBe(false);
    const response = await worker.fetch(request, env);
    expect(response.status).toBe(413);
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);
  });

  it('bloqueia com 429 quando o limite diário acabou, sem chamar o Google', async () => {
    const envComChave = { ...env, GEMINI_API_KEY: 'segredo-de-teste' } as unknown as Parameters<typeof worker.fetch>[1];
    const calls: string[] = [];
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      calls.push(url);
      if (url.includes('/auth/v1/user')) return new Response(JSON.stringify({ id: 'user-1' }), { status: 200 });
      if (url.includes('consume_ai_quota')) return new Response('false', { status: 200 });
      return new Response('{}', { status: 200 });
    }));
    const response = await worker.fetch(new Request('https://leve.sistcs.com/api/ai/chat', {
      method: 'POST',
      headers: { authorization: 'Bearer test-token', 'content-type': 'application/json' },
      body: JSON.stringify({ message: 'Sugira um jantar' }),
    }), envComChave);
    expect(response.status).toBe(429);
    expect(calls.some((url) => url.includes('generativelanguage.googleapis.com'))).toBe(false);
  });

  it('falha de forma segura (503) se não conseguir verificar o limite', async () => {
    const envComChave = { ...env, GEMINI_API_KEY: 'segredo-de-teste' } as unknown as Parameters<typeof worker.fetch>[1];
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/auth/v1/user')) return new Response(JSON.stringify({ id: 'user-1' }), { status: 200 });
      return new Response('erro', { status: 500 });
    }));
    const response = await worker.fetch(new Request('https://leve.sistcs.com/api/ai/chat', {
      method: 'POST',
      headers: { authorization: 'Bearer test-token', 'content-type': 'application/json' },
      body: JSON.stringify({ message: 'Sugira um jantar' }),
    }), envComChave);
    expect(response.status).toBe(503);
  });
});


describe('endpoint de leitura de rótulo nutricional', () => {
  const envWithKey = { ...env, GEMINI_API_KEY: 'gemini-test-key' } as unknown as Parameters<typeof worker.fetch>[1];
  const labelRequest = (body: unknown, authorization = 'Bearer test-token') => new Request('https://leve.sistcs.com/api/ai/label', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization },
    body: JSON.stringify(body),
  });

  it('recusa leitura sem sessão válida', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 401 })));
    const response = await worker.fetch(labelRequest({ mimeType: 'image/jpeg', imageBase64: 'YWJj' }), envWithKey);
    expect(response.status).toBe(401);
  });

  it('recusa tipo de imagem não permitido antes de consumir quota', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ id: 'user-1' }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const response = await worker.fetch(labelRequest({ mimeType: 'image/svg+xml', imageBase64: 'YWJj' }), envWithKey);
    expect(response.status).toBe(400);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('respeita a quota diária existente de IA', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 'user-1' }), { status: 200 }))
      .mockResolvedValueOnce(new Response('false', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const response = await worker.fetch(labelRequest({ mimeType: 'image/jpeg', imageBase64: 'YWJj' }), envWithKey);
    expect(response.status).toBe(429);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('devolve os valores reconhecidos após autenticação e quota, sem guardar a imagem', async () => {
    const extracted = {
      name: 'Iogurte de teste', brand: 'Marca teste', basis: '100g', servingSize: '160 g',
      calories: 76, proteins: 10, carbohydrates: 5.7, fats: 1.2, fiber: 0,
      saturatedFat: 0.8, sugars: 4, sodiumMg: 42, confidence: 'high', notes: '',
    };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 'user-1' }), { status: 200 }))
      .mockResolvedValueOnce(new Response('true', { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        candidates: [{ content: { parts: [{ text: JSON.stringify(extracted) }] } }],
      }), { status: 200, headers: { 'content-type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);
    const response = await worker.fetch(labelRequest({ mimeType: 'image/jpeg', imageBase64: 'YWJj' }), envWithKey);
    const body = await response.json() as { food?: { name?: string; calories?: number; proteins?: number } };
    expect(response.status).toBe(200);
    expect(body.food?.name).toBe('Iogurte de teste');
    expect(body.food?.calories).toBe(76);
    expect(body.food?.proteins).toBe(10);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});


describe('endpoint de estimativa por foto do prato', () => {
  const envWithKey = { ...env, GEMINI_API_KEY: 'gemini-test-key' } as unknown as Parameters<typeof worker.fetch>[1];
  const mealRequest = (body: unknown) => new Request('https://leve.sistcs.com/api/ai/meal-photo', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: 'Bearer test-token' },
    body: JSON.stringify(body),
  });

  it('recusa tipos de imagem não permitidos', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ id: 'user-1' }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const response = await worker.fetch(mealRequest({ mimeType: 'image/svg+xml', imageBase64: 'YWJj' }), envWithKey);
    expect(response.status).toBe(400);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('retorna estimativas validadas para revisão, após autenticação e quota', async () => {
    const estimates = { items: [{
      name: 'Arroz branco cozido', grams: 120, calories: 156, proteins: 3.2,
      carbohydrates: 34, fats: 0.4, fiber: 1.8, confidence: 'medium',
    }] };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 'user-1' }), { status: 200 }))
      .mockResolvedValueOnce(new Response('true', { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        candidates: [{ content: { parts: [{ text: JSON.stringify(estimates) }] } }],
      }), { status: 200, headers: { 'content-type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);
    const response = await worker.fetch(mealRequest({ mimeType: 'image/jpeg', imageBase64: 'YWJj' }), envWithKey);
    const body = await response.json() as { items?: Array<{ name: string; grams: number; calories: number }> };
    expect(response.status).toBe(200);
    expect(body.items).toHaveLength(1);
    expect(body.items?.[0]).toMatchObject({ name: 'Arroz branco cozido', grams: 120, calories: 156 });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
