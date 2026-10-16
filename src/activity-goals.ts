/**
 * Metas de atividade (dia, semana e mês) e medalhas, no estilo dos anéis e
 * prêmios do Apple Watch. Tudo aqui é lógica pura e testável: o progresso vem
 * dos exercícios já registrados, então nenhuma tabela nova é necessária.
 *
 * Datas são sempre strings ISO "AAAA-MM-DD" (fuso de São Paulo, como no resto
 * do app) e a semana começa na segunda-feira.
 */

export type GoalPeriod = 'day' | 'week' | 'month';

export interface Goal {
  minutes: number;
  /** Dia em que a meta foi criada ou alterada; medalhas só valem a partir dele. */
  since: string;
}
export type Goals = Partial<Record<GoalPeriod, Goal>>;

export interface MinutesEntry {
  date: string;
  durationMinutes: number;
}

export const GOAL_PERIODS: GoalPeriod[] = ['day', 'week', 'month'];
export const GOAL_LIMITS: Record<GoalPeriod, number> = { day: 1440, week: 10080, month: 44640 };

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 86_400_000;
/** Evita varrer décadas caso exista um lançamento com data absurda. */
const MAX_LOOKBACK_DAYS = 3660;

/* ------------------------------ datas ------------------------------ */

function toUTC(date: string): number {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  return Date.UTC(y, m - 1, d);
}

function fromUTC(ms: number): string {
  const dt = new Date(ms);
  const month = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const day = String(dt.getUTCDate()).padStart(2, '0');
  return `${dt.getUTCFullYear()}-${month}-${day}`;
}

export function addDays(date: string, days: number): string {
  return fromUTC(toUTC(date) + days * DAY_MS);
}

/** Segunda-feira da semana da data informada. */
export function weekStart(date: string): string {
  const dow = new Date(toUTC(date)).getUTCDay(); // 0 = domingo
  return addDays(date, -((dow + 6) % 7));
}

export function monthStart(date: string): string {
  return `${date.slice(0, 7)}-01`;
}

export function monthEnd(date: string): string {
  const [y, m] = date.split('-').map(Number) as [number, number];
  return fromUTC(Date.UTC(y, m, 0));
}

export function periodRange(period: GoalPeriod, today: string): { from: string; to: string } {
  if (period === 'day') return { from: today, to: today };
  if (period === 'week') {
    const from = weekStart(today);
    return { from, to: addDays(from, 6) };
  }
  return { from: monthStart(today), to: monthEnd(today) };
}

/* ----------------------------- progresso ---------------------------- */

export function dayTotals(entries: MinutesEntry[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const entry of entries) {
    if (!ISO_DATE.test(entry.date)) continue;
    totals.set(entry.date, (totals.get(entry.date) ?? 0) + Math.max(0, entry.durationMinutes));
  }
  return totals;
}

export interface PeriodProgress {
  period: GoalPeriod;
  minutes: number;
  goal: number | null;
  /** Pode passar de 1; a interface limita o desenho do anel. */
  ratio: number;
  done: boolean;
}

export function periodProgress(
  entries: MinutesEntry[],
  goals: Goals,
  period: GoalPeriod,
  today: string,
): PeriodProgress {
  const { from, to } = periodRange(period, today);
  let minutes = 0;
  for (const [date, total] of dayTotals(entries)) {
    if (date >= from && date <= to) minutes += total;
  }
  const goal = goals[period]?.minutes ?? null;
  return { period, minutes, goal, ratio: goal ? minutes / goal : 0, done: goal !== null && minutes >= goal };
}

/* ----------------------------- medalhas ----------------------------- */

export type AwardKind = 'day' | 'week' | 'month' | 'perfect_week' | 'streak_7' | 'streak_30';

export interface Award {
  id: string;
  kind: AwardKind;
  /** Dia em que a medalha foi conquistada. */
  earnedOn: string;
  /** Início do período (dia, segunda-feira, dia 1º ou início da sequência). */
  periodKey: string;
}

/**
 * Calcula as medalhas a partir do histórico e das metas atuais.
 * Uma medalha só vale se foi conquistada em ou depois do dia em que a meta
 * correspondente foi criada, então baixar uma meta não concede medalhas
 * retroativas.
 */
export function computeAwards(entries: MinutesEntry[], goals: Goals, today: string): Award[] {
  const totals = dayTotals(entries);
  if (totals.size === 0) return [];

  const floor = addDays(today, -MAX_LOOKBACK_DAYS);
  const firstDate = [...totals.keys()].sort()[0]!;
  const startDate = firstDate < floor ? floor : firstDate;
  const minutesOn = (date: string) => totals.get(date) ?? 0;
  const awards: Award[] = [];

  const dayGoal = goals.day;
  if (dayGoal) {
    const met = (date: string) => date >= dayGoal.since && minutesOn(date) >= dayGoal.minutes;

    let run = 0;
    let runStart = '';
    for (let date = startDate; date <= today; date = addDays(date, 1)) {
      if (!met(date)) {
        run = 0;
        continue;
      }
      awards.push({ id: `day:${date}`, kind: 'day', earnedOn: date, periodKey: date });
      if (run === 0) runStart = date;
      run += 1;
      if (run === 7) awards.push({ id: `streak_7:${runStart}`, kind: 'streak_7', earnedOn: date, periodKey: runStart });
      if (run === 30) awards.push({ id: `streak_30:${runStart}`, kind: 'streak_30', earnedOn: date, periodKey: runStart });
    }

    for (let ws = weekStart(startDate); ws <= today; ws = addDays(ws, 7)) {
      const we = addDays(ws, 6);
      if (we > today) break;
      let perfect = true;
      for (let i = 0; i < 7; i += 1) {
        if (!met(addDays(ws, i))) {
          perfect = false;
          break;
        }
      }
      if (perfect) awards.push({ id: `perfect_week:${ws}`, kind: 'perfect_week', earnedOn: we, periodKey: ws });
    }
  }

  const weekGoal = goals.week;
  if (weekGoal) {
    for (let ws = weekStart(startDate); ws <= today; ws = addDays(ws, 7)) {
      let accumulated = 0;
      for (let i = 0; i < 7; i += 1) {
        const date = addDays(ws, i);
        if (date > today) break;
        accumulated += minutesOn(date);
        if (accumulated >= weekGoal.minutes) {
          if (date >= weekGoal.since) awards.push({ id: `week:${ws}`, kind: 'week', earnedOn: date, periodKey: ws });
          break;
        }
      }
    }
  }

  const monthGoal = goals.month;
  if (monthGoal) {
    for (let ms = monthStart(startDate); ms <= today; ms = addDays(monthEnd(ms), 1)) {
      const end = monthEnd(ms);
      let accumulated = 0;
      for (let date = ms; date <= end && date <= today; date = addDays(date, 1)) {
        accumulated += minutesOn(date);
        if (accumulated >= monthGoal.minutes) {
          if (date >= monthGoal.since) awards.push({ id: `month:${ms}`, kind: 'month', earnedOn: date, periodKey: ms });
          break;
        }
      }
    }
  }

  return sortAwards(awards);
}

export function sortAwards(awards: Award[]): Award[] {
  return [...awards].sort((a, b) => b.earnedOn.localeCompare(a.earnedOn) || a.id.localeCompare(b.id));
}

/**
 * Junta as medalhas já guardadas com as recém-calculadas. As guardadas nunca
 * são removidas; `added` traz só as que ainda não eram conhecidas.
 */
export function mergeAwards(stored: Award[], computed: Award[]): { all: Award[]; added: Award[] } {
  const known = new Set(stored.map((award) => award.id));
  const added = computed.filter((award) => !known.has(award.id));
  return { all: sortAwards([...stored, ...added]), added: sortAwards(added) };
}

/** Ordem de destaque na tela de parabéns (a mais rara primeiro). */
export const AWARD_PRIORITY: AwardKind[] = ['streak_30', 'month', 'perfect_week', 'streak_7', 'week', 'day'];

/* ------------------------- validação e edição ------------------------ */

export type GoalInput = Record<GoalPeriod, string>;

export function validateGoalsInput(
  input: GoalInput,
): { values: Record<GoalPeriod, number | null> } | { error: string } {
  const names: Record<GoalPeriod, string> = { day: 'diária', week: 'semanal', month: 'mensal' };
  const values: Record<GoalPeriod, number | null> = { day: null, week: null, month: null };

  for (const period of GOAL_PERIODS) {
    const text = input[period].trim();
    if (text === '') continue;
    const minutes = Number(text);
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > GOAL_LIMITS[period]) {
      return { error: `A meta ${names[period]} deve ser um número inteiro de 1 a ${GOAL_LIMITS[period].toLocaleString('pt-BR')} minutos.` };
    }
    values[period] = minutes;
  }

  if (values.day !== null && values.week !== null && values.week < values.day) {
    return { error: 'A meta semanal precisa ser maior ou igual à meta diária.' };
  }
  if (values.week !== null && values.month !== null && values.month < values.week) {
    return { error: 'A meta mensal precisa ser maior ou igual à meta semanal.' };
  }
  if (values.day !== null && values.month !== null && values.month < values.day) {
    return { error: 'A meta mensal precisa ser maior ou igual à meta diária.' };
  }
  return { values };
}

/** Aplica as metas digitadas: valor igual mantém a data original; novo ou alterado recomeça hoje. */
export function applyGoalChanges(
  previous: Goals,
  next: Record<GoalPeriod, number | null>,
  today: string,
): Goals {
  const goals: Goals = {};
  for (const period of GOAL_PERIODS) {
    const minutes = next[period];
    if (minutes === null) continue;
    const before = previous[period];
    goals[period] = { minutes, since: before && before.minutes === minutes ? before.since : today };
  }
  return goals;
}

/* ---------------------------- armazenamento --------------------------- */

const GOALS_KEY = 'sistcs-leve-activity-goals-v2';
const LEGACY_WEEK_GOAL_KEY = 'sistcs-leve-activity-goal-minutes';
const AWARDS_KEY = 'sistcs-leve-activity-awards-v1';
export const EXERCISE_CHOICE_KEY = 'sistcs-leve-activity-goal-exercise';

export function parseGoals(value: unknown): Goals {
  const goals: Goals = {};
  if (!value || typeof value !== 'object') return goals;
  const record = value as Record<string, unknown>;
  for (const period of GOAL_PERIODS) {
    const item = record[period];
    if (!item || typeof item !== 'object') continue;
    const { minutes, since } = item as { minutes?: unknown; since?: unknown };
    if (
      typeof minutes === 'number' && Number.isInteger(minutes) && minutes >= 1 && minutes <= GOAL_LIMITS[period] &&
      typeof since === 'string' && ISO_DATE.test(since)
    ) {
      goals[period] = { minutes, since };
    }
  }
  return goals;
}

export function loadGoals(today: string): Goals {
  try {
    const raw = window.localStorage.getItem(GOALS_KEY);
    if (raw) return parseGoals(JSON.parse(raw));
    // Meta semanal da versão anterior da tela.
    const legacy = Number(window.localStorage.getItem(LEGACY_WEEK_GOAL_KEY));
    if (Number.isInteger(legacy) && legacy >= 1 && legacy <= GOAL_LIMITS.week) {
      // Grava já na migração: sem isso a data de início mudaria a cada abertura da tela.
      const migrated: Goals = { week: { minutes: legacy, since: today } };
      saveGoals(migrated);
      return migrated;
    }
  } catch {
    /* armazenamento indisponível ou conteúdo inválido */
  }
  return {};
}

export function saveGoals(goals: Goals): boolean {
  try {
    window.localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
    return true;
  } catch {
    return false;
  }
}

const AWARD_KINDS: AwardKind[] = ['day', 'week', 'month', 'perfect_week', 'streak_7', 'streak_30'];

export function parseAwards(value: unknown): Award[] {
  if (!Array.isArray(value)) return [];
  const awards: Award[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') continue;
    const { id, kind, earnedOn, periodKey } = item as Record<string, unknown>;
    if (
      typeof id === 'string' && typeof kind === 'string' && AWARD_KINDS.includes(kind as AwardKind) &&
      typeof earnedOn === 'string' && ISO_DATE.test(earnedOn) && typeof periodKey === 'string' && ISO_DATE.test(periodKey)
    ) {
      awards.push({ id, kind: kind as AwardKind, earnedOn, periodKey });
    }
  }
  return awards;
}

export function loadAwards(): Award[] {
  try {
    const raw = window.localStorage.getItem(AWARDS_KEY);
    return raw ? parseAwards(JSON.parse(raw)) : [];
  } catch {
    return [];
  }
}

export function saveAwards(awards: Award[]): boolean {
  try {
    window.localStorage.setItem(AWARDS_KEY, JSON.stringify(awards));
    return true;
  } catch {
    return false;
  }
}
