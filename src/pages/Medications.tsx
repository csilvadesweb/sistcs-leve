import { useMemo, useState, type FormEvent } from 'react';
import { Check, Clock, Pencil, Pill, Plus, Save, Trash2, X } from 'lucide-react';
import { useAppData } from '../session';
import {
  createMedication,
  deleteMedication,
  setMedicationTaken,
  updateMedication,
  type Medication,
  type MedicationInput,
} from '../data';
import { Button, Field, formatDate, todayInSaoPaulo, useRunner } from '../ui';

type Feedback = { kind: 'success' | 'error'; message: string } | null;

interface MedForm {
  name: string;
  dose: string;
  times: string[];
  notes: string;
  active: boolean;
}

const blankForm: MedForm = { name: '', dose: '', times: ['08:00'], notes: '', active: true };

export function Medications() {
  const { data, reload, loading, error: loadError } = useAppData();
  const { busy, run } = useRunner(reload);
  const [date, setDate] = useState(todayInSaoPaulo);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Medication | null>(null);
  const [form, setForm] = useState<MedForm>(blankForm);
  const [errors, setErrors] = useState<{ name?: string; dose?: string; times?: string; notes?: string }>({});
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [activeMedicationTab, setActiveMedicationTab] = useState<'today' | 'manage'>('today');

  const taken = useMemo(() => {
    const set = new Set<string>();
    for (const log of data.medicationLogs) {
      if (log.date === date) set.add(`${log.medicationId}|${log.time}`);
    }
    return set;
  }, [data.medicationLogs, date]);

  const active = data.medications.filter((m) => m.active);
  const inactive = data.medications.filter((m) => !m.active);

  // Cada medicamento ativo gera uma dose por horário; sem horário, uma dose avulsa no dia.
  const doses = active.flatMap((m) => (m.times.length ? m.times : ['']).map((time) => ({ med: m, time })));
  const doneCount = doses.filter((d) => taken.has(`${d.med.id}|${d.time}`)).length;

  function openNew() {
    setEditing(null);
    setForm({ ...blankForm, times: [...blankForm.times] });
    setErrors({});
    setFeedback(null);
    setOpen(true);
  }

  function openEdit(med: Medication) {
    setEditing(med);
    setForm({ name: med.name, dose: med.dose, times: med.times.length ? [...med.times] : [], notes: med.notes, active: med.active });
    setErrors({});
    setFeedback(null);
    setOpen(true);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const errs: typeof errors = {};
    if (!form.name.trim()) errs.name = 'Informe o nome do medicamento.';
    else if (form.name.trim().length > 120) errs.name = 'Use até 120 caracteres.';
    if (form.dose.length > 120) errs.dose = 'Use até 120 caracteres.';
    if (form.notes.length > 300) errs.notes = 'Use até 300 caracteres.';
    if (form.times.some((t) => !/^\d{2}:\d{2}$/.test(t))) errs.times = 'Preencha todos os horários ou remova os vazios.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    const input: MedicationInput = {
      name: form.name.trim(),
      dose: form.dose.trim(),
      times: Array.from(new Set(form.times)).sort(),
      notes: form.notes.trim(),
      active: form.active,
    };
    await run(
      async () => {
        if (editing) await updateMedication(editing.id, input);
        else await createMedication(input);
        setFeedback({ kind: 'success', message: editing ? 'Medicamento atualizado.' : 'Medicamento cadastrado.' });
        setOpen(false);
        setEditing(null);
      },
      (message) => setFeedback({ kind: 'error', message }),
      'Não foi possível salvar o medicamento.',
    );
  }

  async function remove(med: Medication) {
    if (!window.confirm(`Excluir “${med.name}” e todo o histórico de doses?`)) return;
    await run(
      async () => {
        await deleteMedication(med.id);
        setFeedback({ kind: 'success', message: 'Medicamento excluído.' });
      },
      (message) => setFeedback({ kind: 'error', message }),
      'Não foi possível excluir o medicamento.',
    );
  }

  async function toggle(med: Medication, time: string, value: boolean) {
    await run(
      async () => {
        await setMedicationTaken(med.id, date, time, value);
      },
      (message) => setFeedback({ kind: 'error', message }),
      'Não foi possível atualizar a dose.',
    );
  }

  return (
    <div className="ft-page page-enter">
      <header className="ft-heading">
        <div>
          <p className="eyebrow"><span className="eyebrow-dot" />INFORMAÇÕES DE CUIDADO</p>
          <h1 className="serif-display">Medicamentos</h1>
          <p>Anote o que você toma e marque cada dose. Os horários e as doses são os que você informar.</p>
        </div>
        <div className="ft-heading-icon" aria-hidden="true"><Pill size={29} strokeWidth={1.6} /></div>
      </header>

      {loadError && <p className="ft-feedback ft-feedback-error" role="alert">{loadError}</p>}
      {loading && <p className="ft-feedback" role="status">Carregando seus medicamentos…</p>}

      <div className="progressive-tabs" role="tablist" aria-label="Seções de medicamentos">
        <button type="button" role="tab" aria-selected={activeMedicationTab === 'today'} aria-controls="med-panel-today" className={activeMedicationTab === 'today' ? 'progressive-tab is-active' : 'progressive-tab'} onClick={() => setActiveMedicationTab('today')}><Check size={17} aria-hidden="true" /> Doses do dia</button>
        <button type="button" role="tab" aria-selected={activeMedicationTab === 'manage'} aria-controls="med-panel-manage" className={activeMedicationTab === 'manage' ? 'progressive-tab is-active' : 'progressive-tab'} onClick={() => setActiveMedicationTab('manage')}><Pill size={17} aria-hidden="true" /> Meus medicamentos <span className="progressive-tab-count">{data.medications.length}</span></button>
      </div>
      {activeMedicationTab === 'today' && <div id="med-panel-today" role="tabpanel">
      <section className="ft-date-card" aria-label="Dia das doses">
        <div>
          <label htmlFor="med-date">Consultando o dia</label>
          <p>{formatDate(date)}</p>
        </div>
        <input id="med-date" className="input" type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
      </section>

      <section className="ft-card" aria-labelledby="doses-title">
        <div className="ft-section-heading">
          <div className="ft-section-mark"><Check size={19} aria-hidden="true" /></div>
          <div><p className="ft-kicker">DOSES DO DIA</p><h2 id="doses-title">O que tomar neste dia</h2></div>
        </div>

        {feedback && (
          <p className={`ft-feedback ft-feedback-${feedback.kind}`} role={feedback.kind === 'error' ? 'alert' : 'status'} aria-live="polite">
            {feedback.message}
          </p>
        )}

        {doses.length > 0 ? (
          <>
            <div className="med-summary" aria-live="polite">
              <strong>{doneCount} de {doses.length}</strong>
              <span>{doses.length === 1 ? 'dose marcada' : 'doses marcadas'} neste dia</span>
              <div className="goal-bar big" role="img" aria-label={`${doneCount} de ${doses.length} doses marcadas`}>
                <i style={{ width: `${(doneCount / doses.length) * 100}%` }} />
              </div>
            </div>
            <ul className="med-doses">
              {doses
                .slice()
                .sort((a, b) => (a.time === b.time ? a.med.name.localeCompare(b.med.name, 'pt-BR') : a.time < b.time ? -1 : 1))
                .map(({ med, time }) => {
                  const isTaken = taken.has(`${med.id}|${time}`);
                  const id = `dose-${med.id}-${time || 'avulsa'}`;
                  return (
                    <li key={id} className={isTaken ? 'is-taken' : ''}>
                      <input id={id} type="checkbox" checked={isTaken} disabled={busy} onChange={(e) => toggle(med, time, e.target.checked)} />
                      <label htmlFor={id}>
                        <strong>{med.name}</strong>
                        <span>{[med.dose, time ? `às ${time}` : 'sem horário'].filter(Boolean).join(' · ')}</span>
                      </label>
                    </li>
                  );
                })}
            </ul>
          </>
        ) : (
          <div className="ft-empty">
            <span className="ft-empty-icon"><Pill size={20} aria-hidden="true" /></span>
            <h3>Nenhuma dose para este dia</h3>
            <p>Cadastre um medicamento com seus horários e as doses aparecem aqui para você marcar.</p>
          </div>
        )}
      </section>

      </div>}
      {activeMedicationTab === 'manage' && <div id="med-panel-manage" role="tabpanel">
      <section className="ft-card" aria-labelledby="meds-title">
        <div className="ft-section-heading">
          <div className="ft-section-mark"><Pill size={19} aria-hidden="true" /></div>
          <div><p className="ft-kicker">CADASTRO</p><h2 id="meds-title">Seus medicamentos</h2></div>
          {!open && <Button onClick={openNew}><Plus aria-hidden="true" /> Novo medicamento</Button>}
        </div>

        {open && (
          <form className="ft-editor" onSubmit={onSubmit} noValidate>
            <div className="ft-editor-top">
              <h3>{editing ? 'Editar medicamento' : 'Novo medicamento'}</h3>
              <Button variant="ghost" onClick={() => { setOpen(false); setEditing(null); }}>
                <X aria-hidden="true" /> Fechar
              </Button>
            </div>
            <div className="ft-form-grid">
              <Field id="med-name" label="Nome" className="ft-field" error={errors.name}>
                <input id="med-name" className="input" maxLength={120} autoComplete="off" value={form.name} onChange={(e) => setForm((v) => ({ ...v, name: e.target.value }))} />
              </Field>
              <Field id="med-dose" label="Dose" optional className="ft-field" error={errors.dose} hint="Como está na sua receita ou na caixa.">
                <input id="med-dose" className="input" maxLength={120} autoComplete="off" value={form.dose} onChange={(e) => setForm((v) => ({ ...v, dose: e.target.value }))} />
              </Field>
            </div>

            <fieldset className="ft-nutrients">
              <legend>Horários</legend>
              <p>Adicione um horário para cada dose do dia. Sem horários, o medicamento aparece como uma dose avulsa.</p>
              <div className="med-times">
                {form.times.map((t, i) => (
                  <div className="med-time" key={i}>
                    <Clock size={15} aria-hidden="true" />
                    <input
                      className="input"
                      type="time"
                      aria-label={`Horário ${i + 1}`}
                      value={t}
                      onChange={(e) => setForm((v) => ({ ...v, times: v.times.map((x, j) => (j === i ? e.target.value : x)) }))}
                    />
                    <Button variant="ghost" size="sm" aria-label={`Remover horário ${i + 1}`}
                      onClick={() => setForm((v) => ({ ...v, times: v.times.filter((_, j) => j !== i) }))}>
                      <Trash2 aria-hidden="true" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => setForm((v) => ({ ...v, times: [...v.times, '12:00'] }))}>
                  <Plus aria-hidden="true" /> Adicionar horário
                </Button>
              </div>
              {errors.times && <p className="field-error" role="alert">{errors.times}</p>}
            </fieldset>

            <div className="ft-form-grid">
              <Field id="med-notes" label="Anotação" optional className="ft-field" error={errors.notes}>
                <input id="med-notes" className="input" maxLength={300} autoComplete="off" value={form.notes} onChange={(e) => setForm((v) => ({ ...v, notes: e.target.value }))} />
              </Field>
              <div className="field ft-field">
                <label htmlFor="med-active">Situação</label>
                <label className="med-check" htmlFor="med-active">
                  <input id="med-active" type="checkbox" checked={form.active} onChange={(e) => setForm((v) => ({ ...v, active: e.target.checked }))} />
                  Em uso (aparece nas doses do dia)
                </label>
              </div>
            </div>

            <div className="ft-form-actions">
              <Button type="submit" disabled={busy}>
                <Save aria-hidden="true" /> {editing ? 'Salvar alterações' : 'Cadastrar medicamento'}
              </Button>
            </div>
          </form>
        )}

        {data.medications.length === 0 && !open && (
          <div className="ft-empty">
            <span className="ft-empty-icon"><Pill size={20} aria-hidden="true" /></span>
            <h3>Nenhum medicamento cadastrado</h3>
            <p>Quando quiser, cadastre o que você usa. Nada é preenchido ou sugerido pelo app.</p>
            <Button variant="outline" onClick={openNew}><Plus aria-hidden="true" /> Novo medicamento</Button>
          </div>
        )}

        {[...active, ...inactive].map((med) => (
          <div className="ft-favorite-row" key={med.id}>
            <div>
              <strong>{med.name}{!med.active && ' (pausado)'}</strong>
              <span>{[med.dose, med.times.length ? med.times.join(', ') : 'sem horário', med.notes].filter(Boolean).join(' · ')}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => openEdit(med)}><Pencil aria-hidden="true" /> Editar</Button>
            <Button variant="ghost" size="sm" onClick={() => remove(med)} disabled={busy}><Trash2 aria-hidden="true" /> Excluir</Button>
          </div>
        ))}
      </section>

      </div>}
      <p className="ft-privacy-note">
        Este espaço é só um lembrete pessoal. Siga sempre a orientação de quem prescreveu o medicamento. Em caso de dúvida, fale com seu médico ou farmacêutico.
      </p>
    </div>
  );
}
