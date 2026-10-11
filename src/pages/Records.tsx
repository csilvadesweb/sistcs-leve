import { useMemo, useState, type FormEvent } from 'react';
import { Link } from 'wouter';
import { Pencil, Plus, Save, Scale, Trash2, X } from 'lucide-react';
import { useAppData } from '../session';
import {
  createWeightEntry,
  deleteWeightEntry,
  updateWeightEntry,
  weightSummary,
  type WeightEntry,
} from '../data';
import { WeightChart } from '../charts';
import { BeforeAfter } from './BeforeAfter';
import {
  Button,
  Field,
  decimalInputText,
  decimalIsValid,
  decimalText,
  formatDate,
  parseDecimal,
  todayInSaoPaulo,
  useRunner,
} from '../ui';

type Feedback = { kind: 'success' | 'error'; message: string } | null;

function daysBetween(from: string, to: string) {
  return Math.round((Date.parse(to) - Date.parse(from)) / 86400000);
}

export function Records() {
  const { data, reload, loading, error: loadError } = useAppData();
  const { busy, run } = useRunner(reload);
  const [editing, setEditing] = useState<WeightEntry | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ date: todayInSaoPaulo(), weight: '', note: '' });
  const [errors, setErrors] = useState<{ date?: string; weight?: string; note?: string }>({});
  const [feedback, setFeedback] = useState<Feedback>(null);

  const entries = data.weightEntries;
  const { first, latest } = useMemo(() => weightSummary(entries), [entries]);
  const target = data.profile?.targetWeightKg ?? null;
  const targetDate = data.profile?.targetDate ?? null;
  const today = todayInSaoPaulo();

  const listed = useMemo(
    () =>
      [...entries].sort((a, b) => (a.date === b.date ? 0 : a.date < b.date ? 1 : -1)),
    [entries],
  );

  let progress: { pct: number; text: string } | null = null;
  if (first && latest && target !== null) {
    const direction = target < first.weightKg ? 'lose' : target > first.weightKg ? 'gain' : 'hold';
    const reached =
      direction === 'lose' ? latest.weightKg <= target : direction === 'gain' ? latest.weightKg >= target : Math.abs(latest.weightKg - target) < 0.05;
    const total = Math.abs(first.weightKg - target);
    const done = direction === 'lose' ? first.weightKg - latest.weightKg : latest.weightKg - first.weightKg;
    progress = {
      pct: reached ? 100 : total === 0 ? 0 : Math.max(0, Math.min(100, (done / total) * 100)),
      text: reached ? 'Peso desejado atingido' : `Faltam ${decimalText(Math.abs(latest.weightKg - target))} kg`,
    };
  }

  function openNew() {
    setEditing(null);
    setForm({ date: today, weight: '', note: '' });
    setErrors({});
    setFeedback(null);
    setOpen(true);
  }

  function openEdit(entry: WeightEntry) {
    setEditing(entry);
    setForm({ date: entry.date, weight: decimalInputText(entry.weightKg), note: entry.note });
    setErrors({});
    setFeedback(null);
    setOpen(true);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const errs: typeof errors = {};
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date)) errs.date = 'Escolha uma data válida.';
    if (!decimalIsValid(form.weight, false) || parseDecimal(form.weight) < 20 || parseDecimal(form.weight) > 400) {
      errs.weight = 'Informe o peso em kg, entre 20 e 400.';
    }
    if (form.note.length > 200) errs.note = 'Use até 200 caracteres.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    const input = { date: form.date, weightKg: parseDecimal(form.weight), note: form.note.trim() };
    await run(
      async () => {
        if (editing) await updateWeightEntry(editing.id, input);
        else await createWeightEntry(input);
        setFeedback({ kind: 'success', message: editing ? 'Registro de peso atualizado.' : 'Peso registrado.' });
        setOpen(false);
        setEditing(null);
      },
      (message) => setFeedback({ kind: 'error', message }),
      'Não foi possível salvar o peso.',
    );
  }

  async function remove(entry: WeightEntry) {
    if (!window.confirm(`Excluir o registro de ${decimalText(entry.weightKg)} kg em ${formatDate(entry.date)}?`)) return;
    await run(
      async () => {
        await deleteWeightEntry(entry.id);
        setFeedback({ kind: 'success', message: 'Registro de peso excluído.' });
      },
      (message) => setFeedback({ kind: 'error', message }),
      'Não foi possível excluir o registro.',
    );
  }

  const change = first && latest ? latest.weightKg - first.weightKg : null;

  return (
    <div className="ft-page page-enter">
      <header className="ft-heading">
        <div>
          <p className="eyebrow"><span className="eyebrow-dot" />ACOMPANHAMENTO</p>
          <h1 className="serif-display">Registros</h1>
          <p>Anote seu peso quando quiser e veja o percurso ao longo do tempo, sem cobrança.</p>
        </div>
        <div className="ft-heading-icon" aria-hidden="true"><Scale size={29} strokeWidth={1.6} /></div>
      </header>

      {loadError && <p className="ft-feedback ft-feedback-error" role="alert">{loadError}</p>}
      {loading && <p className="ft-feedback" role="status">Carregando seus registros…</p>}

      <section className="stat-grid" aria-label="Resumo do peso">
        <div className="stat">
          <span>Peso atual</span>
          <strong>{latest ? <>{decimalText(latest.weightKg)} <small>kg</small></> : '—'}</strong>
          <small>{latest ? formatDate(latest.date) : 'Nenhum registro ainda'}</small>
        </div>
        <div className="stat">
          <span>Primeiro registro</span>
          <strong>{first ? <>{decimalText(first.weightKg)} <small>kg</small></> : '—'}</strong>
          <small>{first ? formatDate(first.date) : ' '}</small>
        </div>
        <div className="stat">
          <span>Variação</span>
          <strong>
            {change === null ? '—' : <>{change > 0 ? '+' : change < 0 ? '−' : ''}{decimalText(Math.abs(change))} <small>kg</small></>}
          </strong>
          <small>desde o primeiro registro</small>
        </div>
        <div className="stat">
          <span>Peso desejado</span>
          <strong>{target !== null ? <>{decimalText(target)} <small>kg</small></> : '—'}</strong>
          <small>
            {target === null ? <Link href="/perfil">Definir no Perfil</Link> : targetDate
              ? (() => {
                  const left = daysBetween(today, targetDate);
                  return left >= 0 ? `até ${formatDate(targetDate)} · ${left} ${left === 1 ? 'dia' : 'dias'}` : `data prevista: ${formatDate(targetDate)}`;
                })()
              : 'sem data definida'}
          </small>
        </div>
      </section>

      {progress && (
        <section className="ft-card progress-card" aria-label="Progresso até o peso desejado">
          <div className="progress-row">
            <strong>{progress.text}</strong>
            <span>{decimalText(progress.pct)}% do caminho</span>
          </div>
          <div className="goal-bar big" role="img" aria-label={`${decimalText(progress.pct)}% do caminho até o peso desejado`}>
            <i style={{ width: `${progress.pct}%` }} />
          </div>
        </section>
      )}

      <section className="ft-card" aria-labelledby="weight-chart-title">
        <div className="ft-section-heading">
          <div className="ft-section-mark"><Scale size={19} aria-hidden="true" /></div>
          <div><p className="ft-kicker">EVOLUÇÃO</p><h2 id="weight-chart-title">Seu peso ao longo do tempo</h2></div>
          {!open && <Button onClick={openNew}><Plus aria-hidden="true" /> Registrar peso</Button>}
        </div>

        {feedback && (
          <p className={`ft-feedback ft-feedback-${feedback.kind}`} role={feedback.kind === 'error' ? 'alert' : 'status'} aria-live="polite">
            {feedback.message}
          </p>
        )}

        {open && (
          <form className="ft-editor" onSubmit={onSubmit} noValidate>
            <div className="ft-editor-top">
              <h3>{editing ? 'Editar registro de peso' : 'Novo registro de peso'}</h3>
              <Button variant="ghost" onClick={() => { setOpen(false); setEditing(null); }}>
                <X aria-hidden="true" /> Fechar
              </Button>
            </div>
            <div className="ft-form-grid">
              <Field id="weight-date" label="Data" className="ft-field" error={errors.date}>
                <input id="weight-date" className="input" type="date" value={form.date} onChange={(e) => setForm((v) => ({ ...v, date: e.target.value }))} />
              </Field>
              <Field id="weight-kg" label="Peso (kg)" className="ft-field" error={errors.weight} hint="Vírgula decimal é aceita.">
                <input id="weight-kg" className="input" type="text" inputMode="decimal" maxLength={7} value={form.weight} onChange={(e) => setForm((v) => ({ ...v, weight: e.target.value }))} />
              </Field>
              <Field id="weight-note" label="Anotação" optional className="ft-field" error={errors.note}>
                <input id="weight-note" className="input" maxLength={200} autoComplete="off" value={form.note} onChange={(e) => setForm((v) => ({ ...v, note: e.target.value }))} />
              </Field>
            </div>
            <div className="ft-form-actions">
              <Button type="submit" disabled={busy}>
                <Save aria-hidden="true" /> {editing ? 'Salvar alterações' : 'Registrar peso'}
              </Button>
            </div>
          </form>
        )}

        {entries.length ? (
          <div className="chart-wrap"><WeightChart points={entries.map((e) => ({ date: e.date, value: e.weightKg }))} target={target} /></div>
        ) : (
          <div className="ft-empty">
            <span className="ft-empty-icon"><Scale size={20} aria-hidden="true" /></span>
            <h3>Nenhum peso registrado</h3>
            <p>Quando quiser, anote seu peso. O gráfico aparece a partir do primeiro registro.</p>
            {!open && <Button variant="outline" onClick={openNew}><Plus aria-hidden="true" /> Registrar peso</Button>}
          </div>
        )}

        {listed.length > 0 && (
          <div className="ft-water-list">
            {listed.map((entry, index) => {
              const previous = listed[index + 1];
              const delta = previous ? entry.weightKg - previous.weightKg : null;
              return (
                <div className="ft-water-row" key={entry.id}>
                  <span className="ft-water-row-icon"><Scale size={16} aria-hidden="true" /></span>
                  <strong>{decimalText(entry.weightKg)} kg</strong>
                  <span className="ft-water-date">
                    {formatDate(entry.date)}
                    {delta !== null && delta !== 0 && ` · ${delta > 0 ? '+' : '−'}${decimalText(Math.abs(delta))} kg`}
                    {entry.note && ` · ${entry.note}`}
                  </span>
                  <div>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(entry)}><Pencil aria-hidden="true" /> Editar</Button>
                    <Button variant="ghost" size="sm" onClick={() => remove(entry)} disabled={busy}><Trash2 aria-hidden="true" /> Excluir</Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <BeforeAfter />

      <p className="ft-privacy-note">Seu peso é um dado pessoal e fica salvo só na sua conta. Este espaço não oferece orientação médica.</p>
    </div>
  );
}
