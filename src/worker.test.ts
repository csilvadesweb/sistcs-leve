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
