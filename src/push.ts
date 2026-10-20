import { supabase } from './supabase';

/**
 * Notificações push com o app fechado. O navegador cria uma "inscrição" que fica
 * guardada na conta (tabela push_subscriptions); o servidor usa ela para avisar.
 */

export type PushSupport = 'supported' | 'unsupported';

export function pushSupport(): PushSupport {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
    ? 'supported'
    : 'unsupported';
}

/** Converte a chave pública VAPID (base64url) no formato que o navegador pede. */
export function urlBase64ToBytes(text: string): Uint8Array {
  const padded = text.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(text.length / 4) * 4, '=');
  const raw = atob(padded);
  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
}

function toBase64Url(buffer: ArrayBuffer | null): string {
  if (!buffer) return '';
  let binary = '';
  for (const byte of new Uint8Array(buffer)) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function accessToken(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Entre na sua conta para ativar as notificações.');
  return token;
}

export class PushUnavailableError extends Error {}

async function fetchPublicKey(): Promise<string> {
  const response = await fetch('/api/push/key');
  const body = (await response.json().catch(() => ({}))) as { publicKey?: string; error?: string };
  if (!response.ok || !body.publicKey) throw new PushUnavailableError(body.error || 'As notificações com o app fechado ainda não foram ativadas no servidor.');
  return body.publicKey;
}

/** `serviceWorker.ready` nunca resolve se o service worker não foi registrado (por exemplo, fora da versão publicada). */
async function readyRegistration(timeoutMs = 6000): Promise<ServiceWorkerRegistration> {
  const timeout = new Promise<never>((_, reject) => {
    window.setTimeout(() => reject(new PushUnavailableError('O app ainda não está pronto para notificações. Recarregue a página e tente de novo.')), timeoutMs);
  });
  return Promise.race([navigator.serviceWorker.ready, timeout]);
}

async function currentSubscription(): Promise<PushSubscription | null> {
  if (pushSupport() === 'unsupported') return null;
  const registration = await readyRegistration();
  return registration.pushManager.getSubscription();
}

/** Este aparelho já está inscrito (e a inscrição ainda existe na conta)? */
export async function isPushEnabled(): Promise<boolean> {
  try {
    const subscription = await currentSubscription();
    if (!subscription || Notification.permission !== 'granted') return false;
    const { data, error } = await supabase.from('push_subscriptions').select('id').eq('endpoint', subscription.endpoint).maybeSingle();
    return !error && Boolean(data);
  } catch {
    return false;
  }
}

export async function enablePush(): Promise<void> {
  if (pushSupport() === 'unsupported') throw new Error('Este navegador não oferece notificações push. No iPhone, instale o app na tela inicial primeiro.');
  const publicKey = await fetchPublicKey();
  const permission = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('Permissão negada. Ative as notificações nas configurações do navegador para este site.');

  const registration = await readyRegistration();
  const subscription =
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToBytes(publicKey) as BufferSource }));

  const p256dh = toBase64Url(subscription.getKey('p256dh'));
  const auth = toBase64Url(subscription.getKey('auth'));
  if (!p256dh || !auth) throw new Error('O navegador não forneceu as chaves da inscrição.');
  const { error } = await supabase
    .from('push_subscriptions')
    .upsert({ endpoint: subscription.endpoint, p256dh, auth, user_agent: navigator.userAgent.slice(0, 200) }, { onConflict: 'endpoint' });
  if (error) throw new Error('Não foi possível salvar a inscrição na sua conta. Tente novamente.');
}

export async function disablePush(): Promise<void> {
  const subscription = await currentSubscription();
  if (!subscription) return;
  await supabase.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint);
  await subscription.unsubscribe();
}

export async function sendTestPush(): Promise<void> {
  const token = await accessToken();
  const response = await fetch('/api/push/test', { method: 'POST', headers: { authorization: `Bearer ${token}` } });
  const body = (await response.json().catch(() => ({}))) as { error?: string };
  if (!response.ok) throw new Error(body.error || 'Não foi possível enviar o teste.');
}
