import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent } from 'react';
import { Link } from 'wouter';
import { Flame, Pause, Play, RotateCcw, Save, Square, Trophy } from 'lucide-react';
import { useAppData } from '../session';
import { Button, todayInSaoPaulo } from '../ui';
import { saveExerciseWithMetrics } from '../exercise-persistence';
import { pushAwards, pushGoals, syncActivityState } from '../activity-cloud';
import { EXERCISE_ACTIVITIES, estimateExerciseCalories, validateExerciseInput } from '../exercise';
import {
  AWARD_PRIORITY,
  EXERCISE_CHOICE_KEY,
  GOAL_LIMITS,
  GOAL_PERIODS,
  addDays,
  applyGoalChanges,
  computeAwards,
  loadAwards,
  loadGoals,
  mergeAwards,
  periodProgress,
  saveAwards,
  saveGoals,
  validateGoalsInput,
  type Award,
  type AwardKind,
  type GoalInput,
  type GoalPeriod,
  type Goals,
  type PeriodProgress,
} from '../activity-goals';
import {
  MIN_SAVE_SECONDS,
  elapsedSeconds,
  formatClock,
  idleTimer,
  loadTimer,
  pauseTimer,
  resumeTimer,
  saveTimer,
  sessionMinutes,
  startTimer,
  stopTimer,
  type TimerState,
} from '../activity-timer';
import '../activity-goals.css';

/* ------------------------------ constantes ------------------------------ */

const TIMER_EXERCISES = [
  { name: 'Caminhada', activityId: 'walking_moderate' },
  { name: 'Corrida', activityId: 'running' },
  { name: 'Bicicleta', activityId: 'cycling_moderate' },
  { name: 'Musculação', activityId: 'strength' },
  { name: 'Natação', activityId: 'swimming' },
  { name: 'Dança', activityId: 'dance' },
  { name: 'Yoga / Pilates', activityId: 'yoga' },
  { name: 'Alongamento', activityId: 'yoga' },
  { name: 'Outro', activityId: 'other' },
] as const;

/** Cores dos anéis do Apple Watch (vermelho, verde, ciano), um pouco mais fortes para ter contraste no fundo claro. */
const RING_COLORS: Record<GoalPeriod, string> = { day: '#fa114f', week: '#3fae00', month: '#00a3b8' };
/** Versões mais escuras para texto pequeno. */
const RING_TEXT: Record<GoalPeriod, string> = { day: '#d70a40', week: '#3d7d00', month: '#067a80' };
const RING_RADII: Record<GoalPeriod, number> = { day: 86, week: 62, month: 38 };
const PERIOD_LABEL: Record<GoalPeriod, string> = { day: 'Hoje', week: 'Esta semana', month: 'Este mês' };
const PERIOD_FIELD: Record<GoalPeriod, string> = { day: 'Meta diária', week: 'Meta semanal', month: 'Meta mensal' };

interface MedalStyle {
  title: string;
  text: string;
  glyph: string;
  c1: string;
  c2: string;
  c3: string;
}

const MEDALS: Record<AwardKind, MedalStyle> = {
  day: { title: 'Meta diária', text: 'Você fechou a meta do dia.', glyph: '🏅', c1: '#ff7a9c', c2: '#fa114f', c3: '#8f0a2e' },
  week: { title: 'Meta semanal', text: 'Você fechou a meta da semana.', glyph: '🥇', c1: '#d8ff6a', c2: '#a4ff00', c3: '#5a8f00' },
  month: { title: 'Meta mensal', text: 'Você fechou a meta do mês.', glyph: '🏆', c1: '#8ff6ff', c2: '#1eeaef', c3: '#0a7f85' },
  perfect_week: { title: 'Semana perfeita', text: 'Meta diária batida nos 7 dias da semana.', glyph: '💎', c1: '#d9b8ff', c2: '#a259ff', c3: '#5a24a8' },
  streak_7: { title: '7 dias seguidos', text: 'Sete dias seguidos batendo a meta diária.', glyph: '🔥', c1: '#ffc27a', c2: '#ff9500', c3: '#a85a00' },
  streak_30: { title: '30 dias seguidos', text: 'Um mês seguido batendo a meta diária.', glyph: '👑', c1: '#fff0a8', c2: '#ffd60a', c3: '#9a7b00' },
};
const MEDAL_ORDER: AwardKind[] = ['day', 'week', 'month', 'perfect_week', 'streak_7', 'streak_30'];

/* ------------------------------- utilidades ------------------------------ */

const fmtMin = (minutes: number) =>
  minutes >= 60 ? `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')} min` : `${minutes} min`;

const fmtDate = (iso: string) => iso.split('-').reverse().join('/');

function initialExercise(): string {
  try {
    const saved = window.localStorage.getItem(EXERCISE_CHOICE_KEY);
    if (saved && TIMER_EXERCISES.some((item) => item.name === saved)) return saved;
  } catch {
    /* sem armazenamento */
  }
  return 'Caminhada';
}

type Notice = { kind: 'ok' | 'error'; text: string } | null;

/* ------------------------------ componentes ------------------------------ */

function Rings({ progress }: { progress: PeriodProgress[] }) {
  const label = progress
    .map((p) => `${PERIOD_LABEL[p.period]}: ${p.goal ? `${p.minutes} de ${p.goal} minutos` : 'sem meta definida'}`)
    .join('. ');

  return (
    <svg className="ag-rings" viewBox="0 0 200 200" role="img" aria-label={`Anéis de atividade. ${label}.`}>
      {progress.map((p) => {
        const radius = RING_RADII[p.period];
        const circumference = 2 * Math.PI * radius;
        const first = Math.min(p.ratio, 1);
        const extra = Math.min(Math.max(p.ratio - 1, 0), 1);
        const color = RING_COLORS[p.period];
        return (
          <g key={p.period} transform="rotate(-90 100 100)">
            <circle cx="100" cy="100" r={radius} fill="none" stroke={color} strokeOpacity=".2" strokeWidth="20" />
            {first > 0 && (
              <circle
                className="ag-ring-arc" cx="100" cy="100" r={radius} fill="none" stroke={color} strokeWidth="20"
                strokeLinecap="round" strokeDasharray={`${circumference * first} ${circumference}`}
              />
            )}
            {extra > 0 && (
              <circle
                className="ag-ring-arc ag-ring-extra" cx="100" cy="100" r={radius} fill="none" stroke={color} strokeWidth="20"
                strokeLinecap="round" strokeDasharray={`${circumference * extra} ${circumference}`}
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}

function Medal({ kind, size = 72, locked = false }: { kind: AwardKind; size?: number; locked?: boolean }) {
  const medal = MEDALS[kind];
  const style = { '--m1': medal.c1, '--m2': medal.c2, '--m3': medal.c3, '--size': `${size}px` } as CSSProperties;
  return (
    <span className={`ag-medal${locked ? ' is-locked' : ''}`} style={style} aria-hidden="true">
      <span className="ag-medal-face">{medal.glyph}</span>
    </span>
  );
}

const CONFETTI_COLORS = ['#fa114f', '#a4ff00', '#1eeaef', '#ffd60a', '#a259ff', '#ff9500'];

function Celebration({ awards, onClose }: { awards: Award[]; onClose: () => void }) {
  const ordered = useMemo(
    () => [...awards].sort((a, b) => AWARD_PRIORITY.indexOf(a.kind) - AWARD_PRIORITY.indexOf(b.kind)),
    [awards],
  );
  const top = ordered[0]!;
  const others = ordered.slice(1);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="ag-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="ag-celebration" role="dialog" aria-modal="true" aria-labelledby="ag-celebration-title">
        <div className="ag-confetti" aria-hidden="true">
          {Array.from({ length: 18 }, (_, i) => (
            <span
              key={i}
              style={{
                left: `${(i * 37 + 8) % 100}%`,
                animationDelay: `${(i % 9) * 0.11}s`,
                background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
              }}
            />
          ))}
        </div>
        <p className="ag-kicker">NOVA CONQUISTA 🏅</p>
        <div className="ag-celebration-medal"><Medal kind={top.kind} size={132} /></div>
        <h2 id="ag-celebration-title">{MEDALS[top.kind].title}</h2>
        <p className="ag-celebration-text">{MEDALS[top.kind].text}</p>
        {others.length > 0 && (
          <ul className="ag-celebration-others" aria-label="Outras medalhas conquistadas">
            {others.map((award) => (
              <li key={award.id}><Medal kind={award.kind} size={34} /> {MEDALS[award.kind].title}</li>
            ))}
          </ul>
        )}
        <Button ref={closeRef} block onClick={onClose}>Continuar</Button>
      </section>
    </div>
  );
}

/* --------------------------------- página -------------------------------- */

export function ActivityGoalsPage() {
  const { data, reload, user } = useAppData();
  // Atualiza a data se a tela ficar aberta passando da meia-noite.
  const [today, setToday] = useState(() => todayInSaoPaulo());
  useEffect(() => {
    const id = window.setInterval(() => setToday(todayInSaoPaulo()), 30_000);
    return () => window.clearInterval(id);
  }, []);
  const entries = data.exerciseEntries;
  const latestWeight = useMemo(
    () => [...data.weightEntries].sort((a, b) => b.date.localeCompare(a.date))[0]?.weightKg ?? null,
    [data.weightEntries],
  );

  /* metas */
  const [goals, setGoals] = useState<Goals>(() => loadGoals(todayInSaoPaulo()));
  const [goalInput, setGoalInput] = useState<GoalInput>(() => {
    const saved = loadGoals(todayInSaoPaulo());
    return { day: String(saved.day?.minutes ?? ''), week: String(saved.week?.minutes ?? ''), month: String(saved.month?.minutes ?? '') };
  });
  const [goalsNotice, setGoalsNotice] = useState<Notice>(null);
  const progress = useMemo(
    () => GOAL_PERIODS.map((period) => periodProgress(entries, goals, period, today)),
    [entries, goals, today],
  );

  /* medalhas */
  const [awards, setAwards] = useState<Award[]>(() => loadAwards());
  const awardsRef = useRef<Award[]>(awards);
  const [celebration, setCelebration] = useState<Award[]>([]);
  /** Estado da cópia na conta: só envia depois da primeira consulta. */
  const [cloud, setCloud] = useState<'syncing' | 'synced' | 'offline'>('syncing');
  const cloudReady = useRef(false);
  const closeCelebration = useCallback(() => setCelebration([]), []);

  // Ao abrir: traz metas e medalhas da conta, junta com as deste aparelho e envia o que faltar.
  useEffect(() => {
    let cancelled = false;
    cloudReady.current = false;
    setCloud('syncing');
    void syncActivityState(user.id, () => ({ goals: loadGoals(todayInSaoPaulo()), awards: awardsRef.current })).then((result) => {
      if (cancelled) return;
      if (result.status === 'offline') {
        setCloud('offline');
        return;
      }
      const merged = mergeAwards(awardsRef.current, result.awards).all;
      awardsRef.current = merged;
      setAwards(merged);
      saveAwards(merged);
      saveGoals(result.goals);
      setGoals(result.goals);
      setGoalInput({ day: String(result.goals.day?.minutes ?? ''), week: String(result.goals.week?.minutes ?? ''), month: String(result.goals.month?.minutes ?? '') });
      cloudReady.current = true;
      setCloud('synced');
      // Medalhas conquistadas aqui enquanto a consulta rodava ainda não estão na conta.
      if (merged.length > result.awards.length) void pushAwards(user.id, merged);
    });
    return () => { cancelled = true; };
  }, [user.id]);

  useEffect(() => {
    const computed = computeAwards(entries, goals, today);
    const { all, added } = mergeAwards(awardsRef.current, computed);
    if (added.length === 0) return;
    awardsRef.current = all;
    setAwards(all);
    saveAwards(all);
    if (cloudReady.current) void pushAwards(user.id, all).then((ok) => { if (!ok) setCloud('offline'); });
    // Só comemora o que foi conquistado hoje ou ontem; o resto entra na coleção sem alarde.
    const recent = added.filter((award) => award.earnedOn >= addDays(today, -1));
    if (recent.length > 0) setCelebration(recent);
  }, [entries, goals, today]);

  /* cronômetro */
  const [timer, setTimer] = useState<TimerState>(() => loadTimer(initialExercise()));
  const [now, setNow] = useState(() => Date.now());
  const [weightInput, setWeightInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [timerNotice, setTimerNotice] = useState<Notice>(null);

  useEffect(() => { saveTimer(timer); }, [timer]);
  useEffect(() => {
    if (timer.status !== 'running') return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [timer.status]);

  const seconds = elapsedSeconds(timer, now);
  const exercise = TIMER_EXERCISES.find((item) => item.name === timer.exerciseName) ?? TIMER_EXERCISES[0];
  const activity = EXERCISE_ACTIVITIES.find((item) => item.id === exercise.activityId) ?? EXERCISE_ACTIVITIES[EXERCISE_ACTIVITIES.length - 1]!;
  const minutesToSave = sessionMinutes(seconds);
  const weightValue = weightInput !== '' ? weightInput : latestWeight ? String(latestWeight) : '';
  const estimatedKcal = minutesToSave ? estimateExerciseCalories(activity.met, Number(weightValue), minutesToSave) : 0;

  function chooseExercise(name: string) {
    setTimer((current) => ({ ...current, exerciseName: name }));
    try { window.localStorage.setItem(EXERCISE_CHOICE_KEY, name); } catch { /* sem armazenamento */ }
  }

  function start() {
    setTimerNotice(null);
    setTimer((current) => startTimer(current, Date.now(), todayInSaoPaulo()));
  }
  function pause() { setTimer((current) => pauseTimer(current, Date.now())); }
  function resume() { setTimer((current) => resumeTimer(current, Date.now())); }
  function stop() {
    setTimerNotice(null);
    setTimer((current) => stopTimer(current, Date.now()));
  }
  function reset() {
    if (seconds >= MIN_SAVE_SECONDS && !window.confirm(`Zerar o cronômetro e descartar ${formatClock(seconds)} de ${timer.exerciseName.toLocaleLowerCase('pt-BR')}?`)) return;
    setTimer(idleTimer(timer.exerciseName));
    setTimerNotice({ kind: 'ok', text: 'Cronômetro zerado.' });
  }

  async function saveSession() {
    if (timer.status !== 'stopped' || saving) return;
    if (minutesToSave === null) {
      setTimerNotice({ kind: 'error', text: `A sessão precisa ter ao menos ${MIN_SAVE_SECONDS} segundos para ser salva.` });
      return;
    }
    const date = timer.startedDate ?? todayInSaoPaulo();
    const bodyWeightKg = Number(weightValue);
    const invalid = validateExerciseInput({ date, activity: activity.label, durationMinutes: minutesToSave, weightKg: bodyWeightKg, note: '' });
    if (invalid) {
      setTimerNotice({ kind: 'error', text: invalid });
      return;
    }
    setSaving(true);
    setTimerNotice(null);
    try {
      await saveExerciseWithMetrics({
        date,
        activity: activity.label,
        activityId: activity.id,
        metValue: activity.met,
        bodyWeightKg,
        durationMinutes: minutesToSave,
        caloriesBurned: estimateExerciseCalories(activity.met, bodyWeightKg, minutesToSave),
        note: 'Registrado pelo cronômetro',
      });
      // O treino já está salvo: zera o cronômetro antes de recarregar para nunca salvar duas vezes.
      setTimer(idleTimer(timer.exerciseName));
      setTimerNotice({ kind: 'ok', text: `Treino salvo: ${minutesToSave} min de ${activity.label.toLocaleLowerCase('pt-BR')} em ${fmtDate(date)}.` });
      await reload();
    } catch (error) {
      setTimerNotice({ kind: 'error', text: error instanceof Error ? error.message : 'Não foi possível salvar o treino. Tente novamente.' });
    } finally {
      setSaving(false);
    }
  }

  function submitGoals(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = validateGoalsInput(goalInput);
    if ('error' in result) {
      setGoalsNotice({ kind: 'error', text: result.error });
      return;
    }
    const next = applyGoalChanges(goals, result.values, todayInSaoPaulo());
    if (!saveGoals(next)) {
      setGoalsNotice({ kind: 'error', text: 'Não foi possível guardar as metas neste dispositivo. Verifique as permissões do navegador.' });
      return;
    }
    setGoals(next);
    setGoalsNotice({ kind: 'ok', text: 'Metas salvas. As medalhas contam a partir de hoje.' });
    void pushGoals(user.id, next).then((ok) => {
      setCloud(ok ? 'synced' : 'offline');
      if (!ok) setGoalsNotice({ kind: 'ok', text: 'Metas salvas neste aparelho. Elas vão para a sua conta quando a conexão voltar.' });
    });
  }

  const medalCounts = useMemo(() => {
    const counts = new Map<AwardKind, number>();
    for (const award of awards) counts.set(award.kind, (counts.get(award.kind) ?? 0) + 1);
    return counts;
  }, [awards]);

  const statusLabel = { idle: 'PRONTO', running: 'EM ANDAMENTO', paused: 'PAUSADO', stopped: 'TREINO FINALIZADO' }[timer.status];
  const locked = timer.status !== 'idle';

  return (
    <div className="page page-enter ag-page">
      <section className="page-heading">
        <div className="heading-copy">
          <p className="eyebrow"><span className="eyebrow-dot" />SEU OBJETIVO, SEU RITMO</p>
          <h1 className="serif-display">Metas de atividade</h1>
          <p className="page-intro">Defina metas por dia, semana e mês, marque o treino no cronômetro e ganhe medalhas ao bater cada meta.</p>
        </div>
      </section>

      <section className="ag-card" aria-labelledby="ag-rings-title">
        <p className="ag-kicker">ANÉIS DE ATIVIDADE</p>
        <h2 id="ag-rings-title">Seu movimento</h2>
        <div className="ag-rings-wrap">
          <Rings progress={progress} />
          <ul className="ag-legend">
            {progress.map((p) => (
              <li key={p.period}>
                <span className="ag-legend-label" style={{ color: RING_TEXT[p.period] }}>{PERIOD_LABEL[p.period]}</span>
                <strong>{p.goal ? `${fmtMin(p.minutes)} / ${fmtMin(p.goal)}` : fmtMin(p.minutes)}</strong>
                <small>{p.goal ? `${Math.round(p.ratio * 100)}%${p.done ? ' · meta batida 🏅' : ''}` : 'Sem meta definida'}</small>
              </li>
            ))}
          </ul>
        </div>
        {!data.exerciseTrackingAvailable && (
          <p className="ag-note" role="status">O registro de exercícios ainda não está ativo no banco conectado, então os anéis e o salvamento ficam indisponíveis.</p>
        )}
      </section>

      <section className="ag-card ag-timer" aria-labelledby="ag-timer-title">
        <div className="ag-timer-head">
          <div>
            <p className="ag-kicker">CRONÔMETRO</p>
            <h2 id="ag-timer-title">Tempo de {timer.exerciseName.toLocaleLowerCase('pt-BR')}</h2>
          </div>
          <span className={`ag-status ag-status-${timer.status}`}><i aria-hidden="true" /> {statusLabel}</span>
        </div>

        <label className="ag-field">
          Exercício
          <select value={timer.exerciseName} onChange={(event) => chooseExercise(event.target.value)} disabled={locked}>
            {TIMER_EXERCISES.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}
          </select>
        </label>

        <p className={`ag-clock ag-clock-${timer.status}`} aria-live="off">{formatClock(seconds)}</p>

        <div className="ag-actions">
          {timer.status === 'idle' && (
            <Button onClick={start}><Play aria-hidden="true" /> Iniciar</Button>
          )}
          {timer.status === 'running' && (
            <Button variant="outline" onClick={pause}><Pause aria-hidden="true" /> Pausar</Button>
          )}
          {timer.status === 'paused' && (
            <Button onClick={resume}><Play aria-hidden="true" /> Continuar</Button>
          )}
          {(timer.status === 'running' || timer.status === 'paused') && (
            <Button variant="destructive" onClick={stop}><Square aria-hidden="true" /> Parar</Button>
          )}
          {timer.status === 'stopped' && (
            <Button onClick={() => void saveSession()} disabled={saving || minutesToSave === null || !data.exerciseTrackingAvailable}>
              <Save aria-hidden="true" /> {saving ? 'Salvando…' : 'Salvar treino'}
            </Button>
          )}
          {timer.status !== 'idle' && (
            <Button variant="ghost" onClick={reset} disabled={saving}><RotateCcw aria-hidden="true" /> Zerar</Button>
          )}
        </div>

        {timer.status === 'stopped' && (
          <div className="ag-summary">
            {minutesToSave === null ? (
              <p>Sessões com menos de {MIN_SAVE_SECONDS} segundos não podem ser salvas. Zere o cronômetro para recomeçar.</p>
            ) : (
              <>
                <p>Será salvo como <strong>{minutesToSave} min de {activity.label.toLocaleLowerCase('pt-BR')}</strong> em {fmtDate(timer.startedDate ?? today)}{estimatedKcal > 0 && <> · cerca de <strong>{estimatedKcal} kcal</strong></>}.</p>
                <label className="ag-field">
                  Peso usado no cálculo (kg)
                  <input type="number" inputMode="decimal" min="20" max="400" step=".1" value={weightValue} onChange={(event) => setWeightInput(event.target.value)} placeholder="Ex.: 70" />
                </label>
              </>
            )}
            {!data.exerciseTrackingAvailable && <p className="ag-note" role="status">O banco conectado ainda não permite salvar exercícios.</p>}
          </div>
        )}

        {timer.status === 'running' && <p className="ag-hint">O tempo continua contando mesmo com a tela bloqueada ou se você sair desta página.</p>}
        {timerNotice && <p className={`ag-notice ag-notice-${timerNotice.kind}`} role={timerNotice.kind === 'error' ? 'alert' : 'status'}>{timerNotice.text}</p>}
      </section>

      <section className="ag-card" aria-labelledby="ag-goals-title">
        <p className="ag-kicker">MINHAS METAS</p>
        <h2 id="ag-goals-title">Defina suas metas</h2>
        <p className="ag-hint">Quantos minutos de atividade você quer praticar? Deixe em branco o período que não quiser acompanhar.</p>
        <form onSubmit={submitGoals} className="ag-goals-form" noValidate>
          {GOAL_PERIODS.map((period) => (
            <label className="ag-field" key={period}>
              <span><i className="ag-dot" style={{ background: RING_COLORS[period] }} aria-hidden="true" /> {PERIOD_FIELD[period]} (minutos)</span>
              <input
                type="number" inputMode="numeric" min="1" max={GOAL_LIMITS[period]} step="1"
                value={goalInput[period]} onChange={(event) => setGoalInput((current) => ({ ...current, [period]: event.target.value }))}
                placeholder={period === 'day' ? 'Ex.: 30' : period === 'week' ? 'Ex.: 150' : 'Ex.: 600'}
              />
            </label>
          ))}
          <div className="ag-actions ag-actions-left">
            <Button type="submit"><Save aria-hidden="true" /> Salvar metas</Button>
            <Button variant="outline" onClick={() => setGoalInput({ day: '30', week: '150', month: '600' })}>Usar sugestão (30 · 150 · 600)</Button>
          </div>
        </form>
        {goalsNotice && <p className={`ag-notice ag-notice-${goalsNotice.kind}`} role={goalsNotice.kind === 'error' ? 'alert' : 'status'}>{goalsNotice.text}</p>}
        <p className="ag-sync" aria-live="polite">
          {cloud === 'synced' ? 'Metas e medalhas salvas na sua conta: aparecem em qualquer aparelho.' : cloud === 'offline' ? 'Sem conexão com a conta: tudo fica neste aparelho e sincroniza depois.' : 'Sincronizando com a sua conta…'}
        </p>
        <p className="ag-hint">As metas ficam guardadas neste dispositivo. Ao alterar uma meta, as medalhas dela passam a contar a partir de hoje.</p>
      </section>

      <section className="ag-card" aria-labelledby="ag-awards-title">
        <p className="ag-kicker">PRÊMIOS</p>
        <h2 id="ag-awards-title"><Trophy size={20} aria-hidden="true" /> Suas medalhas <span className="ag-count">{awards.length}</span></h2>
        <ul className="ag-collection">
          {MEDAL_ORDER.map((kind) => {
            const count = medalCounts.get(kind) ?? 0;
            return (
              <li key={kind} className={count === 0 ? 'is-locked' : ''}>
                <Medal kind={kind} size={64} locked={count === 0} />
                <strong>{MEDALS[kind].title}</strong>
                <small>{MEDALS[kind].text}</small>
                {count > 0 && <span className="ag-badge">×{count}</span>}
              </li>
            );
          })}
        </ul>
        {awards.length > 0 ? (
          <>
            <h3 className="ag-subtitle"><Flame size={16} aria-hidden="true" /> Últimas conquistas</h3>
            <ul className="ag-recent">
              {awards.slice(0, 8).map((award) => (
                <li key={award.id}><Medal kind={award.kind} size={36} /><span>{MEDALS[award.kind].title}</span><time dateTime={award.earnedOn}>{fmtDate(award.earnedOn)}</time></li>
              ))}
            </ul>
          </>
        ) : (
          <p className="ag-hint">Defina uma meta e registre seus treinos: a primeira medalha 🏅 aparece assim que você bater a meta.</p>
        )}
      </section>

      <p className="hub-footnote"><Link href="/exercicios">Registrar exercício manualmente</Link> · <Link href="/atividade">Voltar para Atividade</Link></p>

      {celebration.length > 0 && <Celebration awards={celebration} onClose={closeCelebration} />}
    </div>
  );
}
