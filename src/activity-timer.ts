/**
 * Cronômetro de treino no estilo do app Treino do Apple Watch:
 * iniciar → pausar/continuar → parar → salvar (ou zerar).
 *
 * O estado é guardado com horários absolutos, então o tempo continua certo
 * mesmo que a página seja recarregada, a aba fique em segundo plano ou o
 * usuário navegue para outra tela e volte.
 */

export type TimerStatus = 'idle' | 'running' | 'paused' | 'stopped';

export interface TimerState {
  status: TimerStatus;
  /** Tempo já contado em trechos anteriores (antes da última pausa). */
  accumulatedMs: number;
  /** Quando o trecho atual começou; só existe enquanto estiver rodando. */
  segmentStartedAt: number | null;
  /** Dia (AAAA-MM-DD) em que a sessão começou; é a data do exercício salvo. */
  startedDate: string | null;
  exerciseName: string;
}

/** Sessões com menos que isso não viram registro (o banco exige ao menos 1 minuto). */
export const MIN_SAVE_SECONDS = 30;

const TIMER_KEY = 'sistcs-leve-activity-timer-v1';
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function idleTimer(exerciseName: string): TimerState {
  return { status: 'idle', accumulatedMs: 0, segmentStartedAt: null, startedDate: null, exerciseName };
}

export function elapsedMs(state: TimerState, now: number): number {
  const running = state.status === 'running' && state.segmentStartedAt !== null
    ? Math.max(0, now - state.segmentStartedAt)
    : 0;
  return state.accumulatedMs + running;
}

export function elapsedSeconds(state: TimerState, now: number): number {
  return Math.floor(elapsedMs(state, now) / 1000);
}

export function startTimer(state: TimerState, now: number, date: string): TimerState {
  if (state.status !== 'idle') return state;
  return { ...state, status: 'running', accumulatedMs: 0, segmentStartedAt: now, startedDate: date };
}

export function pauseTimer(state: TimerState, now: number): TimerState {
  if (state.status !== 'running') return state;
  return { ...state, status: 'paused', accumulatedMs: elapsedMs(state, now), segmentStartedAt: null };
}

export function resumeTimer(state: TimerState, now: number): TimerState {
  if (state.status !== 'paused') return state;
  return { ...state, status: 'running', segmentStartedAt: now };
}

/** Encerra a sessão (rodando ou pausada) e congela o tempo para revisão e salvamento. */
export function stopTimer(state: TimerState, now: number): TimerState {
  if (state.status !== 'running' && state.status !== 'paused') return state;
  return { ...state, status: 'stopped', accumulatedMs: elapsedMs(state, now), segmentStartedAt: null };
}

/** Minutos a registrar, ou null quando a sessão foi curta demais. */
export function sessionMinutes(seconds: number): number | null {
  if (!Number.isFinite(seconds) || seconds < MIN_SAVE_SECONDS) return null;
  return Math.max(1, Math.round(seconds / 60));
}

export function formatClock(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((part) => String(part).padStart(2, '0')).join(':');
}

/** Valida o que veio do armazenamento; qualquer coisa estranha vira um cronômetro parado. */
export function parseTimerState(value: unknown, fallbackExercise: string): TimerState {
  const fallback = idleTimer(fallbackExercise);
  if (!value || typeof value !== 'object') return fallback;
  const raw = value as Record<string, unknown>;

  const status = raw.status;
  if (status !== 'running' && status !== 'paused' && status !== 'stopped') return fallback;

  const accumulatedMs = raw.accumulatedMs;
  if (typeof accumulatedMs !== 'number' || !Number.isFinite(accumulatedMs) || accumulatedMs < 0) return fallback;

  const segmentStartedAt = raw.segmentStartedAt;
  if (status === 'running' && (typeof segmentStartedAt !== 'number' || !Number.isFinite(segmentStartedAt))) return fallback;

  const startedDate = typeof raw.startedDate === 'string' && ISO_DATE.test(raw.startedDate) ? raw.startedDate : null;
  const exerciseName = typeof raw.exerciseName === 'string' && raw.exerciseName.length > 0 && raw.exerciseName.length <= 60
    ? raw.exerciseName
    : fallbackExercise;

  return {
    status: status as TimerStatus,
    accumulatedMs,
    segmentStartedAt: status === 'running' ? (segmentStartedAt as number) : null,
    startedDate,
    exerciseName,
  };
}

export function loadTimer(fallbackExercise: string): TimerState {
  try {
    const raw = window.localStorage.getItem(TIMER_KEY);
    return raw ? parseTimerState(JSON.parse(raw), fallbackExercise) : idleTimer(fallbackExercise);
  } catch {
    return idleTimer(fallbackExercise);
  }
}

export function saveTimer(state: TimerState): void {
  try {
    if (state.status === 'idle') window.localStorage.removeItem(TIMER_KEY);
    else window.localStorage.setItem(TIMER_KEY, JSON.stringify(state));
  } catch {
    /* sem armazenamento, o cronômetro continua funcionando nesta aba */
  }
}
