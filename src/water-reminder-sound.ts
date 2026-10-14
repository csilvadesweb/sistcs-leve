import { MAX_CUSTOM_SOUND_SECONDS } from './water-reminder-custom-sound';

let audioContext: AudioContext | null = null;

const DB_NAME = 'sistcs-leve-sounds';
const STORE = 'sounds';
const KEY = 'water';

type StoredSound = { blob: Blob; name: string };

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const request = run(db.transaction(STORE, mode).objectStore(STORE));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}

/** O som escolhido fica apenas neste aparelho (IndexedDB); nada é enviado para servidores. */
export async function saveCustomWaterSound(file: File): Promise<void> {
  await withStore('readwrite', (store) => store.put({ blob: file, name: file.name } satisfies StoredSound, KEY));
}

export async function getCustomWaterSoundName(): Promise<string | null> {
  try {
    const stored = await withStore<StoredSound | undefined>('readonly', (store) => store.get(KEY));
    return stored?.name ?? null;
  } catch {
    return null;
  }
}

export async function clearCustomWaterSound(): Promise<void> {
  try {
    await withStore('readwrite', (store) => store.delete(KEY));
  } catch {
    // Sem armazenamento disponível não há nada a remover.
  }
}

async function playCustomSound(): Promise<boolean> {
  try {
    const stored = await withStore<StoredSound | undefined>('readonly', (store) => store.get(KEY));
    if (!stored) return false;
    const url = URL.createObjectURL(stored.blob);
    const audio = new Audio(url);
    return await new Promise<boolean>((resolve) => {
      let finished = false;
      const finish = (ok: boolean) => {
        if (finished) return;
        finished = true;
        audio.pause();
        URL.revokeObjectURL(url);
        resolve(ok);
      };
      audio.onended = () => finish(true);
      audio.onerror = () => finish(false);
      window.setTimeout(() => finish(true), MAX_CUSTOM_SOUND_SECONDS * 1000);
      audio.play().catch(() => finish(false));
    });
  } catch {
    return false;
  }
}

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Context = window.AudioContext;
  if (!Context) return null;
  if (!audioContext || audioContext.state === 'closed') audioContext = new Context();
  return audioContext;
}

/** Deve ser chamado em resposta a uma ação do usuário para cumprir a política de autoplay. */
export async function prepareWaterReminderAudio(): Promise<boolean> {
  try {
    const context = getAudioContext();
    if (!context) return false;
    if (context.state === 'suspended') await context.resume();
    return context.state === 'running';
  } catch {
    return false;
  }
}

/** Toca o som escolhido pela pessoa (se houver) ou um toque curto e discreto; não altera o som do canal de notificações do sistema. */
export async function playWaterReminderSound(): Promise<boolean> {
  if (await playCustomSound()) return true;
  try {
    const ready = await prepareWaterReminderAudio();
    const context = getAudioContext();
    if (!ready || !context) return false;
    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, now);
    oscillator.frequency.setValueAtTime(660, now + 0.12);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.3);
    return true;
  } catch {
    return false;
  }
}
