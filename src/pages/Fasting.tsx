import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Check, Clock, Droplets, Flame, HeartPulse, Play, Square, Timer, Trash2, TriangleAlert } from 'lucide-react';
import { useAppData } from '../session';
import { deleteFast, endFast, fastHours, startFast, updateFastingStart, type FastingEntry } from '../data';
import { ageFromBirth } from '../calc';
import { Button, Field, decimalText, todayInSaoPaulo, useRunner } from '../ui';

import { FASTING_PROTOCOLS, FASTING_METHODS } from '../fasting-protocols';

/** Fases apenas informativas: o corpo de cada pessoa responde de um jeito. */
const PHASES = [
  { from: 0, title: 'Digestão', text: 'O corpo ainda está processando a última refeição.' },
  { from: 4, title: 'Transição', text: 'A glicose e a insulina começam a baixar entre as refeições.' },
  { from: 8, title: 'Jejum em curso', text: 'O corpo usa mais as reservas de energia. Beba água.' },
  { from: 12, title: 'Uso de gordura como energia', text: 'Em geral, a partir daqui o uso de gordura como combustível aumenta.' },
  { from: 16, title: 'Jejum prolongado', text: 'Escute o corpo. Se sentir tontura ou mal-estar, encerre e se alimente.' },
];

const BENEFITS = [
  { icon: Flame, title: 'Controle de calorias e peso', text: 'Concentrar as refeições numa janela costuma reduzir o total de calorias do dia. Estudos mostram perda de peso modesta, parecida com a de outras dietas com o mesmo déficit calórico.' },
  { icon: HeartPulse, title: 'Glicose e insulina', text: 'Intervalos maiores sem comer podem melhorar a sensibilidade à insulina e a glicemia em jejum em algumas pessoas. Os resultados variam e quem tem diabetes precisa de acompanhamento médico.' },
  { icon: Clock, title: 'Rotina e menos beliscos', text: 'Horários definidos ajudam a reduzir lanches fora de hora e a comer com mais atenção. Para muita gente, esse é o principal ganho.' },
  { icon: Timer, title: 'Descanso do sistema digestivo', text: 'Pausas entre as refeições dão tempo para a digestão terminar. Há pesquisas sobre efeitos em colesterol e pressão, mas as evidências em humanos ainda são limitadas.' },
];

const pad = (n: number) => String(Math.floor(n)).padStart(2, '0');
function clock(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${pad(s / 3600)}:${pad((s % 3600) / 60)}:${pad(s % 60)}`;
}
function durationText(hours: number) {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m === 60 ? `${h + 1} h` : `${h} h ${pad(m)} min`;
}
const dayTime = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
function toLocalInput(d: Date) {
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 16);
}

type Feedback = { kind: 'success' | 'error'; message: string } | null;

export function Fasting() {
  const { data, reload } = useAppData();
  const { busy, run } = useRunner(reload);
  const [now, setNow] = useState(() => Date.now());
  const [protocol, setProtocol] = useState(16);
  const [custom, setCustom] = useState('');
  const [startedEarlier, setStartedEarlier] = useState('');
  const [editStart, setEditStart] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [activeFastingTab, setActiveFastingTab] = useState<'timer' | 'protocols' | 'history' | 'benefits'>('timer');

  const fasts = data.fastingEntries;
  const active = fasts.find((f) => !f.endedAt) ?? null;
  const done = useMemo(() => fasts.filter((f) => f.endedAt), [fasts]);

  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [active?.id]);

  const age = data.profile?.birthDate ? ageFromBirth(data.profile.birthDate, todayInSaoPaulo()) : null;
  const minor = age !== null && age < 18;

  const target = custom.trim() ? Number(custom.replace(',', '.')) : protocol;
  const targetOk = Number.isFinite(target) && target >= 12 && target <= 24;

  async function onStart(event: FormEvent) {
    event.preventDefault();
    if (minor) return;
    if (!targetOk) return setFeedback({ kind: 'error', message: 'Use uma duração entre 12 e 24 horas. Para protocolos longos, procure orientação profissional.' });
    let start = new Date();
    if (startedEarlier) {
      start = new Date(startedEarlier);
      if (Number.isNaN(start.getTime()) || start.getTime() > Date.now() || Date.now() - start.getTime() > 72 * 3600000) {
        return setFeedback({ kind: 'error', message: 'O horário de início deve estar nas últimas 72 horas.' });
      }
    }
    await run(
      async () => {
        await startFast(Math.round(target), start);
        setFeedback({ kind: 'success', message: 'Jejum iniciado. Beba água ao longo do dia.' });
        setStartedEarlier('');
      },
      (message) => setFeedback({ kind: 'error', message }),
      'Não foi possível iniciar o jejum.',
    );
  }

  async function onEnd(f: FastingEntry) {
    const hours = fastHours(f);
    await run(
      async () => {
        await endFast(f.id);
        setFeedback({
          kind: 'success',
          message: `Jejum encerrado: ${durationText(hours)}. ${hours >= f.targetHours ? 'Você chegou à meta.' : 'Cada jejum conta; você decide o seu ritmo.'}`,
        });
      },
      (message) => setFeedback({ kind: 'error', message }),
      'Não foi possível encerrar o jejum.',
    );
  }

  async function onSaveStart(f: FastingEntry) {
    if (!editStart) return;
    const d = new Date(editStart);
    if (Number.isNaN(d.getTime()) || d.getTime() > Date.now()) return setFeedback({ kind: 'error', message: 'Escolha um horário que já passou.' });
    await run(
      async () => {
        await updateFastingStart(f.id, d);
        setEditStart(null);
        setFeedback({ kind: 'success', message: 'Horário de início ajustado.' });
      },
      (message) => setFeedback({ kind: 'error', message }),
      'Não foi possível ajustar o horário.',
    );
  }

  async function onDelete(f: FastingEntry) {
    if (!window.confirm('Excluir este jejum do histórico?')) return;
    await run(
      async () => {
        await deleteFast(f.id);
        setFeedback({ kind: 'success', message: 'Jejum excluído.' });
      },
      (message) => setFeedback({ kind: 'error', message }),
      'Não foi possível excluir o jejum.',
    );
  }

  const week = done.filter((f) => Date.parse(f.startedAt) >= Date.now() - 7 * 86400000);
  const avg = done.length ? done.reduce((t, f) => t + fastHours(f), 0) / done.length : 0;
  const longest = done.reduce((m, f) => Math.max(m, fastHours(f)), 0);
  const reached = done.filter((f) => fastHours(f) >= f.targetHours).length;

  const elapsedMs = active ? Math.max(0, now - Date.parse(active.startedAt)) : 0;
  const elapsedH = elapsedMs / 3600000;
  const pct = active ? Math.min(100, (elapsedH / active.targetHours) * 100) : 0;
  const phase = [...PHASES].reverse().find((p) => elapsedH >= p.from) ?? PHASES[0]!;
  const R = 78;
  const C = 2 * Math.PI * R;

  return (
    <div className="ft-page page-enter">
      <header className="ft-heading">
        <div>
          <p className="eyebrow"><span className="eyebrow-dot" />JEJUM INTERMITENTE</p>
          <h1 className="serif-display">Jejum</h1>
          <p>Marque quando começou e quando terminou e veja quantas horas ficou em jejum, sem pressa e sem cobrança.</p>
        </div>
        <div className="ft-heading-icon" aria-hidden="true"><Timer size={29} strokeWidth={1.6} /></div>
      </header>

      {feedback && (
        <p className={`ft-feedback ft-feedback-${feedback.kind}`} role={feedback.kind === 'error' ? 'alert' : 'status'} aria-live="polite">{feedback.message}</p>
      )}

      <div className="progressive-tabs" role="tablist" aria-label="Seções de jejum">
        <button type="button" role="tab" aria-selected={activeFastingTab === 'timer'} aria-controls="fast-panel-timer" className={activeFastingTab === 'timer' ? 'progressive-tab is-active' : 'progressive-tab'} onClick={() => setActiveFastingTab('timer')}><Timer size={17} aria-hidden="true" /> Cronômetro</button>
        <button type="button" role="tab" aria-selected={activeFastingTab === 'protocols'} aria-controls="fast-panel-protocols" className={activeFastingTab === 'protocols' ? 'progressive-tab is-active' : 'progressive-tab'} onClick={() => setActiveFastingTab('protocols')}>Protocolos</button>
        <button type="button" role="tab" aria-selected={activeFastingTab === 'history'} aria-controls="fast-panel-history" className={activeFastingTab === 'history' ? 'progressive-tab is-active' : 'progressive-tab'} onClick={() => setActiveFastingTab('history')}><Clock size={17} aria-hidden="true" /> Histórico</button>
        <button type="button" role="tab" aria-selected={activeFastingTab === 'benefits'} aria-controls="fast-panel-benefits" className={activeFastingTab === 'benefits' ? 'progressive-tab is-active' : 'progressive-tab'} onClick={() => setActiveFastingTab('benefits')}>Informações</button>
      </div>

      {activeFastingTab === 'timer' && <div id="fast-panel-timer" role="tabpanel">
      <section className="ft-card fast-card" aria-labelledby="fast-timer-title">
        <div className="ft-section-heading">
          <div className="ft-section-mark"><Timer size={19} aria-hidden="true" /></div>
          <div><p className="ft-kicker">{active ? 'EM ANDAMENTO' : 'COMEÇAR'}</p><h2 id="fast-timer-title">{active ? `Jejum de ${active.targetHours} horas` : 'Cronômetro do jejum'}</h2></div>
        </div>

        {minor ? (
          <p className="fast-warning" role="note"><TriangleAlert size={16} aria-hidden="true" /> O jejum intermitente não é indicado para menores de 18 anos. Converse com um profissional de saúde.</p>
        ) : active ? (
          <div className="fast-active">
            <svg className="fast-ring" viewBox="0 0 180 180" role="img" aria-label={`${decimalText(pct)}% da meta de ${active.targetHours} horas`}>
              <circle className="r-track" cx="90" cy="90" r={R} />
              <circle className={`r-val ${elapsedH >= active.targetHours ? 'done' : ''}`} cx="90" cy="90" r={R} strokeDasharray={`${(C * pct) / 100} ${C}`} transform="rotate(-90 90 90)" />
              <text className="fast-clock" x="90" y="92" textAnchor="middle">{clock(elapsedMs)}</text>
              <text className="r-sub" x="90" y="114" textAnchor="middle">de {active.targetHours} h</text>
            </svg>
            <div className="fast-info">
              <p className="fast-phase"><strong>{phase.title}</strong><span>{phase.text}</span></p>
              <dl className="fast-times">
                <div><dt>Começou</dt><dd>{dayTime.format(new Date(active.startedAt))}</dd></div>
                <div><dt>Meta às</dt><dd>{dayTime.format(new Date(Date.parse(active.startedAt) + active.targetHours * 3600000))}</dd></div>
                <div><dt>{elapsedH >= active.targetHours ? 'Além da meta' : 'Faltam'}</dt><dd>{durationText(Math.abs(active.targetHours - elapsedH))}</dd></div>
              </dl>
              {elapsedH >= active.targetHours && <p className="fast-reached"><Check size={16} aria-hidden="true" /> Meta atingida. Quando quiser, encerre e faça uma refeição leve.</p>}
              <div className="ft-form-actions">
                <Button onClick={() => onEnd(active)} disabled={busy}><Square aria-hidden="true" /> Encerrar jejum</Button>
                {editStart === null ? (
                  <Button variant="outline" onClick={() => setEditStart(toLocalInput(new Date(active.startedAt)))}>Ajustar início</Button>
                ) : (
                  <span className="fast-edit">
                    <label htmlFor="fast-edit-start" className="sr-only">Novo horário de início</label>
                    <input id="fast-edit-start" className="input" type="datetime-local" max={toLocalInput(new Date())} value={editStart} onChange={(e) => setEditStart(e.target.value)} />
                    <Button onClick={() => onSaveStart(active)} disabled={busy}>Salvar</Button>
                    <Button variant="ghost" onClick={() => setEditStart(null)}>Cancelar</Button>
                  </span>
                )}
              </div>
              <p className="fast-hydrate"><Droplets size={14} aria-hidden="true" /> Durante o jejum, água, café e chá sem açúcar costumam ser permitidos.</p>
            </div>
          </div>
        ) : (
          <form onSubmit={onStart} noValidate>
            <fieldset className="fast-protocols">
              <legend>Escolha o protocolo (horas de jejum : horas para comer)</legend>
              <div className="fast-protocol-grid">
                {FASTING_PROTOCOLS.map((p) => (
                  <label key={p.hours} className={`fast-protocol ${!custom.trim() && protocol === p.hours ? 'is-on' : ''}`}>
                    <input type="radio" name="protocol" checked={!custom.trim() && protocol === p.hours} onChange={() => { setProtocol(p.hours); setCustom(''); }} />
                    <strong>{p.label}</strong>
                    <span>{p.hint}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="ft-form-grid">
              <Field id="fast-custom" label="Ou outra duração (horas)" optional className="ft-field" hint="Entre 12 e 24 horas.">
                <input id="fast-custom" className="input" type="text" inputMode="decimal" maxLength={5} value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Ex.: 15" />
              </Field>
              <Field id="fast-earlier" label="Já comecei antes" optional className="ft-field" hint="Informe o horário de início, se foi nas últimas 72 horas.">
                <input id="fast-earlier" className="input" type="datetime-local" max={toLocalInput(new Date())} value={startedEarlier} onChange={(e) => setStartedEarlier(e.target.value)} />
              </Field>
            </div>
            <div className="ft-form-actions">
              <Button type="submit" disabled={busy || !targetOk}><Play aria-hidden="true" /> Iniciar jejum de {targetOk ? Math.round(target) : '—'} h</Button>
            </div>
          </form>
        )}
      </section>

      </div>}
      {activeFastingTab === 'protocols' && <div id="fast-panel-protocols" role="tabpanel">
      <section className="ft-card" aria-labelledby="fast-methods-title">
        <div className="ft-section-heading">
          <div className="ft-section-mark"><HeartPulse size={19} aria-hidden="true" /></div>
          <div><p className="ft-kicker">GUIA DE PROTOCOLOS</p><h2 id="fast-methods-title">Encontre o método que combina com sua rotina</h2></div>
        </div>
        <p className="empty-description">Os protocolos abaixo são explicações gerais, não uma recomendação individual. O cronômetro registra jejuns por duração; métodos semanais exigem planejamento próprio e não são iniciados pelo botão do cronômetro.</p>
        <div className="fast-method-grid">
          {FASTING_METHODS.map((method) => (
            <article className="fast-method-card" key={method.id}>
              <div className="fast-method-top"><strong>{method.name}</strong><span className={method.level === 'Exige orientação' ? 'fast-method-caution' : 'fast-method-level'}>{method.level}</span></div>
              <p>{method.description}</p>
              <small>{method.schedule}</small>
            </article>
          ))}
        </div>
        <p className="fast-warning" role="note"><TriangleAlert size={16} aria-hidden="true" /><span><strong>Importante:</strong> não é necessário prolongar o jejum para obter benefícios. Evite jejuns de 20–24 horas, OMAD, 5:2 ou dias alternados sem avaliação profissional. Pare se houver tontura, tremores, fraqueza, confusão ou mal-estar.</span></p>
      </section>

      </div>}
      {activeFastingTab === 'history' && <div id="fast-panel-history" role="tabpanel">
      <section className="stat-grid" aria-label="Resumo dos jejuns">
        <div className="stat"><span>Últimos 7 dias</span><strong>{week.length} <small>{week.length === 1 ? 'jejum' : 'jejuns'}</small></strong><small>encerrados</small></div>
        <div className="stat"><span>Duração média</span><strong>{done.length ? durationText(avg) : '—'}</strong><small>{done.length ? `em ${done.length} jejuns` : 'sem jejuns encerrados'}</small></div>
        <div className="stat"><span>Mais longo</span><strong>{done.length ? durationText(longest) : '—'}</strong><small>seu recorde</small></div>
        <div className="stat"><span>Metas atingidas</span><strong>{done.length ? `${reached} de ${done.length}` : '—'}</strong><small>jejuns até a meta</small></div>
      </section>

      <section className="ft-card" aria-labelledby="fast-history-title">
        <div className="ft-section-heading">
          <div className="ft-section-mark"><Clock size={19} aria-hidden="true" /></div>
          <div><p className="ft-kicker">HISTÓRICO</p><h2 id="fast-history-title">Seus jejuns</h2></div>
        </div>
        {done.length ? (
          <div className="ft-water-list">
            {done.map((f) => {
              const h = fastHours(f);
              const ok = h >= f.targetHours;
              return (
                <div className="ft-water-row" key={f.id}>
                  <span className="ft-water-row-icon"><Timer size={16} aria-hidden="true" /></span>
                  <strong>{durationText(h)}</strong>
                  <span className="ft-water-date">
                    {dayTime.format(new Date(f.startedAt))} até {dayTime.format(new Date(f.endedAt!))} · meta {f.targetHours} h · {ok ? 'atingida' : 'não atingida'}
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => onDelete(f)} disabled={busy} aria-label="Excluir jejum"><Trash2 aria-hidden="true" /> Excluir</Button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="ft-empty">
            <span className="ft-empty-icon"><Timer size={20} aria-hidden="true" /></span>
            <h3>Nenhum jejum encerrado</h3>
            <p>Quando você iniciar e encerrar um jejum, ele aparece aqui com o total de horas.</p>
          </div>
        )}
      </section>

      </div>}
      {activeFastingTab === 'benefits' && <div id="fast-panel-benefits" role="tabpanel">
      <section className="ft-card" aria-labelledby="fast-benefits-title">
        <div className="ft-section-heading">
          <div className="ft-section-mark"><HeartPulse size={19} aria-hidden="true" /></div>
          <div><p className="ft-kicker">ENTENDA</p><h2 id="fast-benefits-title">Benefícios possíveis do jejum intermitente</h2></div>
        </div>
        <ul className="fast-benefits">
          {BENEFITS.map(({ icon: Icon, title, text }) => (
            <li key={title}>
              <span className="fast-benefit-icon"><Icon size={18} aria-hidden="true" /></span>
              <div><strong>{title}</strong><p>{text}</p></div>
            </li>
          ))}
        </ul>
        <p className="fast-warning" role="note">
          <TriangleAlert size={16} aria-hidden="true" />
          <span>
            <strong>Cuidados importantes.</strong> O jejum não é indicado para gestantes, lactantes, menores de 18 anos, pessoas com histórico de transtorno alimentar
            ou que usam insulina ou outros medicamentos para diabetes sem orientação médica. Se sentir tontura, fraqueza ou ansiedade com a comida, encerre o jejum e
            procure um profissional de saúde. Estas informações são gerais e não substituem orientação médica ou de nutricionista.
          </span>
        </p>
      </section>
      </div>}
    </div>
  );
}
