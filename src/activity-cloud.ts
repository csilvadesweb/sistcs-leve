import { supabase } from './supabase';
import { parseAwards, parseGoals, resolveSync, type Award, type CloudGoalState, type Goals } from './activity-goals';

/**
 * Metas e medalhas na conta (tabela activity_goal_state). O navegador continua
 * guardando uma cópia, então a tela funciona sem internet e sincroniza depois.
 */

const DIRTY_KEY = 'sistcs-leve-activity-goals-dirty';

export function isGoalsDirty(): boolean {
  try {
    return window.localStorage.getItem(DIRTY_KEY) === '1';
  } catch {
    return false;
  }
}

function setGoalsDirty(dirty: boolean) {
  try {
    if (dirty) window.localStorage.setItem(DIRTY_KEY, '1');
    else window.localStorage.removeItem(DIRTY_KEY);
  } catch {
    /* sem armazenamento: a próxima abertura simplesmente usa a conta */
  }
}

export type CloudSyncStatus = 'synced' | 'offline' | 'not-configured';

export type CloudSyncResult =
  | { status: 'synced'; goals: Goals; awards: Award[] }
  | { status: 'offline' | 'not-configured' };

/** Distingue uma tabela ausente de uma falha de rede/permissão transitória. */
export function isMissingActivityGoalTable(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  const code = (error.code ?? '').toUpperCase();
  const message = (error.message ?? '').toLowerCase();
  return code === '42P01' || code === 'PGRST205' ||
    (message.includes('activity_goal_state') &&
      (message.includes('does not exist') || message.includes('schema cache') || message.includes('could not find the table')));
}

function statusForError(error: { code?: string; message?: string } | null | undefined): CloudSyncStatus {
  return isMissingActivityGoalTable(error) ? 'not-configured' : 'offline';
}

/** Consulta a conta, resolve conflitos e envia o que estiver à frente. */
export async function syncActivityState(userId: string, getLocal: () => CloudGoalState): Promise<CloudSyncResult> {
  const { data, error } = await supabase.from('activity_goal_state').select('goals,awards').eq('user_id', userId).maybeSingle();
  if (error) return { status: statusForError(error) };

  const remote: CloudGoalState | null = data ? { goals: parseGoals(data.goals), awards: parseAwards(data.awards) } : null;
  // O estado do aparelho é lido só agora: o usuário pode ter editado enquanto a consulta rodava.
  const resolved = resolveSync(getLocal(), isGoalsDirty(), remote);

  if (resolved.pushGoals || resolved.pushAwards) {
    const row: Record<string, unknown> = { user_id: userId };
    if (resolved.pushGoals) row.goals = resolved.goals;
    if (resolved.pushAwards) row.awards = resolved.awards;
    const { error: pushError } = await supabase.from('activity_goal_state').upsert(row, { onConflict: 'user_id' });
    if (pushError) return { status: statusForError(pushError) };
    if (resolved.pushGoals) setGoalsDirty(false);
  }
  return { status: 'synced', goals: resolved.goals, awards: resolved.awards };
}

/** Envia as metas editadas. Se falhar, marca para tentar de novo na próxima abertura. */
export async function pushGoals(userId: string, goals: Goals): Promise<CloudSyncStatus> {
  setGoalsDirty(true);
  const { error } = await supabase.from('activity_goal_state').upsert({ user_id: userId, goals }, { onConflict: 'user_id' });
  if (error) return statusForError(error);
  setGoalsDirty(false);
  return 'synced';
}

/** Envia só as medalhas (nunca mexe nas metas da conta). */
export async function pushAwards(userId: string, awards: Award[]): Promise<CloudSyncStatus> {
  const { error } = await supabase.from('activity_goal_state').upsert({ user_id: userId, awards }, { onConflict: 'user_id' });
  return error ? statusForError(error) : 'synced';
}
