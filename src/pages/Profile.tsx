import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link } from 'wouter';
import { ArrowDownToLine, Calculator, Camera, CloudUpload, LogOut, Save, ShieldCheck, Trash2 } from 'lucide-react';
import { supabase } from '../supabase';
import { useAppData } from '../session';
import {
  clearAllUserData,
  createDataExport,
  importLegacyData,
  readLegacyData,
  removeAvatar,
  saveUserProfile,
  setAvatar,
  weightSummary,
  type GoalKey,
  type UserGoals,
  type UserProfile,
} from '../data';
import {
  ACTIVITY,
  GOAL_LABEL,
  MIN_KCAL,
  PRESETS,
  estimate,
  type Activity,
  type GoalType,
  type MacroPreset,
  type Sex,
} from '../calc';
import { Avatar, resizeImage } from '../photos';
import { InstallCard } from '../pwa';
import { Button, Field, decimalInputText, decimalText, readError, todayInSaoPaulo } from '../ui';

const goalFields: Array<{ key: GoalKey; label: string; unit: string }> = [
  { key: 'calories', label: 'Calorias', unit: 'kcal' },
  { key: 'proteins', label: 'Proteínas', unit: 'g' },
  { key: 'carbohydrates', label: 'Carboidratos', unit: 'g' },
  { key: 'fats', label: 'Gorduras', unit: 'g' },
  { key: 'fiber', label: 'Fibras', unit: 'g' },
  { key: 'waterMl', label: 'Água', unit: 'ml' },
];

type FormKey =
  | 'displayName'
  | GoalKey
  | 'cupVolumeMl'
  | 'heightCm'
  | 'targetWeightKg'
  | 'targetDate'
  | 'sex'
  | 'birthDate'
  | 'activity'
  | 'goalType'
  | 'weeklyRateKg'
  | 'macroPreset';
type FormValues = Record<FormKey, string>;
type Feedback = { kind: 'success' | 'error'; message: string } | null;

const emptyForm: FormValues = {
  displayName: '',
  calories: '',
  proteins: '',
  carbohydrates: '',
  fats: '',
  fiber: '',
  waterMl: '',
  cupVolumeMl: '',
  heightCm: '',
  targetWeightKg: '',
  targetDate: '',
  sex: '',
  birthDate: '',
  activity: '',
  goalType: '',
  weeklyRateKg: '',
  macroPreset: 'balanced',
};

const optionalNumber = (v: number | null | undefined) => (v == null ? '' : decimalInputText(v));

function profileToForm(profile: UserProfile | null): FormValues {
  if (!profile) return emptyForm;
  return {
    displayName: profile.displayName,
    calories: optionalNumber(profile.goals.calories),
    proteins: optionalNumber(profile.goals.proteins),
    carbohydrates: optionalNumber(profile.goals.carbohydrates),
    fats: optionalNumber(profile.goals.fats),
    fiber: optionalNumber(profile.goals.fiber),
    waterMl: optionalNumber(profile.goals.waterMl),
    cupVolumeMl: optionalNumber(profile.cupVolumeMl),
    heightCm: optionalNumber(profile.heightCm),
    targetWeightKg: optionalNumber(profile.targetWeightKg),
    targetDate: profile.targetDate ?? '',
    sex: profile.sex ?? '',
    birthDate: profile.birthDate ?? '',
    activity: profile.activity ?? '',
    goalType: profile.goalType ?? '',
    weeklyRateKg: optionalNumber(profile.weeklyRateKg),
    macroPreset: profile.macroPreset ?? 'balanced',
  };
}

function blankOrPositive(value: string) {
  const t = value.trim();
  if (!t) return true;
  const n = t.replace(',', '.');
  return /^\d+(?:\.\d+)?$/.test(n) && Number(n) > 0;
}

function parseOptional(value: string): number | null {
  const t = value.trim();
  return t ? Number(t.replace(',', '.')) : null;
}

export function ProfileSettings() {
  const { user, data, error: loadError, loading, reload } = useAppData();
  const [form, setForm] = useState<FormValues>(profileToForm(data.profile));
  const [errors, setErrors] = useState<Partial<Record<FormKey, string>>>({});
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [busy, setBusy] = useState(false);
  const [activeProfileTab, setActiveProfileTab] = useState<'dados' | 'metas'>('dados');
  const [legacy, setLegacy] = useState(() => readLegacyData());
  const avatarInput = useRef<HTMLInputElement>(null);
  const avatarPath = data.profile?.avatarPath ?? null;

  async function onAvatarChosen() {
    const file = avatarInput.current?.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const blob = await resizeImage(file, 512, true);
      await setAvatar(user.id, blob, avatarPath);
      await reload();
      setFeedback({ kind: 'success', message: 'Foto de perfil atualizada.' });
    } catch (e) {
      setFeedback({ kind: 'error', message: readError(e, 'Não foi possível salvar a foto de perfil.') });
    } finally {
      if (avatarInput.current) avatarInput.current.value = '';
      setBusy(false);
    }
  }

  async function onAvatarRemove() {
    if (!avatarPath) return;
    setBusy(true);
    try {
      await removeAvatar(user.id, avatarPath);
      await reload();
      setFeedback({ kind: 'success', message: 'Foto de perfil removida.' });
    } catch (e) {
      setFeedback({ kind: 'error', message: readError(e, 'Não foi possível remover a foto.') });
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    setForm(profileToForm(data.profile));
  }, [data.profile]);

  const latestWeight = useMemo(() => weightSummary(data.weightEntries).latest, [data.weightEntries]);
  const today = todayInSaoPaulo();
  const estimateResult = useMemo(
    () =>
      estimate(
        {
          sex: (form.sex || null) as Sex | null,
          birthDate: /^\d{4}-\d{2}-\d{2}$/.test(form.birthDate) ? form.birthDate : null,
          heightCm: blankOrPositive(form.heightCm) ? parseOptional(form.heightCm) : null,
          weightKg: latestWeight?.weightKg ?? null,
          activity: (form.activity || null) as Activity | null,
          goalType: (form.goalType || null) as GoalType | null,
          weeklyRateKg: blankOrPositive(form.weeklyRateKg) ? parseOptional(form.weeklyRateKg) : null,
          macroPreset: form.macroPreset as MacroPreset,
        },
        today,
      ),
    [form, latestWeight, today],
  );

  function applyEstimate() {
    if (!estimateResult.ok) return;
    setForm((v) => ({
      ...v,
      calories: String(estimateResult.kcal),
      proteins: String(estimateResult.protein),
      carbohydrates: String(estimateResult.carbs),
      fats: String(estimateResult.fats),
      fiber: String(estimateResult.fiber),
      waterMl: String(estimateResult.waterMl),
    }));
    setFeedback({ kind: 'success', message: 'Metas preenchidas com a estimativa. Clique em Salvar perfil para guardá-las.' });
  }

  const set = (key: FormKey) => (e: { target: { value: string } }) =>
    setForm((v) => ({ ...v, [key]: e.target.value }));

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const nextErrors: Partial<Record<FormKey, string>> = {};
    if (form.displayName.trim().length > 60) nextErrors.displayName = 'Use até 60 caracteres.';
    for (const key of [...goalFields.map((g) => g.key), 'cupVolumeMl'] as FormKey[]) {
      if (!blankOrPositive(form[key])) nextErrors[key] = 'Informe um número maior que zero ou deixe em branco.';
    }
    if (!blankOrPositive(form.heightCm) || (form.heightCm.trim() && (parseOptional(form.heightCm)! < 50 || parseOptional(form.heightCm)! > 260))) {
      nextErrors.heightCm = 'Informe a altura em centímetros, entre 50 e 260, ou deixe em branco.';
    }
    if (!blankOrPositive(form.targetWeightKg) || (form.targetWeightKg.trim() && (parseOptional(form.targetWeightKg)! < 20 || parseOptional(form.targetWeightKg)! > 400))) {
      nextErrors.targetWeightKg = 'Informe o peso desejado em kg, entre 20 e 400, ou deixe em branco.';
    }
    if (form.targetDate && !/^\d{4}-\d{2}-\d{2}$/.test(form.targetDate)) {
      nextErrors.targetDate = 'Escolha uma data válida ou deixe em branco.';
    }
    if (form.birthDate) {
      const year = Number(form.birthDate.slice(0, 4));
      if (!/^\d{4}-\d{2}-\d{2}$/.test(form.birthDate) || year < 1900 || form.birthDate > today) {
        nextErrors.birthDate = 'Escolha uma data de nascimento válida.';
      }
    }
    if (form.weeklyRateKg.trim()) {
      const rate = parseOptional(form.weeklyRateKg);
      if (!blankOrPositive(form.weeklyRateKg) || rate === null || rate < 0.1 || rate > 1) {
        nextErrors.weeklyRateKg = 'Informe um ritmo entre 0,1 e 1 kg por semana, ou deixe em branco.';
      }
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    const goals = Object.fromEntries(goalFields.map((g) => [g.key, parseOptional(form[g.key])])) as UserGoals;
    const profile: UserProfile = {
      displayName: form.displayName.trim(),
      goals,
      cupVolumeMl: parseOptional(form.cupVolumeMl),
      heightCm: parseOptional(form.heightCm),
      targetWeightKg: parseOptional(form.targetWeightKg),
      targetDate: form.targetDate || null,
      sex: (form.sex || null) as Sex | null,
      birthDate: form.birthDate || null,
      activity: (form.activity || null) as Activity | null,
      goalType: (form.goalType || null) as GoalType | null,
      weeklyRateKg: parseOptional(form.weeklyRateKg),
      macroPreset: form.macroPreset as MacroPreset,
    };
    setBusy(true);
    try {
      await saveUserProfile(user.id, profile);
      await reload();
      setFeedback({ kind: 'success', message: 'Perfil e metas salvos na sua conta.' });
    } catch (e) {
      setFeedback({ kind: 'error', message: readError(e, 'Não foi possível salvar os dados.') });
    } finally {
      setBusy(false);
    }
  }

  function exportData() {
    const payload = createDataExport(data);
    const file = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = `meu-progresso-total-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    setFeedback({ kind: 'success', message: 'Arquivo JSON exportado.' });
  }

  async function deleteData() {
    const confirmed = window.confirm(
      'Apagar todos os dados do SISTCS Leve salvos na sua conta? Esta ação não pode ser desfeita.',
    );
    if (!confirmed) return;
    setBusy(true);
    try {
      await clearAllUserData(user.id);
      await reload();
      setForm(emptyForm);
      setFeedback({ kind: 'success', message: 'Os dados da sua conta neste app foram apagados.' });
    } catch (e) {
      setFeedback({ kind: 'error', message: readError(e, 'Não foi possível apagar os dados.') });
    } finally {
      setBusy(false);
    }
  }

  async function deleteAccount() {
    const typed = window.prompt(
      'Isto exclui DEFINITIVAMENTE sua conta, seus registros e suas fotos. Para confirmar, digite EXCLUIR.',
    );
    if (typed?.trim().toUpperCase() !== 'EXCLUIR') return;
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke('delete-account', { method: 'POST' });
      if (error || !data?.ok) throw new Error('delete-account');
      await supabase.auth.signOut();
    } catch (e) {
      setFeedback({ kind: 'error', message: readError(e, 'Não foi possível excluir a conta. Tente de novo ou escreva para privacidade@sistcs.com.') });
      setBusy(false);
    }
  }

  async function importLegacy() {
    if (!legacy) return;
    setBusy(true);
    try {
      await importLegacyData(user.id, legacy);
      await reload();
      setFeedback({ kind: 'success', message: 'Dados do navegador importados para a sua conta.' });
      setLegacy(null);
    } catch (e) {
      setFeedback({ kind: 'error', message: readError(e, 'Não foi possível importar os dados.') });
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <div className="page page-enter page-profile">
      <section className="page-heading profile-page-heading">
        <div className="heading-copy">
          <p className="eyebrow"><span className="eyebrow-dot" />SEU ESPAÇO</p>
          <h1 className="serif-display">Perfil</h1>
          <p className="page-intro">Defina apenas as informações e metas que você escolher acompanhar.</p>
        </div>
      </section>

      {loadError && <div className="profile-state-message profile-state-error" role="alert">{loadError}</div>}


      <form className="profile-form" onSubmit={onSubmit} noValidate>
        <section className="profile-card" aria-labelledby="profile-details-title">
          <div className="profile-card-heading">
            <span className="profile-card-icon"><ShieldCheck size={20} aria-hidden="true" /></span>
            <div>
              <h2 id="profile-details-title">Suas preferências</h2>
              <p>Todos os campos de metas são opcionais e começam em branco.</p>
            </div>
          </div>

          <InstallCard />

          <div className="progressive-tabs" role="tablist" aria-label="Seções do perfil">
            <button type="button" role="tab" aria-selected={activeProfileTab === 'dados'} className={`progressive-tab ${activeProfileTab === 'dados' ? 'is-active' : ''}`} onClick={() => setActiveProfileTab('dados')}>
              Dados pessoais
            </button>
            <button type="button" role="tab" aria-selected={activeProfileTab === 'metas'} className={`progressive-tab ${activeProfileTab === 'metas' ? 'is-active' : ''}`} onClick={() => setActiveProfileTab('metas')}>
              Metas e preferências
            </button>
          </div>

          {activeProfileTab === 'dados' && (
            <>
          <div className="avatar-edit">
            <Avatar path={avatarPath} name={form.displayName} size={88} />
            <div>
              <strong>Foto de perfil</strong>
              <p className="field-hint">JPG, PNG ou WebP. Ela é recortada em quadrado e fica privada na sua conta.</p>
              <div className="avatar-actions">
                <input ref={avatarInput} id="avatar-file" className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={onAvatarChosen} disabled={busy} />
                <label htmlFor="avatar-file" className={`btn btn-outline btn-sm ${busy ? 'is-disabled' : ''}`}><Camera aria-hidden="true" /> {avatarPath ? 'Trocar foto' : 'Escolher foto'}</label>
                {avatarPath && <Button variant="ghost" size="sm" onClick={onAvatarRemove} disabled={busy}><Trash2 aria-hidden="true" /> Remover</Button>}
              </div>
            </div>
          </div>

          <Field id="profile-name" label="Nome de exibição" optional className="profile-field profile-name-field" error={errors.displayName}>
            <input id="profile-name" className="input" type="text" autoComplete="nickname" maxLength={60} value={form.displayName} onChange={set('displayName')} />
          </Field>

          <div className="profile-subsection">
            <div className="profile-subsection-heading">
              <h3>Sobre você</h3>
              <p>Opcional. Estes dados alimentam a estimativa de metas logo abaixo e ficam só na sua conta.</p>
            </div>
            <div className="profile-field-grid">
              <Field id="sex" label="Sexo (para o cálculo)" className="profile-field">
                <select id="sex" className="input" value={form.sex} onChange={set('sex')}>
                  <option value="">Prefiro não informar</option>
                  <option value="female">Feminino</option>
                  <option value="male">Masculino</option>
                </select>
              </Field>
              <Field id="birth-date" label="Data de nascimento" className="profile-field" error={errors.birthDate}>
                <input id="birth-date" className="input" type="date" value={form.birthDate} onChange={set('birthDate')} />
              </Field>
              <Field id="activity" label="Nível de atividade" className="profile-field"
                hint={form.activity ? ACTIVITY[form.activity as Activity].hint : undefined}>
                <select id="activity" className="input" value={form.activity} onChange={set('activity')}>
                  <option value="">Escolha um nível</option>
                  {(Object.keys(ACTIVITY) as Activity[]).map((k) => (
                    <option key={k} value={k}>{ACTIVITY[k].label}</option>
                  ))}
                </select>
              </Field>
              <Field id="goal-type" label="Seu objetivo" className="profile-field">
                <select id="goal-type" className="input" value={form.goalType} onChange={set('goalType')}>
                  <option value="">Escolha um objetivo</option>
                  {(Object.keys(GOAL_LABEL) as GoalType[]).map((k) => (
                    <option key={k} value={k}>{GOAL_LABEL[k]}</option>
                  ))}
                </select>
              </Field>
              {(form.goalType === 'lose' || form.goalType === 'gain') && (
                <Field id="weekly-rate" label="Ritmo desejado" optional className="profile-field" error={errors.weeklyRateKg}
                  hint="Entre 0,1 e 1 kg por semana. Ritmos mais suaves são mais fáceis de manter.">
                  <div className="profile-control">
                    <input id="weekly-rate" className="input" type="text" inputMode="decimal" autoComplete="off" maxLength={5}
                      placeholder={form.goalType === 'gain' ? '0,25' : '0,5'} value={form.weeklyRateKg} onChange={set('weeklyRateKg')} />
                    <span className="profile-unit" aria-hidden="true">kg/sem</span>
                  </div>
                </Field>
              )}
              <Field id="macro-preset" label="Distribuição dos nutrientes" className="profile-field" hint={PRESETS[form.macroPreset as MacroPreset].hint}>
                <select id="macro-preset" className="input" value={form.macroPreset} onChange={set('macroPreset')}>
                  {(Object.keys(PRESETS) as MacroPreset[]).map((k) => (
                    <option key={k} value={k}>{PRESETS[k].label}</option>
                  ))}
                </select>
              </Field>
            </div>
          </div>

          <div className="profile-subsection calc-box" aria-live="polite">
            <div className="profile-subsection-heading">
              <h3><Calculator size={16} aria-hidden="true" /> Estimativa de metas diárias</h3>
              <p>
                Calculada com a equação de Mifflin-St Jeor, usando seus dados, sua altura e seu peso atual
                {latestWeight ? <> ({decimalText(latestWeight.weightKg)} kg)</> : null}. É uma estimativa geral,
                não substitui a orientação de um profissional de saúde.
              </p>
            </div>
            {!latestWeight && (
              <p className="calc-note">Falta o peso atual. <Link href="/registros">Registre seu peso em Registros</Link> para calcular.</p>
            )}
            {estimateResult.ok ? (
              <>
                <div className="calc-grid">
                  <div><span>Gasto basal</span><strong>{decimalText(estimateResult.bmr)} <small>kcal</small></strong></div>
                  <div><span>Gasto diário estimado</span><strong>{decimalText(estimateResult.tdee)} <small>kcal</small></strong></div>
                  <div className="calc-main">
                    <span>Meta de calorias sugerida</span>
                    <strong>{decimalText(estimateResult.kcal)} <small>kcal</small></strong>
                    <em>{estimateResult.delta === 0 ? 'igual ao gasto estimado' : `${estimateResult.delta > 0 ? '+' : '−'}${decimalText(Math.abs(estimateResult.delta))} kcal em relação ao gasto`}</em>
                  </div>
                  <div><span>Proteínas</span><strong>{estimateResult.protein} <small>g</small></strong></div>
                  <div><span>Carboidratos</span><strong>{estimateResult.carbs} <small>g</small></strong></div>
                  <div><span>Gorduras</span><strong>{estimateResult.fats} <small>g</small></strong></div>
                  <div><span>Fibras</span><strong>{estimateResult.fiber} <small>g</small></strong></div>
                  <div><span>Água</span><strong>{decimalText(estimateResult.waterMl)} <small>ml</small></strong></div>
                </div>
                {estimateResult.floorApplied && form.sex && (
                  <p className="calc-note">
                    Para o ritmo escolhido, a conta ficaria abaixo de {decimalText(MIN_KCAL[form.sex as Sex])} kcal por dia. Usamos esse piso por
                    segurança. Um ritmo mais lento ou o acompanhamento de um profissional pode ser melhor.
                  </p>
                )}
                <div className="profile-form-actions">
                  <Button type="button" variant="outline" onClick={applyEstimate}>
                    <Calculator aria-hidden="true" />
                    Usar como minhas metas
                  </Button>
                  <span className="profile-save-hint">Você pode ajustar qualquer valor depois, nas metas abaixo.</span>
                </div>
              </>
            ) : (
              latestWeight && <p className="calc-note">{estimateResult.reason}</p>
            )}
          </div>

          </>
          )}

          {activeProfileTab === 'metas' && (
            <>
          <div className="profile-subsection">
            <div className="profile-subsection-heading">
              <h3>Metas pessoais</h3>
              <p>Os valores abaixo são os que o app usa para mostrar quanto falta no dia. Você manda neles.</p>
            </div>
            <div className="profile-field-grid">
              {goalFields.map(({ key, label, unit }) => (
                <Field key={key} id={`goal-${key}`} label={label} className="profile-field" error={errors[key]}>
                  <div className="profile-control">
                    <input id={`goal-${key}`} className="input" type="text" inputMode="decimal" autoComplete="off" maxLength={24} value={form[key]} onChange={set(key)} />
                    <span className="profile-unit" aria-hidden="true">{unit}</span>
                  </div>
                </Field>
              ))}
            </div>
            <p className="profile-help">
              Você escolhe os valores. Deixe qualquer meta em branco enquanto não quiser configurá-la.
            </p>
          </div>

          <div className="profile-subsection">
            <div className="profile-subsection-heading">
              <h3>Seu corpo e seu objetivo</h3>
              <p>Opcional. A altura entra na estimativa de metas. O peso desejado aparece nos Registros e nos Relatórios. O peso do dia a dia você registra em Registros.</p>
            </div>
            <div className="profile-field-grid">
              <Field id="height-cm" label="Altura" className="profile-field" error={errors.heightCm}>
                <div className="profile-control">
                  <input id="height-cm" className="input" type="text" inputMode="decimal" autoComplete="off" maxLength={6} value={form.heightCm} onChange={set('heightCm')} />
                  <span className="profile-unit" aria-hidden="true">cm</span>
                </div>
              </Field>
              <Field id="target-weight" label="Peso desejado" className="profile-field" error={errors.targetWeightKg}>
                <div className="profile-control">
                  <input id="target-weight" className="input" type="text" inputMode="decimal" autoComplete="off" maxLength={6} value={form.targetWeightKg} onChange={set('targetWeightKg')} />
                  <span className="profile-unit" aria-hidden="true">kg</span>
                </div>
              </Field>
              <Field id="target-date" label="Data para alcançar" optional className="profile-field" error={errors.targetDate}>
                <input id="target-date" className="input" type="date" value={form.targetDate} onChange={set('targetDate')} />
              </Field>
            </div>
          </div>

          <div className="profile-subsection profile-cup-section">
            <div className="profile-subsection-heading">
              <h3>Volume de um copo</h3>
              <p>Preferência opcional, informada por você.</p>
            </div>
            <Field id="cup-volume" label="Volume" optional className="profile-field profile-cup-field" error={errors.cupVolumeMl}>
              <div className="profile-control">
                <input id="cup-volume" className="input" type="text" inputMode="decimal" autoComplete="off" maxLength={24} value={form.cupVolumeMl} onChange={set('cupVolumeMl')} />
                <span className="profile-unit" aria-hidden="true">ml</span>
              </div>
            </Field>
          </div>
            </>
          )}

          <div className="profile-form-actions">
            <Button type="submit" disabled={busy || loading}>
              <Save aria-hidden="true" />
              Salvar perfil
            </Button>
            <span className="profile-save-hint">Conectado como {user.email}.</span>
          </div>

          {feedback && (
            <p className={`profile-feedback profile-feedback-${feedback.kind}`} role={feedback.kind === 'error' ? 'alert' : 'status'} aria-live="polite">
              {feedback.message}
            </p>
          )}
        </section>
      </form>

      {legacy && (
        <section className="profile-privacy-card" aria-labelledby="legacy-title">
          <div className="profile-privacy-heading">
            <span className="profile-card-icon"><CloudUpload size={20} aria-hidden="true" /></span>
            <div>
              <h2 id="legacy-title">Dados antigos neste navegador</h2>
              <p>
                Encontramos registros da versão anterior, que guardava tudo só neste navegador. Você pode enviá-los para a sua
                conta. Nada é importado sem a sua escolha.
              </p>
            </div>
          </div>
          <div className="profile-data-actions">
            <Button type="button" variant="outline" onClick={importLegacy} disabled={busy}>
              <CloudUpload aria-hidden="true" />
              Importar para a minha conta
            </Button>
          </div>
        </section>
      )}

      <section className="profile-privacy-card" aria-labelledby="profile-privacy-title">
        <div className="profile-privacy-heading">
          <span className="profile-card-icon"><ShieldCheck size={20} aria-hidden="true" /></span>
          <div>
            <h2 id="profile-privacy-title">Privacidade e seus dados</h2>
            <p>
              Seus dados ficam salvos na sua conta, na nuvem, e só você consegue acessá-los. Eles podem ser abertos em outros
              dispositivos, entrando com o mesmo e-mail e senha.
            </p>
          </div>
        </div>
        <div className="profile-data-actions">
          <Button type="button" variant="outline" onClick={exportData}>
            <ArrowDownToLine aria-hidden="true" />
            Exportar dados como JSON
          </Button>
          <Button type="button" variant="outline" onClick={signOut}>
            <LogOut aria-hidden="true" />
            Sair da conta
          </Button>
          <Button type="button" variant="destructive" onClick={deleteData} disabled={busy}>
            <Trash2 aria-hidden="true" />
            Apagar todos os meus dados
          </Button>
          <Button type="button" variant="destructive" onClick={deleteAccount} disabled={busy}>
            <Trash2 aria-hidden="true" />
            Excluir minha conta
          </Button>
        </div>
        <p className="profile-data-scope"><a href="#/privacidade" className="link-button">Ler a Política de Privacidade</a></p>
        <p className="profile-data-scope">
          A exclusão remove os dados deste app da sua conta e pede confirmação antes de apagar. Sua conta de acesso continua existindo.
        </p>
      </section>
    </div>
  );
}
