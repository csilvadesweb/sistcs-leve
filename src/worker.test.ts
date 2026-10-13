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
});
