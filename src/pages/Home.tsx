import { Link } from 'wouter';
import { Apple, ChevronRight, Droplets, Pill, Scale, Sprout } from 'lucide-react';
import { useAppData } from '../session';
import { calculateFoodNutrientTotals, weightSummary } from '../data';
import { decimalText, todayInSaoPaulo } from '../ui';

function leftText(goal: number, total: number, unit: string) {
  const diff = goal - total;
  if (Math.abs(diff) < 0.005) return 'Meta atingida';
  return diff > 0 ? `Faltam ${decimalText(diff)} ${unit}` : `${decimalText(-diff)} ${unit} acima da meta`;
}

function Ring({ value, goal }: { value: number; goal: number }) {
  const r = 54;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, value / goal);
  const over = value > goal;
  return (
    <svg className="ring" viewBox="0 0 140 140" role="img" aria-label={`${decimalText((value / goal) * 100)}% da meta de calorias`}>
      <circle cx="70" cy="70" r={r} fill="none" stroke="#e4ebe1" strokeWidth="13" />
      <circle
        cx="70" cy="70" r={r} fill="none" stroke={over ? '#c49a4a' : '#2f6b52'} strokeWidth="13" strokeLinecap="round"
        strokeDasharray={`${c * pct} ${c}`} transform="rotate(-90 70 70)"
      />
      <text x="70" y="66" textAnchor="middle" fontSize="24" fontWeight="700" fill="#263e34">{decimalText(Math.round(value))}</text>
      <text x="70" y="86" textAnchor="middle" fontSize="11" fill="#6b7a70">de {decimalText(goal)} kcal</text>
    </svg>
  );
}

export function Home() {
  const { data, loading, error } = useAppData();
  const today = todayInSaoPaulo();
  const profile = data.profile;
  const goals = profile?.goals ?? null;

  const foods = data.foodEntries.filter((e) => e.date === today);
  const totals = calculateFoodNutrientTotals(foods);
  const waterTotal = data.waterEntries.filter((w) => w.date === today).reduce((s, w) => s + w.volumeMl, 0);
  const { latest } = weightSummary(data.weightEntries);
  const target = profile?.targetWeightKg ?? null;

  const activeMeds = data.medications.filter((m) => m.active);
  const doses = activeMeds.flatMap((m) => (m.times.length ? m.times : ['']).map((time) => `${m.id}|${time}`));
  const takenToday = new Set(data.medicationLogs.filter((l) => l.date === today).map((l) => `${l.medicationId}|${l.time}`));
  const dosesDone = doses.filter((d) => takenToday.has(d)).length;

  const configured = Boolean(profile?.sex && profile.birthDate && profile.heightCm && profile.activity && profile.goalType);
  const hasGoals = goals && Object.values(goals).some((v) => v !== null);
  const name = profile?.displayName?.trim();

  const macros = [
    { key: 'proteins', label: 'Proteínas', unit: 'g' },
    { key: 'carbohydrates', label: 'Carboidratos', unit: 'g' },
    { key: 'fats', label: 'Gorduras', unit: 'g' },
    { key: 'fiber', label: 'Fibras', unit: 'g' },
  ] as const;

  return (
    <div className="page page-enter page-home">
      <section className="page-heading">
        <div className="heading-copy">
          <p className="eyebrow"><span className="eyebrow-dot" />UM ESPAÇO PARA VOCÊ</p>
          <h1 className="serif-display">
            {name ? <>Olá, {name}.<br />Seu dia, no seu ritmo.</> : <>Seu caminho,<br />no seu ritmo.</>}
          </h1>
          <p className="page-intro">Um resumo calmo de hoje, com o que você já registrou e o que ainda falta para as suas metas.</p>
        </div>
        <div className="heading-art" aria-hidden="true">
          <div className="art-ring art-ring-one" />
          <div className="art-ring art-ring-two" />
          <div className="art-icon"><Sprout size={34} strokeWidth={1.45} /></div>
          <span className="art-seed seed-one" />
          <span className="art-seed seed-two" />
        </div>
      </section>

      {error && <p className="profile-state-message profile-state-error" role="alert">{error}</p>}
      {loading && <p className="profile-state-message" role="status">Carregando seus dados…</p>}

      {!configured && !loading && (
        <section className="setup-card">
          <div>
            <h2>Deixe o app com a sua cara</h2>
            <p>
              Informe seus dados, seu nível de atividade e seu objetivo para receber uma estimativa de metas diárias. É opcional e você pode
              ajustar tudo depois.
            </p>
          </div>
          <Link href="/perfil" className="btn btn-default btn-md">Configurar agora</Link>
        </section>
      )}

      <section className="today-card" aria-labelledby="today-title">
        <div className="today-head">
          <div><p className="ft-kicker">HOJE</p><h2 id="today-title">Calorias e nutrientes</h2></div>
          <Link href="/alimentacao" className="today-link">Registrar alimento <ChevronRight size={15} aria-hidden="true" /></Link>
        </div>

        <div className="today-body">
          {goals?.calories ? (
            <div className="today-ring">
              <Ring value={totals.calories} goal={goals.calories} />
              <p className={totals.calories > goals.calories ? 'left over' : 'left'}>{leftText(goals.calories, totals.calories, 'kcal')}</p>
            </div>
          ) : (
            <div className="today-ring today-ring-empty">
              <strong>{decimalText(Math.round(totals.calories))} <small>kcal</small></strong>
              <p className="left">registradas hoje</p>
              <Link href="/perfil">Definir meta de calorias</Link>
            </div>
          )}

          <div className="today-macros">
            {macros.map(({ key, label, unit }) => {
              const goal = goals?.[key] ?? null;
              return (
                <div className="today-macro" key={key}>
                  <div className="today-macro-top"><span>{label}</span><strong>{decimalText(totals[key])} {unit}</strong></div>
                  {goal !== null ? (
                    <>
                      <div className="goal-bar" role="img" aria-label={`${decimalText((totals[key] / goal) * 100)}% da meta de ${label.toLowerCase()}`}>
                        <i className={totals[key] > goal ? 'over' : ''} style={{ width: `${Math.min(100, (totals[key] / goal) * 100)}%` }} />
                      </div>
                      <small>{leftText(goal, totals[key], unit)} · meta {decimalText(goal)} {unit}</small>
                    </>
                  ) : (
                    <small>sem meta</small>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        {!hasGoals && <p className="ft-cup-note">Você ainda não definiu metas. <Link href="/perfil">Defina no Perfil</Link> para ver quanto falta em cada dia.</p>}
      </section>

      <section className="mini-grid" aria-label="Água, peso e medicamentos">
        <Link href="/alimentacao" className="mini-card">
          <span className="mini-icon water"><Droplets size={18} aria-hidden="true" /></span>
          <span className="mini-label">Água hoje</span>
          <strong>{decimalText(waterTotal)} <small>ml</small></strong>
          {goals?.waterMl ? (
            <>
              <div className="goal-bar water"><i style={{ width: `${Math.min(100, (waterTotal / goals.waterMl) * 100)}%` }} /></div>
              <small>{leftText(goals.waterMl, waterTotal, 'ml')}</small>
            </>
          ) : <small>sem meta de água</small>}
        </Link>

        <Link href="/registros" className="mini-card">
          <span className="mini-icon"><Scale size={18} aria-hidden="true" /></span>
          <span className="mini-label">Peso atual</span>
          <strong>{latest ? <>{decimalText(latest.weightKg)} <small>kg</small></> : '—'}</strong>
          <small>
            {latest
              ? target !== null
                ? `${Math.abs(latest.weightKg - target) < 0.05 ? 'Peso desejado atingido' : `${decimalText(Math.abs(latest.weightKg - target))} kg até o peso desejado`}`
                : 'sem peso desejado definido'
              : 'registre seu primeiro peso'}
          </small>
        </Link>

        <Link href="/medicamentos" className="mini-card">
          <span className="mini-icon"><Pill size={18} aria-hidden="true" /></span>
          <span className="mini-label">Doses de hoje</span>
          <strong>{doses.length ? <>{dosesDone} <small>de {doses.length}</small></> : '—'}</strong>
          <small>{doses.length ? (dosesDone === doses.length ? 'todas marcadas' : `${doses.length - dosesDone} para marcar`) : 'nenhum medicamento em uso'}</small>
        </Link>

        <Link href="/alimentacao" className="mini-card">
          <span className="mini-icon"><Apple size={18} aria-hidden="true" /></span>
          <span className="mini-label">Alimentos hoje</span>
          <strong>{foods.length} <small>{foods.length === 1 ? 'registro' : 'registros'}</small></strong>
          <small>{foods.length ? 'toque para ver por refeição' : 'nada registrado ainda'}</small>
        </Link>
      </section>
    </div>
  );
}
