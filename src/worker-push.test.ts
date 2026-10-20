import { afterEach, describe, expect, it, vi } from 'vitest';
import worker from '../worker';
import {
  DOSE_WINDOW_MINUTES,
  b64urlDecode,
  b64urlEncode,
  dueDoses,
  encryptPayload,
  runMedicationReminders,
  saoPauloClock,
  vapidAuthorization,
  type PushEnv,
} from '../worker-push';

const enc = new TextEncoder();
const dec = new TextDecoder();
const ab = (bytes: Uint8Array) => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;

async function hkdf(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, length: number) {
  const key = await crypto.subtle.importKey('raw', ab(ikm), 'HKDF', false, ['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt: ab(salt), info: ab(info) }, key, length * 8));
}

/** Decifrador do navegador (lado receptor), escrito à parte para validar o envio. */
async function decryptAsBrowser(body: Uint8Array, recipient: CryptoKeyPair, authSecret: Uint8Array): Promise<string> {
  const salt = body.slice(0, 16);
  const recordSize = new DataView(body.buffer, body.byteOffset).getUint32(16);
  const idLen = body[20];
  const asPublic = body.slice(21, 21 + idLen);
  const ciphertext = body.slice(21 + idLen);
  expect(recordSize).toBe(4096);
  expect(idLen).toBe(65);

  const uaPublic = new Uint8Array(await crypto.subtle.exportKey('raw', recipient.publicKey));
  const asKey = await crypto.subtle.importKey('raw', ab(asPublic), { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const shared = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: asKey }, recipient.privateKey, 256));
  const info = new Uint8Array([...enc.encode('WebPush: info\0'), ...uaPublic, ...asPublic]);
  const ikm = await hkdf(authSecret, shared, info, 32);
  const cek = await hkdf(salt, ikm, enc.encode('Content-Encoding: aes128gcm\0'), 16);
  const nonce = await hkdf(salt, ikm, enc.encode('Content-Encoding: nonce\0'), 12);
  const aes = await crypto.subtle.importKey('raw', ab(cek), 'AES-GCM', false, ['decrypt']);
  const padded = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: ab(nonce) }, aes, ab(ciphertext)));
  expect(padded[padded.length - 1]).toBe(2);
  return dec.decode(padded.slice(0, -1));
}

async function newSubscription() {
  const keys = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const auth = crypto.getRandomValues(new Uint8Array(16));
  const p256dh = b64urlEncode(new Uint8Array(await crypto.subtle.exportKey('raw', keys.publicKey)));
  return { keys, auth, p256dh, authB64: b64urlEncode(auth) };
}

async function newVapid() {
  const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const publicKey = b64urlEncode(new Uint8Array(await crypto.subtle.exportKey('raw', pair.publicKey)));
  const jwk = await crypto.subtle.exportKey('jwk', pair.privateKey);
  return { pair, publicKey, privateKey: jwk.d as string };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('criptografia do Web Push (RFC 8291)', () => {
  it('o navegador consegue decifrar o que o servidor cifrou', async () => {
    const sub = await newSubscription();
    const message = JSON.stringify({ title: 'Olá', body: 'Dose agendada ✓' });
    const body = await encryptPayload(enc.encode(message), sub.p256dh, sub.authB64);
    expect(await decryptAsBrowser(body, sub.keys, sub.auth)).toBe(message);
  });

  it('usa sal e chave novos a cada envio', async () => {
    const sub = await newSubscription();
    const a = await encryptPayload(enc.encode('x'), sub.p256dh, sub.authB64);
    const b = await encryptPayload(enc.encode('x'), sub.p256dh, sub.authB64);
    expect(b64urlEncode(a)).not.toBe(b64urlEncode(b));
  });

  it('recusa chaves e mensagens inválidas', async () => {
    const sub = await newSubscription();
    await expect(encryptPayload(enc.encode('x'), 'curta', sub.authB64)).rejects.toThrow();
    await expect(encryptPayload(enc.encode('x'), sub.p256dh, 'a')).rejects.toThrow();
    await expect(encryptPayload(new Uint8Array(4000), sub.p256dh, sub.authB64)).rejects.toThrow();
  });
});

describe('assinatura VAPID (RFC 8292)', () => {
  it('gera um JWT ES256 válido para o serviço de push do endpoint', async () => {
    const vapid = await newVapid();
    const header = await vapidAuthorization('https://push.example.com/send/abc', 'https://leve.sistcs.com', vapid.publicKey, vapid.privateKey, 1_000_000_000_000);
    const match = /^vapid t=([\w-]+)\.([\w-]+)\.([\w-]+), k=([\w-]+)$/.exec(header);
    expect(match).not.toBeNull();
    const [, h, c, s, k] = match!;
    expect(k).toBe(vapid.publicKey);
    expect(JSON.parse(dec.decode(b64urlDecode(h)))).toEqual({ typ: 'JWT', alg: 'ES256' });
    expect(JSON.parse(dec.decode(b64urlDecode(c)))).toEqual({ aud: 'https://push.example.com', exp: 1_000_000_000 + 12 * 3600, sub: 'https://leve.sistcs.com' });
    const ok = await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, vapid.pair.publicKey, ab(b64urlDecode(s)), ab(enc.encode(`${h}.${c}`)));
    expect(ok).toBe(true);
  });
});

describe('doses no horário', () => {
  // 2026-10-19 15:30 em São Paulo (UTC-3).
  const now = new Date('2026-10-19T18:30:30Z');
  const med = (id: string, times: string[] | null, user = 'u1') => ({ id, user_id: user, times });

  it('lê data e hora no fuso de São Paulo', () => {
    expect(saoPauloClock(now)).toEqual({ date: '2026-10-19', minutes: 15 * 60 + 30 });
    expect(saoPauloClock(new Date('2026-10-20T02:59:00Z'))).toEqual({ date: '2026-10-19', minutes: 23 * 60 + 59 });
  });

  it('avisa a dose cujo horário chegou há menos de 10 minutos', () => {
    expect(dueDoses([med('m1', ['15:30'])], [], now)).toEqual([{ userId: 'u1', key: 'dose:m1:2026-10-19:15:30' }]);
    expect(dueDoses([med('m1', ['15:21'])], [], now)).toHaveLength(1);
    expect(dueDoses([med('m1', [`15:${30 - DOSE_WINDOW_MINUTES}`])], [], now)).toHaveLength(0);
  });

  it('não avisa horário futuro, dose já marcada nem horário inválido', () => {
    expect(dueDoses([med('m1', ['15:31'])], [], now)).toEqual([]);
    expect(dueDoses([med('m1', ['15:30'])], [{ medication_id: 'm1', log_date: '2026-10-19', scheduled_time: '15:30' }], now)).toEqual([]);
    expect(dueDoses([med('m1', ['15:30'])], [{ medication_id: 'm1', log_date: '2026-10-19', scheduled_time: '15:30:00' }], now)).toEqual([]);
    expect(dueDoses([med('m1', ['25:00', 'abc', ''])], [], now)).toEqual([]);
    expect(dueDoses([med('m1', null)], [], now)).toEqual([]);
  });

  it('dose marcada em outro dia não conta como tomada hoje', () => {
    expect(dueDoses([med('m1', ['15:30'])], [{ medication_id: 'm1', log_date: '2026-10-18', scheduled_time: '15:30' }], now)).toHaveLength(1);
  });
});

describe('agendador de lembretes', () => {
  async function setup() {
    const vapid = await newVapid();
    const sub = await newSubscription();
    const env: PushEnv = {
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_ANON_KEY: 'anon',
      SUPABASE_SERVICE_ROLE_KEY: 'service-secret',
      VAPID_PUBLIC_KEY: vapid.publicKey,
      VAPID_PRIVATE_KEY: vapid.privateKey,
    };
    return { env, sub };
  }
  const now = new Date('2026-10-19T18:30:30Z');
  const json = (data: unknown) => new Response(JSON.stringify(data), { status: 200 });

  it('sem configuração do servidor, não faz nada nem chama a rede', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    expect(await runMedicationReminders({ SUPABASE_URL: 'x', SUPABASE_ANON_KEY: 'y' }, now)).toEqual({ due: 0, notified: 0 });
    expect(fetchMock.mock.calls).toHaveLength(0);
  });

  it('reserva a dose, envia uma notificação genérica e criptografada', async () => {
    const { env, sub } = await setup();
    const pushBodies: Uint8Array[] = [];
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes('/rest/v1/medications')) return json([{ id: 'm1', user_id: 'u1', times: ['15:30'] }]);
      if (url.includes('/rest/v1/medication_logs')) return json([]);
      if (url.includes('/rest/v1/push_sent') && init?.method === 'POST') return json([{ user_id: 'u1', dedupe_key: 'dose:m1:2026-10-19:15:30' }]);
      if (url.includes('/rest/v1/push_subscriptions')) return json([{ id: 's1', user_id: 'u1', endpoint: 'https://push.example.com/abc', p256dh: sub.p256dh, auth: sub.authB64 }]);
      if (url.startsWith('https://push.example.com/')) {
        pushBodies.push(new Uint8Array(init!.body as ArrayBuffer));
        expect((init!.headers as Record<string, string>)['content-encoding']).toBe('aes128gcm');
        expect((init!.headers as Record<string, string>).authorization).toMatch(/^vapid t=/);
        return new Response(null, { status: 201 });
      }
      return json([]);
    });
    vi.stubGlobal('fetch', fetchMock);

    expect(await runMedicationReminders(env, now)).toEqual({ due: 1, notified: 1 });
    const text = await decryptAsBrowser(pushBodies[0], sub.keys, sub.auth);
    const message = JSON.parse(text) as { title: string; body: string };
    expect(message.title).toBe('Lembrete do SISTCS Leve');
    // Nenhum dado de saúde no texto do aviso.
    expect(`${message.title} ${message.body}`).not.toMatch(/m1|medicamento|caneta|remédio/i);
  });

  it('dose já reservada (aviso anterior) não é enviada de novo', async () => {
    const { env } = await setup();
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes('/rest/v1/medications')) return json([{ id: 'm1', user_id: 'u1', times: ['15:30'] }]);
      if (url.includes('/rest/v1/medication_logs')) return json([]);
      if (url.includes('/rest/v1/push_sent') && init?.method === 'POST') return json([]); // já existia
      throw new Error(`chamada inesperada: ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);
    expect(await runMedicationReminders(env, now)).toEqual({ due: 1, notified: 0 });
  });

  it('inscrição que não existe mais (410) é apagada', async () => {
    const { env, sub } = await setup();
    const deleted: string[] = [];
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes('/rest/v1/medications')) return json([{ id: 'm1', user_id: 'u1', times: ['15:30'] }]);
      if (url.includes('/rest/v1/medication_logs')) return json([]);
      if (url.includes('/rest/v1/push_sent') && init?.method === 'POST') return json([{ user_id: 'u1', dedupe_key: 'k' }]);
      if (url.includes('/rest/v1/push_subscriptions') && init?.method === 'DELETE') { deleted.push(url); return json([]); }
      if (url.includes('/rest/v1/push_subscriptions')) return json([{ id: 's1', user_id: 'u1', endpoint: 'https://push.example.com/abc', p256dh: sub.p256dh, auth: sub.authB64 }]);
      if (url.startsWith('https://push.example.com/')) return new Response(null, { status: 410 });
      return json([]);
    }));
    await runMedicationReminders(env, now);
    expect(deleted).toHaveLength(1);
    expect(deleted[0]).toContain('id=eq.s1');
  });

  it('falha passageira libera a reserva para tentar no minuto seguinte', async () => {
    const { env, sub } = await setup();
    const released: string[] = [];
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes('/rest/v1/medications')) return json([{ id: 'm1', user_id: 'u1', times: ['15:30'] }]);
      if (url.includes('/rest/v1/medication_logs')) return json([]);
      if (url.includes('/rest/v1/push_sent') && init?.method === 'POST') return json([{ user_id: 'u1', dedupe_key: 'dose:m1:2026-10-19:15:30' }]);
      if (url.includes('/rest/v1/push_sent') && init?.method === 'DELETE') { released.push(url); return json([]); }
      if (url.includes('/rest/v1/push_subscriptions')) return json([{ id: 's1', user_id: 'u1', endpoint: 'https://push.example.com/abc', p256dh: sub.p256dh, auth: sub.authB64 }]);
      if (url.startsWith('https://push.example.com/')) return new Response(null, { status: 503 });
      return json([]);
    }));
    expect(await runMedicationReminders(env, now)).toEqual({ due: 1, notified: 0 });
    expect(released.some((url) => url.includes('dedupe_key=in.(dose'))).toBe(true);
  });
});

describe('agendador: escala e limpeza', () => {
  const json = (data: unknown) => new Response(JSON.stringify(data), { status: 200 });
  const env: PushEnv = {
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_ANON_KEY: 'anon',
    SUPABASE_SERVICE_ROLE_KEY: 'svc',
    VAPID_PUBLIC_KEY: 'p',
    VAPID_PRIVATE_KEY: 'q',
  };

  it('lê todas as páginas de medicamentos (o servidor corta em 1.000 linhas)', async () => {
    const pages: string[] = [];
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/rest/v1/medications')) {
        pages.push(url);
        const offset = Number(/offset=(\d+)/.exec(url)![1]);
        const size = offset === 0 ? 1000 : 5;
        return json(Array.from({ length: size }, (_, i) => ({ id: `m${offset + i}`, user_id: 'u', times: ['03:00'] })));
      }
      return json([]);
    }));
    // 15:30 em São Paulo: ninguém tem dose às 03:00, então não há envio.
    expect(await runMedicationReminders(env, new Date('2026-10-19T18:30:30Z'))).toEqual({ due: 0, notified: 0 });
    expect(pages).toHaveLength(2);
    expect(pages[1]).toContain('offset=1000');
  });

  it('limpa reservas antigas uma vez por hora, mesmo sem dose no horário', async () => {
    const deletes: string[] = [];
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (init?.method === 'DELETE') deletes.push(url);
      return json([]);
    }));
    await runMedicationReminders(env, new Date('2026-10-19T18:30:00Z'));
    expect(deletes).toHaveLength(0);
    await runMedicationReminders(env, new Date('2026-10-19T19:00:00Z'));
    expect(deletes).toHaveLength(1);
    expect(deletes[0]).toContain('push_sent?sent_at=lt.');
  });
});

describe('rotas /api/push do Worker', () => {
  const assets = { fetch: vi.fn(async () => new Response('app')) };
  const base = { ASSETS: assets, SUPABASE_URL: 'https://example.supabase.co', SUPABASE_ANON_KEY: 'anon' };

  it('sem configuração, a chave pública responde 503 com mensagem clara', async () => {
    const response = await worker.fetch(new Request('https://leve.sistcs.com/api/push/key'), base as never);
    expect(response.status).toBe(503);
    expect(((await response.json()) as { error: string }).error).toMatch(/ainda não foram ativadas/);
  });

  it('configurado, entrega só a chave pública', async () => {
    const env = { ...base, VAPID_PUBLIC_KEY: 'PUB', VAPID_PRIVATE_KEY: 'PRIV', SUPABASE_SERVICE_ROLE_KEY: 'SVC' };
    const response = await worker.fetch(new Request('https://leve.sistcs.com/api/push/key'), env as never);
    const text = await response.text();
    expect(JSON.parse(text)).toEqual({ publicKey: 'PUB' });
    expect(text).not.toContain('PRIV');
    expect(text).not.toContain('SVC');
  });

  it('o teste é limitado a um por minuto por pessoa', async () => {
    const env = { ...base, VAPID_PUBLIC_KEY: 'PUB', VAPID_PRIVATE_KEY: 'PRIV', SUPABASE_SERVICE_ROLE_KEY: 'SVC' };
    let claimed = [{ user_id: 'u1' }];
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/auth/v1/user')) return new Response(JSON.stringify({ id: 'u1' }), { status: 200 });
      if (url.includes('/rest/v1/push_sent')) return new Response(JSON.stringify(claimed), { status: 200 });
      if (url.includes('/rest/v1/push_subscriptions')) return new Response('[]', { status: 200 });
      return new Response('[]', { status: 200 });
    }));
    const call = () => worker.fetch(new Request('https://leve.sistcs.com/api/push/test', { method: 'POST', headers: { authorization: 'Bearer t' } }), env as never);
    // Primeiro teste passa da reserva e só então descobre que não há aparelho ativado (404).
    expect((await call()).status).toBe(404);
    // Segundo teste no mesmo minuto: a reserva já existia.
    claimed = [];
    expect((await call()).status).toBe(429);
  });

  it('o teste exige login', async () => {
    const env = { ...base, VAPID_PUBLIC_KEY: 'PUB', VAPID_PRIVATE_KEY: 'PRIV', SUPABASE_SERVICE_ROLE_KEY: 'SVC' };
    const response = await worker.fetch(new Request('https://leve.sistcs.com/api/push/test', { method: 'POST' }), env as never);
    expect(response.status).toBe(401);
  });
});
