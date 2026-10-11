import { useMemo, useRef, useState, type FormEvent } from 'react';
import { Camera, Plus, Trash2, X } from 'lucide-react';
import { useAppData } from '../session';
import { addProgressPhoto, deleteProgressPhoto, type PhotoKind, type ProgressPhoto } from '../data';
import { PhotoImg, resizeImage } from '../photos';
import { Button, Field, decimalText, formatDate, todayInSaoPaulo, useRunner } from '../ui';

const KIND_LABEL: Record<PhotoKind, string> = { before: 'Antes', progress: 'Durante', after: 'Depois' };

type Feedback = { kind: 'success' | 'error'; message: string } | null;

export function BeforeAfter() {
  const { user, data, reload } = useAppData();
  const { busy, run } = useRunner(reload);
  const photos = data.progressPhotos;
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<{ date: string; kind: PhotoKind; note: string }>({ date: todayInSaoPaulo(), kind: 'before', note: '' });
  const [fileError, setFileError] = useState('');
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [leftId, setLeftId] = useState('');
  const [rightId, setRightId] = useState('');

  const sorted = useMemo(() => [...photos].sort((a, b) => (a.date === b.date ? 0 : a.date < b.date ? -1 : 1)), [photos]);
  const defaultLeft = sorted.find((p) => p.kind === 'before') ?? sorted[0];
  const defaultRight = [...sorted].reverse().find((p) => p.kind === 'after') ?? sorted[sorted.length - 1];
  const left = photos.find((p) => p.id === leftId) ?? defaultLeft;
  const right = photos.find((p) => p.id === rightId) ?? defaultRight;

  function weightOn(date: string) {
    const w = data.weightEntries.find((e) => e.date === date);
    return w ? `${decimalText(w.weightKg)} kg` : null;
  }

  function label(p: ProgressPhoto) {
    return `${KIND_LABEL[p.kind]} · ${formatDate(p.date)}`;
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const file = fileRef.current?.files?.[0];
    setFileError('');
    if (!file) return setFileError('Escolha uma foto.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date)) return setFeedback({ kind: 'error', message: 'Escolha uma data válida.' });
    await run(
      async () => {
        const blob = await resizeImage(file, 1280);
        await addProgressPhoto(user.id, blob, { date: form.date, kind: form.kind, note: form.note.trim() });
        setFeedback({ kind: 'success', message: 'Foto salva.' });
        setOpen(false);
        setForm((v) => ({ ...v, note: '' }));
        if (fileRef.current) fileRef.current.value = '';
      },
      (message) => setFeedback({ kind: 'error', message }),
      'Não foi possível salvar a foto.',
    );
  }

  async function remove(p: ProgressPhoto) {
    if (!window.confirm(`Excluir a foto de ${formatDate(p.date)}? Ela será apagada da sua conta.`)) return;
    await run(
      async () => {
        await deleteProgressPhoto(p);
        setFeedback({ kind: 'success', message: 'Foto excluída.' });
      },
      (message) => setFeedback({ kind: 'error', message }),
      'Não foi possível excluir a foto.',
    );
  }

  const options = sorted.map((p) => <option key={p.id} value={p.id}>{label(p)}</option>);

  return (
    <section className="ft-card" aria-labelledby="ba-title">
      <div className="ft-section-heading">
        <div className="ft-section-mark"><Camera size={19} aria-hidden="true" /></div>
        <div><p className="ft-kicker">ANTES E DEPOIS</p><h2 id="ba-title">Suas fotos de evolução</h2></div>
        {!open && <Button onClick={() => { setOpen(true); setFeedback(null); }}><Plus aria-hidden="true" /> Adicionar foto</Button>}
      </div>
      <p className="ft-privacy-note" style={{ marginTop: 10 }}>
        As fotos ficam num espaço privado da sua conta. Só você consegue vê-las, e as imagens são reduzidas antes do envio.
      </p>

      {feedback && (
        <p className={`ft-feedback ft-feedback-${feedback.kind}`} role={feedback.kind === 'error' ? 'alert' : 'status'} aria-live="polite">
          {feedback.message}
        </p>
      )}

      {open && (
        <form className="ft-editor" onSubmit={onSubmit} noValidate>
          <div className="ft-editor-top">
            <h3>Nova foto</h3>
            <Button variant="ghost" onClick={() => setOpen(false)}><X aria-hidden="true" /> Fechar</Button>
          </div>
          <div className="ft-form-grid">
            <Field id="ph-kind" label="Momento" className="ft-field">
              <select id="ph-kind" className="input" value={form.kind} onChange={(e) => setForm((v) => ({ ...v, kind: e.target.value as PhotoKind }))}>
                <option value="before">Antes</option>
                <option value="progress">Durante</option>
                <option value="after">Depois</option>
              </select>
            </Field>
            <Field id="ph-date" label="Data da foto" className="ft-field">
              <input id="ph-date" className="input" type="date" max={todayInSaoPaulo()} value={form.date} onChange={(e) => setForm((v) => ({ ...v, date: e.target.value }))} />
            </Field>
            <Field id="ph-note" label="Anotação" optional className="ft-field">
              <input id="ph-note" className="input" maxLength={200} autoComplete="off" value={form.note} onChange={(e) => setForm((v) => ({ ...v, note: e.target.value }))} />
            </Field>
          </div>
          <Field id="ph-file" label="Foto" className="ft-field" error={fileError} hint="JPG, PNG ou WebP. No celular, você pode tirar a foto na hora.">
            <input id="ph-file" ref={fileRef} className="input file-input" type="file" accept="image/jpeg,image/png,image/webp" />
          </Field>
          <div className="ft-form-actions">
            <Button type="submit" disabled={busy}>{busy ? 'Enviando…' : 'Salvar foto'}</Button>
          </div>
        </form>
      )}

      {photos.length >= 1 ? (
        <>
          <div className="ba-compare" aria-label="Comparação antes e depois">
            {[{ side: 'left', p: left, set: setLeftId, id: 'ba-left', title: 'Antes' }, { side: 'right', p: right, set: setRightId, id: 'ba-right', title: 'Depois' }].map(({ side, p, set, id, title }) => (
              <figure className="ba-col" key={side}>
                <label htmlFor={id} className="ba-label">{title}</label>
                <select id={id} className="input" value={p?.id ?? ''} onChange={(e) => set(e.target.value)}>{options}</select>
                {p && (
                  <>
                    <PhotoImg path={p.path} alt={`Foto ${KIND_LABEL[p.kind].toLowerCase()} de ${formatDate(p.date)}`} />
                    <figcaption>
                      {formatDate(p.date)}{weightOn(p.date) ? ` · ${weightOn(p.date)}` : ''}
                      {p.note ? <><br />{p.note}</> : null}
                    </figcaption>
                  </>
                )}
              </figure>
            ))}
          </div>

          {left && right && left.id !== right.id && (
            <p className="ba-summary">
              {(() => {
                const days = Math.round((Date.parse(right.date) - Date.parse(left.date)) / 86400000);
                const wl = data.weightEntries.find((e) => e.date === left.date);
                const wr = data.weightEntries.find((e) => e.date === right.date);
                const diff = wl && wr ? wr.weightKg - wl.weightKg : null;
                return `${Math.abs(days)} ${Math.abs(days) === 1 ? 'dia' : 'dias'} entre as fotos${diff === null ? '' : ` · ${diff > 0 ? '+' : diff < 0 ? '−' : ''}${decimalText(Math.abs(diff))} kg no peso`}.`;
              })()}
            </p>
          )}

          <h3 className="ba-gallery-title">Galeria</h3>
          <ul className="ba-gallery">
            {[...sorted].reverse().map((p) => (
              <li key={p.id}>
                <PhotoImg path={p.path} alt={`Foto ${KIND_LABEL[p.kind].toLowerCase()} de ${formatDate(p.date)}`} />
                <div>
                  <strong>{KIND_LABEL[p.kind]}</strong>
                  <span>{formatDate(p.date)}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => remove(p)} disabled={busy} aria-label={`Excluir foto de ${formatDate(p.date)}`}>
                  <Trash2 aria-hidden="true" />
                </Button>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <div className="ft-empty">
          <span className="ft-empty-icon"><Camera size={20} aria-hidden="true" /></span>
          <h3>Nenhuma foto ainda</h3>
          <p>Adicione uma foto de “antes” e, quando quiser, uma de “depois” para ver o seu percurso lado a lado.</p>
          {!open && <Button variant="outline" onClick={() => setOpen(true)}><Plus aria-hidden="true" /> Adicionar foto</Button>}
        </div>
      )}
    </section>
  );
}
