import { useState } from 'react';
import { Heart, History, Pencil, Plus, Save, Trash2, UtensilsCrossed, X } from 'lucide-react';
import {
  calculateFoodEntryNutrient,
  createFoodEntry,
  createSavedMeal,
  deleteSavedMeal,
  updateSavedMeal,
  type AppData,
  type FavoriteFood,
  type FoodEntry,
  type MealType,
  type SavedMeal,
  type SavedMealItem,
} from '../data';
import {
  SAVED_MEAL_ITEMS_MAX,
  SAVED_MEAL_NAME_MAX,
  savedItemFromEntry,
  savedItemFromFavorite,
  savedMealCalories,
  savedMealFromEntries,
  savedMealToInputs,
  validateSavedMeal,
} from '../food-actions';
import { Button, decimalIsValid, decimalText, parseDecimal } from '../ui';

type Tab = 'recent' | 'favorites' | 'meals';
type Feedback = { kind: 'success' | 'error'; message: string };

interface Editor {
  id: string | null;
  name: string;
  items: Array<{ item: SavedMealItem; quantityText: string }>;
  error?: string;
}

interface Props {
  data: AppData;
  recent: Array<{ entry: FoodEntry; uses: number }>;
  busy: boolean;
  selectedDate: string;
  /** Refeição de destino (aba aberta ou horário atual) e seu nome. */
  targetMeal: MealType;
  targetLabel: string;
  /** Lançamentos que "Salvar como refeição" vai copiar, e como chamá-los. */
  sourceEntries: FoodEntry[];
  sourceLabel: string;
  run: (action: () => Promise<void>, onError: (message: string) => void, fallback: string) => Promise<void>;
  setFeedback: (feedback: Feedback) => void;
  onRegisterRecent: (entry: FoodEntry) => void;
  onEditRecent: (entry: FoodEntry) => void;
  onUseFavorite: (favorite: FavoriteFood) => void;
  onRemoveFavorite: (favorite: FavoriteFood) => void;
}

const RECENT_VISIBLE = 5;

const toEditorItems = (items: SavedMealItem[]) => items.map((item) => ({ item, quantityText: decimalText(item.quantity) }));

export function FoodSaved(props: Props) {
  const { data, recent, busy, selectedDate, targetMeal, targetLabel, sourceEntries, sourceLabel, run, setFeedback } = props;
  const [tab, setTab] = useState<Tab>('recent');
  const [editor, setEditor] = useState<Editor | null>(null);
  const [pickerKey, setPickerKey] = useState('');
  const [showAllRecent, setShowAllRecent] = useState(false);

  const onError = (message: string) => setFeedback({ kind: 'error', message });

  const pickable: Array<{ key: string; label: string; item: SavedMealItem }> = [
    ...data.favoriteFoods.map((f) => ({ key: `f-${f.id}`, label: `${f.name} (${f.portion})`, item: savedItemFromFavorite(f) })),
    ...recent.map(({ entry }) => ({ key: `r-${entry.id}`, label: `${entry.name} (${entry.portion})`, item: { ...savedItemFromEntry(entry) } })),
  ].filter((option, index, all) => all.findIndex((other) => other.label === option.label) === index);

  async function registerMeal(meal: SavedMeal) {
    await run(
      async () => {
        for (const input of savedMealToInputs(meal, selectedDate, targetMeal)) await createFoodEntry(input);
        setFeedback({ kind: 'success', message: `“${meal.name}” registrada em ${targetLabel} (${meal.items.length} ${meal.items.length === 1 ? 'alimento' : 'alimentos'}).` });
      },
      onError,
      'Não foi possível registrar a refeição.',
    );
  }

  async function removeMeal(meal: SavedMeal) {
    if (!window.confirm(`Excluir a refeição “${meal.name}”? Os lançamentos já registrados não mudam.`)) return;
    await run(
      async () => {
        await deleteSavedMeal(meal.id);
        setFeedback({ kind: 'success', message: 'Refeição excluída.' });
      },
      onError,
      'Não foi possível excluir a refeição.',
    );
  }

  function newFromDay() {
    const draft = savedMealFromEntries(sourceLabel, sourceEntries);
    setEditor({ id: null, name: draft?.name ?? '', items: toEditorItems(draft?.items ?? []) });
  }

  async function saveEditor() {
    if (!editor) return;
    const items: SavedMealItem[] = [];
    for (const row of editor.items) {
      const quantity = decimalIsValid(row.quantityText, false) ? parseDecimal(row.quantityText) : Number.NaN;
      items.push({ ...row.item, quantity });
    }
    const name = editor.name.trim().replace(/\s+/g, ' ');
    const problem = validateSavedMeal(name, items);
    if (problem) return setEditor({ ...editor, error: problem });
    await run(
      async () => {
        if (editor.id) await updateSavedMeal(editor.id, { name, items });
        else await createSavedMeal({ name, items });
        setEditor(null);
        setFeedback({ kind: 'success', message: editor.id ? 'Refeição atualizada.' : 'Refeição salva. Agora é só registrar com um toque.' });
      },
      (message) => setEditor((current) => (current ? { ...current, error: message } : current)),
      'Não foi possível salvar a refeição.',
    );
  }

  function addPicked() {
    const option = pickable.find((o) => o.key === pickerKey);
    if (!option || !editor) return;
    if (editor.items.length >= SAVED_MEAL_ITEMS_MAX) return setEditor({ ...editor, error: `Uma refeição pode ter até ${SAVED_MEAL_ITEMS_MAX} alimentos.` });
    setEditor({ ...editor, error: undefined, items: [...editor.items, ...toEditorItems([option.item])] });
    setPickerKey('');
  }

  const tabs: Array<{ id: Tab; label: string; count: number }> = [
    { id: 'recent', label: 'Recentes', count: recent.length },
    { id: 'favorites', label: 'Favoritos', count: data.favoriteFoods.length },
    { id: 'meals', label: 'Refeições', count: data.savedMeals.length },
  ];

  return (
    <section className="ft-favorites ft-saved" aria-labelledby="saved-title">
      <div className="ft-favorites-heading">
        <div><p className="ft-kicker">REPITA COM UM TOQUE</p><h3 id="saved-title">Seus salvos</h3></div>
        <History size={18} aria-hidden="true" />
      </div>
      <nav className="progressive-tabs" role="tablist" aria-label="Alimentos e refeições salvos">
        {tabs.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} className={tab === t.id ? 'progressive-tab is-active' : 'progressive-tab'} onClick={() => setTab(t.id)}>
            {t.label} <span className="progressive-tab-count">{t.count}</span>
          </button>
        ))}
      </nav>

      {tab === 'recent' && (
        recent.length ? (
          <div className="ft-favorite-list">
            {(showAllRecent ? recent : recent.slice(0, RECENT_VISIBLE)).map(({ entry, uses }) => (
              <div className="ft-favorite-row" key={entry.id}>
                <div>
                  <strong>{entry.name}</strong>
                  <span>{decimalText(entry.quantity)} × {entry.portion} · {decimalText(calculateFoodEntryNutrient(entry, 'calories'))} kcal{uses > 1 ? ` · ${uses} vezes` : ''}</span>
                </div>
                <Button variant="outline" size="sm" onClick={() => props.onRegisterRecent(entry)} disabled={busy} aria-label={`Registrar ${entry.name} em ${targetLabel}`}><Plus aria-hidden="true" /> <span className="ft-btn-label">Registrar</span></Button>
                <Button variant="ghost" size="sm" onClick={() => props.onEditRecent(entry)} disabled={busy} aria-label={`Ajustar ${entry.name} antes de registrar`}><Pencil aria-hidden="true" /> <span className="ft-btn-label">Ajustar</span></Button>
              </div>
            ))}
            {recent.length > RECENT_VISIBLE && (
              <Button variant="ghost" size="sm" block onClick={() => setShowAllRecent((v) => !v)}>{showAllRecent ? 'Mostrar menos' : `Ver todos (${recent.length})`}</Button>
            )}
          </div>
        ) : <p className="ft-favorites-empty">Os alimentos que você registra aparecem aqui para repetir com um toque.</p>
      )}

      {tab === 'favorites' && (
        data.favoriteFoods.length ? (
          <div className="ft-favorite-list">
            {data.favoriteFoods.map((favorite) => (
              <div className="ft-favorite-row" key={favorite.id}>
                <div>
                  <strong>{favorite.name}</strong>
                  <span>{favorite.portion} · {decimalText(favorite.nutrientsPerPortion.calories)} kcal · {favorite.nutritionSource === 'user-estimated' ? 'estimado por você' : 'informado por você'}</span>
                </div>
                <Button variant="outline" size="sm" onClick={() => props.onUseFavorite(favorite)}><Plus aria-hidden="true" /> <span className="ft-btn-label">Usar</span></Button>
                <Button variant="ghost" size="sm" onClick={() => props.onRemoveFavorite(favorite)} disabled={busy} aria-label={`Remover ${favorite.name} dos favoritos`}><Trash2 aria-hidden="true" /></Button>
              </div>
            ))}
          </div>
        ) : <p className="ft-favorites-empty"><Heart size={14} aria-hidden="true" /> Toque em “Favoritar” em qualquer alimento registrado para guardá-lo aqui.</p>
      )}

      {tab === 'meals' && (
        <>
          {!data.savedMealsAvailable && (
            <p className="ft-feedback ft-feedback-error" role="status">As refeições salvas ainda não estão ativadas neste banco de dados. Aplique a migração <code>20261020120000_saved_meals.sql</code> para habilitar.</p>
          )}
          {!editor && (
            <div className="ft-quick-actions">
              <Button variant="outline" size="sm" onClick={() => setEditor({ id: null, name: '', items: [] })} disabled={busy || !data.savedMealsAvailable}><Plus aria-hidden="true" /> Nova refeição</Button>
              {sourceEntries.length > 0 && (
                <Button variant="ghost" size="sm" onClick={newFromDay} disabled={busy || !data.savedMealsAvailable}><Save aria-hidden="true" /> Salvar {sourceLabel.toLocaleLowerCase('pt-BR')} como refeição</Button>
              )}
            </div>
          )}

          {editor && (
            <form className="ft-saved-editor" onSubmit={(e) => { e.preventDefault(); void saveEditor(); }} noValidate>
              <label className="ft-field">
                <span>Nome da refeição</span>
                <input className="input" type="text" maxLength={SAVED_MEAL_NAME_MAX} value={editor.name} placeholder="Ex.: Café da manhã fit" onChange={(e) => setEditor({ ...editor, name: e.target.value, error: undefined })} autoFocus />
              </label>
              {editor.items.map((row, index) => (
                <div className="ft-saved-item" key={`${row.item.name}-${index}`}>
                  <div>
                    <strong>{row.item.name}</strong>
                    <span>{row.item.portion} · {decimalText(row.item.nutrientsPerPortion.calories)} kcal cada</span>
                  </div>
                  <label className="ft-saved-qty">
                    <span className="sr-only">Quantidade de {row.item.name}</span>
                    <input className="input" type="text" inputMode="decimal" maxLength={8} value={row.quantityText} onChange={(e) => setEditor({ ...editor, error: undefined, items: editor.items.map((r, i) => (i === index ? { ...r, quantityText: e.target.value } : r)) })} />
                    <span aria-hidden="true">×</span>
                  </label>
                  <Button variant="ghost" size="sm" onClick={() => setEditor({ ...editor, items: editor.items.filter((_, i) => i !== index) })} aria-label={`Tirar ${row.item.name} da refeição`}><Trash2 aria-hidden="true" /></Button>
                </div>
              ))}
              {pickable.length > 0 && (
                <div className="ft-saved-add">
                  <label className="sr-only" htmlFor="saved-meal-picker">Adicionar alimento salvo</label>
                  <select id="saved-meal-picker" className="input ft-select" value={pickerKey} onChange={(e) => setPickerKey(e.target.value)}>
                    <option value="">Adicionar de favoritos e recentes…</option>
                    {pickable.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
                  </select>
                  <Button variant="outline" size="sm" onClick={addPicked} disabled={!pickerKey}><Plus aria-hidden="true" /> Adicionar</Button>
                </div>
              )}
              <p className="ft-preview" aria-live="polite"><strong>Total: {decimalText(savedMealCalories(editor.items.map((r) => ({ ...r.item, quantity: decimalIsValid(r.quantityText, false) ? parseDecimal(r.quantityText) : 0 }))))} kcal</strong></p>
              {editor.error && <p className="field-error" role="alert">{editor.error}</p>}
              <div className="ft-quick-form-actions">
                <Button type="submit" size="sm" disabled={busy}><Save aria-hidden="true" /> Salvar refeição</Button>
                <Button variant="ghost" size="sm" onClick={() => setEditor(null)}><X aria-hidden="true" /> Cancelar</Button>
              </div>
            </form>
          )}

          {data.savedMeals.length ? (
            <div className="ft-favorite-list">
              {data.savedMeals.map((meal) => (
                <div className="ft-favorite-row" key={meal.id}>
                  <div>
                    <strong><UtensilsCrossed size={14} aria-hidden="true" /> {meal.name}</strong>
                    <span>{meal.items.length} {meal.items.length === 1 ? 'alimento' : 'alimentos'} · {decimalText(savedMealCalories(meal.items))} kcal</span>
                    <small>{meal.items.map((i) => i.name).join(', ')}</small>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => void registerMeal(meal)} disabled={busy} aria-label={`Registrar ${meal.name} em ${targetLabel}`}><Plus aria-hidden="true" /> <span className="ft-btn-label">Registrar</span></Button>
                  <Button variant="ghost" size="sm" onClick={() => setEditor({ id: meal.id, name: meal.name, items: toEditorItems(meal.items) })} disabled={busy} aria-label={`Editar ${meal.name}`}><Pencil aria-hidden="true" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => void removeMeal(meal)} disabled={busy} aria-label={`Excluir ${meal.name}`}><Trash2 aria-hidden="true" /></Button>
                </div>
              ))}
            </div>
          ) : !editor && data.savedMealsAvailable ? (
            <p className="ft-favorites-empty">Monte uma refeição que você repete (ex.: café da manhã) e registre tudo com um toque.</p>
          ) : null}
        </>
      )}
    </section>
  );
}
