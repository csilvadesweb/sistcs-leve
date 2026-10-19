/**
 * Notificações push (Web Push) para o Worker: criptografia da mensagem
 * (RFC 8291, aes128gcm), assinatura VAPID (RFC 8292) e o agendador de lembretes
 * de medicamento. Usa só WebCrypto e fetch, sem dependências.
 *
 * Privacidade: o texto da notificação é genérico. Nome de medicamento e outros
 * dados de saúde nunca vão no push, pois ele passa pelo serviço do navegador.
 */

export interface PushEnv {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  /** Segredo: chave de serviço do Supabase (nunca vai ao navegador). */
  SUPABASE_SERVICE_ROLE_KEY?: string;
  /** Chave pública VAPID (base64url, 65 bytes). */
  VAPID_PUBLIC_KEY?: string;
  /** Segredo: chave privada VAPID (base64url, 32 bytes). */
  VAPID_PRIVATE_KEY?: string;
  VAPID_SUBJECT?: string;
}

export interface PushSubscriptionRow {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface PushMessage {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

const encoder = new TextEncoder();

/* ------------------------------ utilidades ------------------------------ */

export function b64urlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function b64urlDecode(text: string): Uint8Array {
  const padded = text.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(text.length / 4) * 4, '=');
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function concat(...parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

/** Entrega um ArrayBuffer "puro" ao WebCrypto (evita incompatibilidade de tipos com buffers compartilhados). */
const buf = (bytes: Uint8Array): ArrayBuffer => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;

async function hkdf(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', buf(ikm), 'HKDF', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt: buf(salt), info: buf(info) }, key, length * 8);
  return new Uint8Array(bits);
}

/* ---------------------------- criptografia RFC 8291 --------------------------- */

export interface EncryptOptions {
  /** Só para testes: sal e par de chaves fixos. */
  salt?: Uint8Array;
  senderKeys?: CryptoKeyPair;
}

/**
 * Criptografa `plaintext` para a inscrição (p256dh e auth em base64url) no formato
 * aes128gcm do Web Push, em um único registro.
 */
export async function encryptPayload(
  plaintext: Uint8Array,
  p256dh: string,
  authSecret: string,
  options: EncryptOptions = {},
): Promise<Uint8Array> {
  const uaPublic = b64urlDecode(p256dh);
  const auth = b64urlDecode(authSecret);
  if (uaPublic.length !== 65 || uaPublic[0] !== 4) throw new Error('Chave p256dh inválida.');
  if (auth.length < 16) throw new Error('Segredo auth inválido.');
  if (plaintext.length > 3993) throw new Error('Mensagem grande demais para um registro push.');

  const sender = options.senderKeys ?? (await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']));
  const asPublic = new Uint8Array(await crypto.subtle.exportKey('raw', sender.publicKey));
  const uaKey = await crypto.subtle.importKey('raw', buf(uaPublic), { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const ecdhSecret = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: uaKey }, sender.privateKey, 256));

  const salt = options.salt ?? crypto.getRandomValues(new Uint8Array(16));
  const keyInfo = concat(encoder.encode('WebPush: info\0'), uaPublic, asPublic);
  const ikm = await hkdf(auth, ecdhSecret, keyInfo, 32);
  const cek = await hkdf(salt, ikm, encoder.encode('Content-Encoding: aes128gcm\0'), 16);
  const nonce = await hkdf(salt, ikm, encoder.encode('Content-Encoding: nonce\0'), 12);

  // 0x02 marca o último (e único) registro.
  const padded = concat(plaintext, new Uint8Array([2]));
  const aes = await crypto.subtle.importKey('raw', buf(cek), 'AES-GCM', false, ['encrypt']);
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: buf(nonce) }, aes, buf(padded)));

  const recordSize = new Uint8Array([0, 0, 0x10, 0]); // 4096
  return concat(salt, recordSize, new Uint8Array([asPublic.length]), asPublic, ciphertext);
}

/* ------------------------------- VAPID (RFC 8292) ------------------------------ */

async function importVapidPrivateKey(privateKey: string, publicKey: string): Promise<CryptoKey> {
  const pub = b64urlDecode(publicKey);
  if (pub.length !== 65 || pub[0] !== 4) throw new Error('Chave pública VAPID inválida.');
  const d = b64urlDecode(privateKey);
  if (d.length !== 32) throw new Error('Chave privada VAPID inválida.');
  const jwk: JsonWebKey = {
    kty: 'EC',
    crv: 'P-256',
    d: b64urlEncode(d),
    x: b64urlEncode(pub.slice(1, 33)),
    y: b64urlEncode(pub.slice(33, 65)),
    ext: true,
  };
  return crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
}

/** Cabeçalho Authorization (esquema vapid) para o serviço de push do `endpoint`. */
export async function vapidAuthorization(
  endpoint: string,
  subject: string,
  publicKey: string,
  privateKey: string,
  nowMs: number = Date.now(),
): Promise<string> {
  const audience = new URL(endpoint).origin;
  const header = b64urlEncode(encoder.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const claims = b64urlEncode(encoder.encode(JSON.stringify({ aud: audience, exp: Math.floor(nowMs / 1000) + 12 * 3600, sub: subject })));
  const unsigned = `${header}.${claims}`;
  const key = await importVapidPrivateKey(privateKey, publicKey);
  // WebCrypto já entrega a assinatura no formato r||s exigido pelo JWT.
  const signature = new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, buf(encoder.encode(unsigned))));
  return `vapid t=${unsigned}.${b64urlEncode(signature)}, k=${publicKey}`;
}

/* ---------------------------------- envio ---------------------------------- */

export type SendResult = 'sent' | 'gone' | 'error';

export function pushConfigured(env: PushEnv): boolean {
  return Boolean(env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY && env.SUPABASE_SERVICE_ROLE_KEY);
}

/**
 * Envia uma mensagem a uma inscrição. `gone` = a inscrição não existe mais
 * (404/410) e deve ser apagada; `error` = falha passível de nova tentativa.
 */
export async function sendPush(env: PushEnv, sub: PushSubscriptionRow, message: PushMessage, nowMs: number = Date.now()): Promise<SendResult> {
  try {
    const endpoint = new URL(sub.endpoint);
    if (endpoint.protocol !== 'https:') return 'gone';
    const body = await encryptPayload(encoder.encode(JSON.stringify(message)), sub.p256dh, sub.auth);
    const authorization = await vapidAuthorization(
      sub.endpoint,
      env.VAPID_SUBJECT || 'https://leve.sistcs.com',
      env.VAPID_PUBLIC_KEY as string,
      env.VAPID_PRIVATE_KEY as string,
      nowMs,
    );
    const response = await fetch(sub.endpoint, {
      method: 'POST',
      headers: {
        authorization,
        'content-encoding': 'aes128gcm',
        'content-type': 'application/octet-stream',
        ttl: '900',
        urgency: 'high',
      },
      body: buf(body),
      signal: AbortSignal.timeout(10_000),
    });
    if (response.ok) return 'sent';
    if (response.status === 404 || response.status === 410) return 'gone';
    return 'error';
  } catch {
    return 'error';
  }
}

/* ------------------------- doses de medicamento no horário ------------------------- */

export const DOSE_WINDOW_MINUTES = 10;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export interface MedicationRow {
  id: string;
  user_id: string;
  times: string[] | null;
}
export interface DoseLogRow {
  medication_id: string;
  log_date: string;
  scheduled_time: string;
}
export interface DueDose {
  userId: string;
  /** Identifica a dose naquele dia; evita avisar duas vezes. */
  key: string;
}

/** Data (AAAA-MM-DD) e minutos desde a meia-noite no fuso de São Paulo. */
export function saoPauloClock(now: Date): { date: string; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '00';
  return { date: `${get('year')}-${get('month')}-${get('day')}`, minutes: Number(get('hour')) * 60 + Number(get('minute')) };
}

/**
 * Doses cujo horário chegou há menos de DOSE_WINDOW_MINUTES e que ainda não foram
 * marcadas como tomadas. A janela cobre atrasos ou saltos do agendador.
 */
export function dueDoses(medications: MedicationRow[], logs: DoseLogRow[], now: Date): DueDose[] {
  const { date, minutes } = saoPauloClock(now);
  const taken = new Set(logs.filter((log) => log.log_date === date).map((log) => `${log.medication_id}|${log.scheduled_time.slice(0, 5)}`));
  const due: DueDose[] = [];
  for (const medication of medications) {
    for (const time of medication.times ?? []) {
      const match = TIME_RE.exec(time);
      if (!match) continue;
      const elapsed = minutes - (Number(match[1]) * 60 + Number(match[2]));
      if (elapsed < 0 || elapsed >= DOSE_WINDOW_MINUTES) continue;
      if (taken.has(`${medication.id}|${time}`)) continue;
      due.push({ userId: medication.user_id, key: `dose:${medication.id}:${date}:${time}` });
    }
  }
  return due;
}

export const MEDICATION_MESSAGE: PushMessage = {
  title: 'Lembrete do SISTCS Leve',
  body: 'Você tem uma dose agendada agora. Toque para conferir e registrar.',
  url: './#/medicamentos',
  tag: 'sistcs-leve-medication',
};

export const TEST_MESSAGE: PushMessage = {
  title: 'Teste de notificação',
  body: 'Funcionou! Os lembretes chegam mesmo com o app fechado.',
  url: './',
  tag: 'sistcs-leve-test',
};

/* ------------------------------ Supabase (serviço) ------------------------------ */

function serviceHeaders(env: PushEnv, extra: Record<string, string> = {}): Record<string, string> {
  const key = env.SUPABASE_SERVICE_ROLE_KEY as string;
  return { apikey: key, authorization: `Bearer ${key}`, 'content-type': 'application/json', ...extra };
}

async function rest<T>(env: PushEnv, path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: serviceHeaders(env, init.headers as Record<string, string> | undefined),
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`Supabase ${response.status} em ${path.split('?')[0]}`);
  const text = await response.text();
  return (text ? JSON.parse(text) : []) as T;
}

export async function subscriptionsFor(env: PushEnv, userIds: string[]): Promise<PushSubscriptionRow[]> {
  if (!userIds.length) return [];
  const list = userIds.map((id) => encodeURIComponent(id)).join(',');
  return rest<PushSubscriptionRow[]>(env, `push_subscriptions?select=id,user_id,endpoint,p256dh,auth&user_id=in.(${list})`);
}

async function deleteSubscription(env: PushEnv, id: string) {
  await rest(env, `push_subscriptions?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => undefined);
}

/** Envia a mesma mensagem a todas as inscrições; apaga as que não existem mais. */
export async function sendToSubscriptions(env: PushEnv, subs: PushSubscriptionRow[], message: PushMessage): Promise<{ sent: number; errors: number }> {
  let sent = 0;
  let errors = 0;
  for (const sub of subs) {
    const result = await sendPush(env, sub, message);
    if (result === 'sent') sent += 1;
    else if (result === 'gone') await deleteSubscription(env, sub.id);
    else errors += 1;
  }
  return { sent, errors };
}

/** Id do usuário dono do token Bearer, ou null. */
export async function bearerUserId(request: Request, env: PushEnv): Promise<string | null> {
  const authorization = request.headers.get('authorization') ?? '';
  if (!/^Bearer\s+[^\s]+$/i.test(authorization)) return null;
  try {
    const response = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
      headers: { authorization, apikey: env.SUPABASE_ANON_KEY },
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) return null;
    const user = (await response.json()) as { id?: unknown };
    return typeof user.id === 'string' && user.id ? user.id : null;
  } catch {
    return null;
  }
}

/**
 * Rodado a cada minuto pelo agendador: avisa quem tem dose no horário.
 * Cada dose é "reservada" na tabela push_sent antes do envio, então uma dose
 * nunca gera dois avisos, mesmo se duas execuções se sobrepuserem.
 */
export async function runMedicationReminders(env: PushEnv, now: Date = new Date()): Promise<{ due: number; notified: number }> {
  if (!pushConfigured(env)) return { due: 0, notified: 0 };
  const { date } = saoPauloClock(now);
  const medications = await rest<MedicationRow[]>(env, 'medications?select=id,user_id,times&active=eq.true');
  const logs = await rest<DoseLogRow[]>(env, `medication_logs?select=medication_id,log_date,scheduled_time&log_date=eq.${date}`);
  const due = dueDoses(medications, logs, now);
  if (!due.length) return { due: 0, notified: 0 };

  const claimed = await rest<Array<{ user_id: string; dedupe_key: string }>>(env, 'push_sent?on_conflict=user_id,dedupe_key', {
    method: 'POST',
    headers: { prefer: 'resolution=ignore-duplicates,return=representation' },
    body: JSON.stringify(due.map((dose) => ({ user_id: dose.userId, dedupe_key: dose.key }))),
  });
  const users = [...new Set(claimed.map((row) => row.user_id))];
  if (!users.length) return { due: due.length, notified: 0 };

  const subs = await subscriptionsFor(env, users);
  let notified = 0;
  for (const userId of users) {
    const mine = subs.filter((sub) => sub.user_id === userId);
    const { sent, errors } = await sendToSubscriptions(env, mine, MEDICATION_MESSAGE);
    notified += sent;
    // Falha passageira em todos os aparelhos: libera a reserva para tentar no próximo minuto.
    if (sent === 0 && errors > 0) {
      const keys = claimed.filter((row) => row.user_id === userId).map((row) => encodeURIComponent(row.dedupe_key)).join(',');
      await rest(env, `push_sent?user_id=eq.${encodeURIComponent(userId)}&dedupe_key=in.(${keys})`, { method: 'DELETE' }).catch(() => undefined);
    }
  }
  // Limpeza: reservas com mais de 3 dias não servem mais.
  const cutoff = new Date(now.getTime() - 3 * 24 * 3600 * 1000).toISOString();
  await rest(env, `push_sent?sent_at=lt.${encodeURIComponent(cutoff)}`, { method: 'DELETE' }).catch(() => undefined);
  return { due: due.length, notified };
}
