import { useMemo, useState } from 'react';
import { ChartNoAxesCombined } from 'lucide-react';
import { Link } from 'wouter';
import { useAppData } from '../session';
import { calculateFoodNutrientTotals, lastDays, weightSummary } from '../data';
import { BarChart, WeightChart } from '../charts';
import { decimalText, formatDate, todayInSaoPaulo } from '../ui';

const RANGES = [7, 14, 30] as const;

const average = (values: number[]) => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0);

export function Reports() {
  const { data, loading, error: loadError } = useAppData();
  const [range, setRange] = useState<(typeof RANGES)[number]>(7);
  const [activeReportTab, setActiveReportTab] = useState<'summary' | 'food' | 'movement' | 'wellbeing'>('summary');
  const today = todayInSaoPaulo();
  const goals = data.profile?.goals ?? null;

  const days = useMemo(() => lastDays(today, range), [today, range]);

  const perDay = useMemo(
    () =>
      days.map((date) => {
        const foods = data.foodEntries.filter((e) => e.date === date);
        const totals = calculateFoodNutrientTotals(foods);
        const water = data.waterEntries.filter((w) => w.date === date).reduce((sum, w) => sum + w.volumeMl, 0);
        const exerciseEntries = data.exerciseEntries.filter((e) => e.date === date);
        const exerciseCalories = exerciseEntries.reduce((sum, e) => sum + e.caloriesBurned, 0);
        const exerciseMinutes = exerciseEntries.reduce((sum, e) => sum + e.durationMinutes, 0);
        return { date, logged: foods.length > 0, totals, water, exerciseCalories, exerciseMinutes, exerciseCount: exerciseEntries.length };
      }),
    [days, data.foodEntries, data.waterEntries, data.exerciseEntries],
  );

  const loggedDays = perDay.filter((d) => d.logged);
  const waterDays = perDay.filter((d) => d.water > 0);
  const exerciseDays = perDay.filter((d) => d.exerciseCount > 0);
  const exerciseMinutes = perDay.reduce((sum, d) => sum + d.exerciseMinutes, 0);
  const exerciseCalories = perDay.reduce((sum, d) => sum + d.exerciseCalories, 0);
  const kcalGoal = goals?.calories ?? null;
  const waterGoal = goals?.waterMl ?? null;
  const withinGoal = kcalGoal === null ? null : loggedDays.filter((d) => d.totals.calories <= kcalGoal).length;
  const waterGoalDays = waterGoal === null ? null : waterDays.filter((d) => d.water >= waterGoal).length;

  const weightInRange = data.weightEntries.filter((w) => w.date >= days[0] && w.date <= days[days.length - 1]);
  const { first: wFirst, latest: wLatest } = weightSummary(weightInRange);
  const weightChange = wFirst && wLatest && wFirst.id !== wLatest.id ? wLatest.weightKg - wFirst.weightKg : null;

  const stats = [
    { label: 'Dias com alimentos', value: `${loggedDays.length} de ${range}`, note: 'dias com ao menos um registro' },
    { label: 'Calorias de exercício', value: data.exerciseTrackingAvailable ? `${decimalText(exerciseCalories)} kcal` : '—', note: data.exerciseTrackingAvailable ? `${exerciseMinutes} min ativos · estimativa` : 'ative o diário de exercícios' },
    {
      label: 'Média de calorias',
      value: loggedDays.length ? `${decimalText(Math.round(average(loggedDays.map((d) => d.totals.calories))))} kcal` : '—',
      note: kcalGoal !== null ? `meta ${decimalText(kcalGoal)} kcal` : 'sem meta definida',
    },
    {
      label: 'Dias até a meta de calorias',
      value: withinGoal === null ? '—' : `${withinGoal} de ${loggedDays.length}`,
      note: kcalGoal !== null ? 'entre os dias com registro' : 'defina uma meta no Perfil',
    },
    {
      label: 'Média de proteínas',
      value: loggedDays.length ? `${decimalText(Math.round(average(loggedDays.map((d) => d.totals.proteins))))} g` : '—',
      note: goals?.proteins ? `meta ${decimalText(goals.proteins)} g` : 'sem meta definida',
    },
    {
      label: 'Média de água',
      value: waterDays.length ? `${decimalText(Math.round(average(waterDays.map((d) => d.water))))} ml` : '—',
      note: waterGoal !== null ? `meta ${decimalText(waterGoal)} ml` : 'sem meta definida',
    },
    {
      label: 'Dias com a meta de água',
      value: waterGoalDays === null ? '—' : `${waterGoalDays} de ${waterDays.length}`,
      note: waterGoal !== null ? 'entre os dias com registro' : 'defina uma meta no Perfil',
    },
  ];

  return (
    <div className="ft-page page-enter">
      <header className="ft-heading">
        <div>
          <p className="eyebrow"><span className="eyebrow-dot" />VISÃO AO LONGO DO TEMPO</p>
          <h1 className="serif-display">Relatórios</h1>
          <p>Uma visão calma do seu percurso. Os números vêm só do que você registrou.</p>
        </div>
        <div className="ft-heading-icon" aria-hidden="true"><ChartNoAxesCombined size={29} strokeWidth={1.6} /></div>
      </header>

      {loadError && <p className="ft-feedback ft-feedback-error" role="alert">{loadError}</p>}
      {loading && <p className="ft-feedback" role="status">Carregando seus registros…</p>}

      <div className="seg" role="group" aria-label="Período">
        {RANGES.map((r) => (
          <button key={r} type="button" className={r === range ? 'is-on' : ''} aria-pressed={r === range} onClick={() => setRange(r)}>
            Últimos {r} dias
          </button>
        ))}
      </div>
      <p className="ft-explainer" style={{ marginLeft: 0 }}>{formatDate(days[0])} a {formatDate(days[days.length - 1])}</p>

      <div className="progressive-tabs" role="tablist" aria-label="Seções dos relatórios">
        <button type="button" role="tab" aria-selected={activeReportTab === 'summary'} aria-controls="report-panel-summary" className={activeReportTab === 'summary' ? 'progressive-tab is-active' : 'progressive-tab'} onClick={() => setActiveReportTab('summary')}>Resumo</button>
        <button type="button" role="tab" aria-selected={activeReportTab === 'food'} aria-controls="report-panel-food" className={activeReportTab === 'food' ? 'progressive-tab is-active' : 'progressive-tab'} onClick={() => setActiveReportTab('food')}>Alimentação</button>
        <button type="button" role="tab" aria-selected={activeReportTab === 'movement'} aria-controls="report-panel-movement" className={activeReportTab === 'movement' ? 'progressive-tab is-active' : 'progressive-tab'} onClick={() => setActiveReportTab('movement')}>Movimento</button>
        <button type="button" role="tab" aria-selected={activeReportTab === 'wellbeing'} aria-controls="report-panel-wellbeing" className={activeReportTab === 'wellbeing' ? 'progressive-tab is-active' : 'progressive-tab'} onClick={() => setActiveReportTab('wellbeing')}>Água e peso</button>
      </div>
      {activeReportTab === 'summary' && <div id="report-panel-summary" role="tabpanel">
      <section className="stat-grid stat-grid-3" aria-label="Resumo do período">
        {stats.map((s) => (
          <div className="stat" key={s.label}>
            <span>{s.label}</span>
            <strong>{s.value}</strong>
            <small>{s.note}</small>
          </div>
        ))}
      </section>

      </div>}
      {activeReportTab === 'food' && <div id="report-panel-food" role="tabpanel">
      <section className="ft-card" aria-labelledby="kcal-title">
        <p className="ft-kicker">ALIMENTAÇÃO</p>
        <h2 className="rep-title" id="kcal-title">Calorias por dia</h2>
        {loggedDays.length ? (
          <div className="chart-wrap">
            <BarChart days={perDay.map((d) => ({ date: d.date, value: Math.round(d.totals.calories) }))} goal={kcalGoal} label="Calorias registradas por dia" />
          </div>
        ) : (
          <p className="ft-favorites-empty">Ainda não há alimentos registrados neste período.</p>
        )}
        {kcalGoal === null && (
          <p className="ft-cup-note">Sem meta de calorias. <Link href="/perfil">Defina no Perfil</Link> para ver a linha da meta.</p>
        )}
      </section>

      </div>}
      {activeReportTab === 'movement' && <div id="report-panel-movement" role="tabpanel">
      <section className="ft-card" aria-labelledby="exercise-title">
        <p className="ft-kicker">MOVIMENTO</p>
        <h2 className="rep-title" id="exercise-title">Calorias de exercício por dia</h2>
        {!data.exerciseTrackingAvailable ? (
          <p className="ft-favorites-empty">O diário de exercícios será exibido após aplicar a migration aditiva e ativar o módulo. <Link href="/exercicios">Abrir exercícios</Link></p>
        ) : exerciseDays.length ? (
          <div className="chart-wrap">
            <BarChart days={perDay.map((d) => ({ date: d.date, value: Math.round(d.exerciseCalories) }))} goal={null} label="Calorias estimadas de exercício por dia" color="#b58a42" />
          </div>
        ) : (
          <p className="ft-favorites-empty">Nenhum exercício registrado neste período. <Link href="/exercicios">Registrar exercício</Link></p>
        )}
        <p className="ft-cup-note">Calorias de exercício são estimativas e não representam o gasto energético total do dia.</p>
      </section>

      </div>}
      {activeReportTab === 'wellbeing' && <div id="report-panel-wellbeing" role="tabpanel">
      <section className="ft-card" aria-labelledby="water-title">
        <p className="ft-kicker">HIDRATAÇÃO</p>
        <h2 className="rep-title" id="water-title">Água por dia</h2>
        {waterDays.length ? (
          <div className="chart-wrap">
            <BarChart days={perDay.map((d) => ({ date: d.date, value: Math.round(d.water) }))} goal={waterGoal} label="Água registrada por dia, em ml" color="#48756f" />
          </div>
        ) : (
          <p className="ft-favorites-empty">Ainda não há água registrada neste período.</p>
        )}
      </section>

      <section className="ft-card" aria-labelledby="weight-title">
        <p className="ft-kicker">PESO</p>
        <h2 className="rep-title" id="weight-title">Evolução no período</h2>
        {weightInRange.length ? (
          <>
            <div className="chart-wrap">
              <WeightChart points={weightInRange.map((w) => ({ date: w.date, value: w.weightKg }))} target={data.profile?.targetWeightKg ?? null} />
            </div>
            {weightChange !== null && (
              <p className="ft-explainer" style={{ marginLeft: 0 }}>
                Variação no período: {weightChange > 0 ? '+' : weightChange < 0 ? '−' : ''}{decimalText(Math.abs(weightChange))} kg.
              </p>
            )}
          </>
        ) : (
          <p className="ft-favorites-empty">
            Nenhum peso registrado neste período. <Link href="/registros">Registrar peso</Link>
          </p>
        )}
      </section>

      </div>}
      <p className="ft-privacy-note">Os relatórios são só um espelho do que você anotou e não oferecem orientação médica.</p>
    </div>
  );
}
