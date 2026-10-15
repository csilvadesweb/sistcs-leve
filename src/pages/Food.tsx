import { useMemo, useState, type FormEvent } from 'react';
import { FoodSearch, type PickedFood } from '../foodsearch';
import { NutritionLabelScanner } from '../label-scanner';
import { MealPhotoScanner } from '../meal-photo';
import { Link } from 'wouter';
import { Apple, Check, Copy, Droplets, Heart, Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import { useAppData } from '../session';
import { foodEntryToInput } from '../food-actions';
import {
  calculateFoodEntryNutrient,
  calculateFoodNutrientTotals,
  createFoodEntry,
  createWaterEntry,
  deleteFoodEntry,
  deleteFoodFavorite,
  deleteWaterEntry,
  saveFoodFavoriteFromEntry,
  updateFoodEntry,
  updateWaterEntry,
  type FavoriteFood,
  type FoodEntry,
  type FoodEntryInput,
  type FoodNutrientKey,
  type MealType,
  type NutritionSource,
  type UserGoals,
  type WaterEntry,
} from '../data';
import {
  Button,
  Field,
  decimalInputText,
  decimalIsValid,
  decimalText,
  formatDate,
  parseDecimal,
  readError,
  todayInSaoPaulo,
} from '../ui';

type Feedback = { kind: 'success' | 'error'; message: string } | null;

interface FoodForm {
  date: string;
  meal: string;
  name: string;
  portion: string;
  quantity: string;
  calories: string;
  proteins: string;
  carbohydrates: string;
  fats: string;
  fiber: string;
  nutritionSource: string;
}
type FoodErrors = Partial<Record<keyof FoodForm, string>>;
interface WaterForm {
  date: string;
  volumeMl: string;
}

const nutrientFields: Array<{ key: FoodNutrientKey; label: string; unit: string }> = [
  { key: 'calories', label: 'Calorias', unit: 'kcal' },
  { key: 'proteins', label: 'Proteínas', unit: 'g' },
  { key: 'carbohydrates', label: 'Carboidratos', unit: 'g' },
  { key: 'fats', label: 'Gorduras', unit: 'g' },
  { key: 'fiber', label: 'Fibras', unit: 'g' },
];

const mealLabels: Record<MealType, string> = {
  breakfast: 'Café da manhã',
  lunch: 'Almoço',
  snack: 'Lanche',
  dinner: 'Jantar',
  other: 'Outros',
};
const mealKeys = Object.keys(mealLabels) as MealType[];
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

function mealByClock(): MealType {
  const h = Number(new Intl.DateTimeFormat('en-GB', { hour: '2-digit', hour12: false, timeZone: 'America/Sao_Paulo' }).format(new Date())) % 24;
  if (h >= 5 && h < 10) return 'breakfast';
  if (h >= 10 && h < 15) return 'lunch';
  if (h >= 15 && h < 18) return 'snack';
  if (h >= 18 && h < 23) return 'dinner';
  return 'other';
}

const blankFood = (date: string): FoodForm => ({
  date,
  meal: mealByClock(),
  name: '',
  portion: '',
  quantity: '1',
  calories: '',
  proteins: '',
  carbohydrates: '',
  fats: '',
  fiber: '',
  nutritionSource: 'user-estimated',
});

function foodToForm(entry: FoodEntry): FoodForm {
  // Older or partially populated records must remain editable instead of
  // throwing before the editor's open state can render.
  const n = entry.nutrientsPerPortion ?? {};
  const safeNumber = (value: unknown, fallback: number) =>
    typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  const validMeals: MealType[] = ['breakfast', 'lunch', 'snack', 'dinner', 'other'];
  const source: NutritionSource =
    entry.nutritionSource === 'user-reported' ? 'user-reported' : 'user-estimated';
  return {
    date: typeof entry.date === 'string' && dateRegex.test(entry.date) ? entry.date : todayInSaoPaulo(),
    meal: validMeals.includes(entry.meal) ? entry.meal : 'other',
    name: typeof entry.name === 'string' ? entry.name : '',
    portion: typeof entry.portion === 'string' ? entry.portion : '',
    quantity: decimalInputText(safeNumber(entry.quantity, 1)),
    calories: decimalInputText(safeNumber(n.calories, 0)),
    proteins: decimalInputText(safeNumber(n.proteins, 0)),
    carbohydrates: decimalInputText(safeNumber(n.carbohydrates, 0)),
    fats: decimalInputText(safeNumber(n.fats, 0)),
    fiber: decimalInputText(safeNumber(n.fiber, 0)),
    nutritionSource: source,
  };
}

function favoriteToForm(f: FavoriteFood): FoodForm {
  const n = f.nutrientsPerPortion;
  return {
    ...blankFood(''),
    name: f.name,
    portion: f.portion,
    calories: decimalInputText(n.calories),
    proteins: decimalInputText(n.proteins),
    carbohydrates: decimalInputText(n.carbohydrates),
    fats: decimalInputText(n.fats),
    fiber: decimalInputText(n.fiber),
    nutritionSource: f.nutritionSource,
  };
}

function validateFood(v: FoodForm): FoodErrors {
  const e: FoodErrors = {};
  if (!dateRegex.test(v.date)) e.date = 'Escolha uma data válida.';
  if (!mealKeys.includes(v.meal as MealType)) e.meal = 'Escolha um momento da refeição.';
  if (!v.name.trim()) e.name = 'Informe o nome do alimento.';
  else if (v.name.length > 120) e.name = 'Use até 120 caracteres.';
  if (!v.portion.trim()) e.portion = 'Descreva a porção.';
  else if (v.portion.length > 120) e.portion = 'Use até 120 caracteres.';
  if (!decimalIsValid(v.quantity, false)) e.quantity = 'Informe uma quantidade maior que zero.';
  for (const { key } of nutrientFields) {
    if (!decimalIsValid(v[key])) e[key] = 'Informe zero ou um número válido.';
  }
  if (v.nutritionSource !== 'user-reported' && v.nutritionSource !== 'user-estimated') {
    e.nutritionSource = 'Escolha como informou os valores.';
  }
  return e;
}

function foodInput(v: FoodForm): FoodEntryInput {
  return {
    date: v.date,
    meal: v.meal as MealType,
    name: v.name.trim(),
    portion: v.portion.trim(),
    quantity: parseDecimal(v.quantity),
    nutrientsPerPortion: {
      calories: parseDecimal(v.calories),
      proteins: parseDecimal(v.proteins),
      carbohydrates: parseDecimal(v.carbohydrates),
      fats: parseDecimal(v.fats),
      fiber: parseDecimal(v.fiber),
    },
    nutritionSource: v.nutritionSource as NutritionSource,
  };
}

function NutrientTotals({ entries, goals }: { entries: FoodEntry[]; goals: UserGoals | null }) {
  const totals = calculateFoodNutrientTotals(entries);
  return (
    <div className="ft-total-grid">
      {nutrientFields.map(({ key, label, unit }) => {
        const goal = goals?.[key] ?? null;
        const diff = goal === null ? 0 : goal - totals[key];
        return (
          <div className="ft-total" key={key}>
            <span>{label}</span>
            <strong>{decimalText(totals[key])} <small>{unit}</small></strong>
            {goal !== null ? (
              <>
                <div
                  className="goal-bar"
                  role="img"
                  aria-label={`${decimalText((totals[key] / goal) * 100)}% da meta de ${label.toLowerCase()}`}
                >
                  <i className={totals[key] > goal ? 'over' : ''} style={{ width: `${Math.min(100, (totals[key] / goal) * 100)}%` }} />
                </div>
                <em className={`goal-left ${diff < 0 ? 'over' : ''}`}>
                  {diff > 0
                    ? `Faltam ${decimalText(diff)} ${unit}`
                    : diff === 0
                      ? 'Meta atingida'
                      : `${decimalText(-diff)} ${unit} acima`}
                </em>
                <small className="goal-of">meta {decimalText(goal)} {unit}</small>
              </>
            ) : (
              <small className="goal-of">sem meta</small>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function FoodTracking() {
  const { data, error: loadError, loading, reload } = useAppData();
  const [selectedDate, setSelectedDate] = useState(todayInSaoPaulo);
  const weekDays = useMemo(() => {
    const [year, month, day] = selectedDate.split('-').map(Number);
    const monday = new Date(year, month - 1, day, 12);
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
    const labels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
    return labels.map((label, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      return { label, day: date.getDate(), date: dateKey };
    });
  }, [selectedDate]);
  const [foodEditorOpen, setFoodEditorOpen] = useState(false);
  const [selectedMealTab, setSelectedMealTab] = useState<MealType | 'summary'>('summary');
  const [editingFood, setEditingFood] = useState<FoodEntry | null>(null);
  const [waterEditorOpen, setWaterEditorOpen] = useState(false);
  const [selectedWaterTab, setSelectedWaterTab] = useState<'summary' | 'history'>('summary');
  const [editingWater, setEditingWater] = useState<WaterEntry | null>(null);
  const [foodFeedback, setFoodFeedback] = useState<Feedback>(null);
  const [waterFeedback, setWaterFeedback] = useState<Feedback>(null);
  const [foodForm, setFoodForm] = useState<FoodForm>(() => blankFood(todayInSaoPaulo()));
  const [foodErrors, setFoodErrors] = useState<FoodErrors>({});
  const [waterForm, setWaterForm] = useState<WaterForm>({ date: todayInSaoPaulo(), volumeMl: '' });
  const [waterError, setWaterError] = useState<{ date?: string; volumeMl?: string }>({});
  const [busy, setBusy] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);

  const entriesForDate = useMemo(
    () => data.foodEntries.filter((e) => e.date === selectedDate),
    [data.foodEntries, selectedDate],
  );
  const waterForDate = useMemo(
    () => data.waterEntries.filter((e) => e.date === selectedDate),
    [data.waterEntries, selectedDate],
  );
  const waterTotal = waterForDate.reduce((sum, e) => sum + e.volumeMl, 0);
  const waterGoal = data.profile?.goals.waterMl ?? null;
  const cupVolume = data.profile?.cupVolumeMl ?? null;
  const favoriteBySource = new Map(
    data.favoriteFoods.filter((f) => f.sourceEntryId).map((f) => [f.sourceEntryId as string, f]),
  );

  async function run(action: () => Promise<void>, onError: (message: string) => void, fallback: string) {
    setBusy(true);
    try {
      await action();
      await reload();
    } catch (e) {
      onError(readError(e, fallback));
    } finally {
      setBusy(false);
    }
  }

  const setFood = (key: keyof FoodForm) => (e: { target: { value: string } }) => {
    setFoodForm((v) => ({ ...v, [key]: e.target.value }));
    setFoodErrors((errs) => ({ ...errs, [key]: undefined }));
  };

  function applyPicked(food: PickedFood) {
    setFoodForm((v) => ({
      ...v,
      name: food.name.slice(0, 120),
      portion: food.portion,
      quantity: '1',
      calories: decimalInputText(food.nutrients.calories),
      proteins: decimalInputText(food.nutrients.proteins),
      carbohydrates: decimalInputText(food.nutrients.carbohydrates),
      fats: decimalInputText(food.nutrients.fats),
      fiber: decimalInputText(food.nutrients.fiber),
      nutritionSource: food.nutritionSource ?? 'user-estimated',
    }));
    setFoodErrors({});
  }

  function openNewFood(favorite?: FavoriteFood) {
    setEditingFood(null);
    setFoodForm(favorite ? { ...favoriteToForm(favorite), date: selectedDate } : blankFood(selectedDate));
    setFoodErrors({});
    setFoodFeedback(null);
    setFoodEditorOpen(true);
  }

  function openEditFood(entry: FoodEntry) {
    setEditingFood(entry);
    setFoodForm(foodToForm(entry));
    setFoodErrors({});
    setFoodFeedback(null);
    setFoodEditorOpen(true);
  }

  async function onFoodSubmit(event: FormEvent) {
    event.preventDefault();
    const errs = validateFood(foodForm);
    setFoodErrors(errs);
    if (Object.keys(errs).length) {
      if (!editingFood) setFoodFeedback({ kind: 'error', message: 'Digite o que você comeu na busca acima ou preencha os valores à mão.' });
      return;
    }
    const input = foodInput(foodForm);
    await run(
      async () => {
        if (editingFood) await updateFoodEntry(editingFood.id, input);
        else await createFoodEntry(input);
        setSelectedDate(input.date);
        setFoodFeedback({ kind: 'success', message: editingFood ? 'Lançamento atualizado.' : 'Alimento registrado.' });
        setFoodEditorOpen(false);
        setEditingFood(null);
      },
      (message) => setFoodFeedback({ kind: 'error', message }),
      'Não foi possível salvar o alimento.',
    );
  }

  const hiddenErrors = (['name', 'portion', 'quantity', 'calories', 'proteins', 'carbohydrates', 'fats', 'fiber', 'nutritionSource'] as const).some((k) => foodErrors[k]);

  const preview = useMemo(() => {
    const kcalPortion = decimalIsValid(foodForm.calories) ? parseDecimal(foodForm.calories) : 0;
    const qty = decimalIsValid(foodForm.quantity, false) ? parseDecimal(foodForm.quantity) : 0;
    const thisKcal = kcalPortion * qty;
    const others = data.foodEntries
      .filter((e) => e.date === foodForm.date && e.id !== editingFood?.id)
      .reduce((sum, e) => sum + calculateFoodEntryNutrient(e, 'calories'), 0);
    const goal = data.profile?.goals.calories ?? null;
    return { thisKcal, dayTotal: others + thisKcal, goal };
  }, [foodForm.calories, foodForm.quantity, foodForm.date, data.foodEntries, data.profile, editingFood]);

  async function removeFood(entry: FoodEntry) {
    if (!window.confirm(`Excluir o registro de “${entry.name}” desta data?`)) return;
    await run(
      async () => {
        await deleteFoodEntry(entry.id);
        setFoodFeedback({ kind: 'success', message: 'Registro de alimento excluído.' });
      },
      (message) => setFoodFeedback({ kind: 'error', message }),
      'Não foi possível excluir o alimento.',
    );
  }

  async function copyFoodEntry(entry: FoodEntry) {
    if (entry.date === selectedDate && !window.confirm(`Copiar “${entry.name}” novamente para ${formatDate(selectedDate)}?`)) return;
    await run(
      async () => {
        await createFoodEntry(foodEntryToInput(entry, selectedDate));
        setFoodFeedback({ kind: 'success', message: `“${entry.name}” copiado para ${formatDate(selectedDate)}.` });
      },
      (message) => setFoodFeedback({ kind: 'error', message }),
      'Não foi possível copiar o alimento.',
    );
  }

  async function toggleFavorite(entry: FoodEntry) {
    const existing = favoriteBySource.get(entry.id);
    await run(
      async () => {
        if (existing) {
          await deleteFoodFavorite(existing.id);
          setFoodFeedback({ kind: 'success', message: 'Alimento removido dos favoritos.' });
        } else {
          await saveFoodFavoriteFromEntry(entry);
          setFoodFeedback({ kind: 'success', message: 'Alimento salvo nos favoritos.' });
        }
      },
      (message) => setFoodFeedback({ kind: 'error', message }),
      'Não foi possível atualizar os favoritos.',
    );
  }

  async function removeFavorite(favorite: FavoriteFood) {
    if (!window.confirm(`Remover “${favorite.name}” dos alimentos salvos?`)) return;
    await run(
      async () => {
        await deleteFoodFavorite(favorite.id);
        setFoodFeedback({ kind: 'success', message: 'Alimento removido dos favoritos.' });
      },
      (message) => setFoodFeedback({ kind: 'error', message }),
      'Não foi possível remover o favorito.',
    );
  }

  function openNewWater() {
    setEditingWater(null);
    setWaterForm({ date: selectedDate, volumeMl: '' });
    setWaterError({});
    setWaterFeedback(null);
    setWaterEditorOpen(true);
  }

  function openEditWater(entry: WaterEntry) {
    setEditingWater(entry);
    setWaterForm({ date: entry.date, volumeMl: decimalInputText(entry.volumeMl) });
    setWaterError({});
    setWaterFeedback(null);
    setWaterEditorOpen(true);
  }

  async function onWaterSubmit(event: FormEvent) {
    event.preventDefault();
    const errs: { date?: string; volumeMl?: string } = {};
    if (!dateRegex.test(waterForm.date)) errs.date = 'Escolha uma data válida.';
    if (!decimalIsValid(waterForm.volumeMl, false)) errs.volumeMl = 'Informe um volume maior que zero.';
    setWaterError(errs);
    if (Object.keys(errs).length) return;
    const input = { date: waterForm.date, volumeMl: parseDecimal(waterForm.volumeMl) };
    await run(
      async () => {
        if (editingWater) await updateWaterEntry(editingWater.id, input);
        else await createWaterEntry(input);
        setSelectedDate(input.date);
        setWaterFeedback({ kind: 'success', message: editingWater ? 'Registro de água atualizado.' : 'Água registrada.' });
        setWaterEditorOpen(false);
        setEditingWater(null);
      },
      (message) => setWaterFeedback({ kind: 'error', message }),
      'Não foi possível salvar o registro de água.',
    );
  }

  async function removeWater(entry: WaterEntry) {
    if (!window.confirm(`Excluir o registro de ${decimalText(entry.volumeMl)} ml?`)) return;
    await run(
      async () => {
        await deleteWaterEntry(entry.id);
        setWaterFeedback({ kind: 'success', message: 'Registro de água excluído.' });
      },
      (message) => setWaterFeedback({ kind: 'error', message }),
      'Não foi possível excluir o registro de água.',
    );
  }

  async function quickWater(volumeMl: number) {
    await run(
      async () => {
        await createWaterEntry({ date: selectedDate, volumeMl });
        setWaterFeedback({ kind: 'success', message: `${decimalText(volumeMl)} ml registrados.` });
      },
      (message) => setWaterFeedback({ kind: 'error', message }),
      'Não foi possível registrar a água.',
    );
  }

  const mealGroups = mealKeys
    .map((meal) => ({ meal, entries: entriesForDate.filter((e) => e.meal === meal) }));
  const consumedCalories = entriesForDate.reduce((total, entry) => total + calculateFoodEntryNutrient(entry, 'calories'), 0);
  const calorieGoal = data.profile?.goals.calories ?? null;
  const remainingCalories = calorieGoal === null ? null : calorieGoal - consumedCalories;

  function openNewFoodForMeal(meal: MealType) {
    openNewFood();
    setFoodForm((current) => ({ ...current, meal }));
  }

  const sum = (entries: FoodEntry[], key: FoodNutrientKey) =>
    decimalText(entries.reduce((total, e) => total + calculateFoodEntryNutrient(e, key), 0));

  return (
    <div className="ft-page page-enter">
      <header className="ft-heading ft-diary-heading">
        <div>
          <h1>Diário alimentar</h1>
          <p>Acompanhe suas refeições e calorias do dia.</p>
        </div>
      </header>

      <nav className="ft-week-strip" aria-label="Dias da semana">
        {weekDays.map(({ label, day, date }) => (
          <button
            key={date}
            type="button"
            className={`ft-week-day ${selectedDate === date ? 'is-selected' : ''}`}
            aria-label={`${label}, dia ${day}`}
            aria-pressed={selectedDate === date}
            onClick={() => setSelectedDate(date)}
          >
            <span>{label}</span>
            <strong>{day}</strong>
          </button>
        ))}
      </nav>

      <section className="ft-calorie-overview" aria-label="Resumo de calorias do dia">
        <div className="ft-calorie-main">
          <span>Calorias consumidas</span>
          <strong>{decimalText(consumedCalories)}</strong>
          <small>kcal</small>
        </div>
        <div className="ft-calorie-stats">
          <div><span>Meta diária</span><strong>{calorieGoal === null ? '—' : decimalText(calorieGoal)} <small>kcal</small></strong></div>
          <div><span>{remainingCalories !== null && remainingCalories < 0 ? 'Acima da meta' : 'Restantes'}</span><strong>{remainingCalories === null ? '—' : decimalText(Math.abs(remainingCalories))} <small>kcal</small></strong></div>
        </div>
        {calorieGoal !== null && <div className="ft-calorie-progress" role="progressbar" aria-label="Progresso da meta calórica" aria-valuemin={0} aria-valuemax={calorieGoal} aria-valuenow={Math.min(consumedCalories, calorieGoal)}><span style={{ width: `${Math.min(100, Math.max(0, (consumedCalories / Math.max(calorieGoal, 1)) * 100))}%` }} /></div>}
      </section>

      {loadError && <p className="ft-feedback ft-feedback-error" role="alert">{loadError}</p>}
      {loading && <p className="ft-feedback" role="status">Carregando seus registros…</p>}

      <section className="ft-date-card" aria-label="Data dos registros">
        <div>
          <label htmlFor="ft-selected-date">Consultando o dia</label>
          <p>{formatDate(selectedDate)}</p>
        </div>
        <input
          id="ft-selected-date"
          className="input"
          type="date"
          value={selectedDate}
          onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
          aria-label="Escolher data para consultar os registros"
        />
      </section>

      <section className="ft-card" aria-labelledby="food-section-title">
        <div className="ft-section-heading">
          <div className="ft-section-mark"><Apple size={19} aria-hidden="true" /></div>
          <div>
            <p className="ft-kicker">ALIMENTAÇÃO</p>
            <h2 id="food-section-title">O que você registrou</h2>
          </div>
          {!foodEditorOpen && (
            <Button onClick={() => openNewFood()}>
              <Plus aria-hidden="true" /> Novo alimento
            </Button>
          )}
        </div>
        <p className="ft-explainer">
          Escolha um alimento na busca e informe as gramas: as calorias e os nutrientes são calculados automaticamente. Os valores são aproximados e você pode ajustá-los.
        </p>

        {foodFeedback && (
          <p className={`ft-feedback ft-feedback-${foodFeedback.kind}`} role={foodFeedback.kind === 'error' ? 'alert' : 'status'} aria-live="polite">
            {foodFeedback.message}
          </p>
        )}

        {foodEditorOpen && (
          <form className="ft-editor" onSubmit={onFoodSubmit} noValidate>
            <div className="ft-editor-top">
              <h3>{editingFood ? 'Editar alimento' : 'Novo lançamento'}</h3>
              <Button variant="ghost" onClick={() => { setFoodEditorOpen(false); setEditingFood(null); }}>
                <X aria-hidden="true" /> Fechar
              </Button>
            </div>
            {!editingFood && <><MealPhotoScanner onPick={applyPicked} /><NutritionLabelScanner onPick={applyPicked} /><FoodSearch onPick={applyPicked} /></>}
            <div className="ft-form-grid">
              <Field id="food-date" label="Data" className="ft-field" error={foodErrors.date}>
                <input id="food-date" className="input" type="date" value={foodForm.date} onChange={setFood('date')} />
              </Field>
              <Field id="food-meal" label="Momento" className="ft-field" error={foodErrors.meal}>
                <select id="food-meal" className="input ft-select" value={foodForm.meal} onChange={setFood('meal')}>
                  <option value="">Escolha um momento</option>
                  {mealKeys.map((m) => <option key={m} value={m}>{mealLabels[m]}</option>)}
                </select>
              </Field>
            </div>
            <p className="ft-preview" aria-live="polite">
              <strong>Este lançamento: {decimalText(preview.thisKcal)} kcal</strong>
              <span>
                Total do dia com ele: {decimalText(preview.dayTotal)} kcal
                {preview.goal !== null && (preview.goal - preview.dayTotal >= 0
                  ? ` · faltam ${decimalText(preview.goal - preview.dayTotal)} kcal para a meta de ${decimalText(preview.goal)}`
                  : ` · ${decimalText(preview.dayTotal - preview.goal)} kcal acima da meta de ${decimalText(preview.goal)}`)}
              </span>
            </p>
            <details
              className="ft-manual"
              open={Boolean(editingFood) || manualOpen || hiddenErrors}
              onToggle={(e) => setManualOpen((e.currentTarget as HTMLDetailsElement).open)}
            >
              <summary>{editingFood ? 'Valores do lançamento' : 'Preencher à mão ou ajustar valores'}</summary>
              <div className="ft-form-grid">
              <Field id="food-name" label="Alimento" className="ft-field" error={foodErrors.name}>
                <input id="food-name" className="input" maxLength={120} autoComplete="off" placeholder="Nome do alimento" value={foodForm.name} onChange={setFood('name')} />
              </Field>
              <Field id="food-portion" label="Descrição da porção" className="ft-field" error={foodErrors.portion}>
                <input id="food-portion" className="input" maxLength={120} autoComplete="off" placeholder="Como você descreve a porção?" value={foodForm.portion} onChange={setFood('portion')} />
              </Field>
              <Field id="food-quantity" label="Quantidade de porções" className="ft-field" error={foodErrors.quantity} hint="Vírgula decimal é aceita.">
                <input id="food-quantity" className="input" type="text" inputMode="decimal" maxLength={24} value={foodForm.quantity} onChange={setFood('quantity')} />
              </Field>
              </div>
            <fieldset className="ft-nutrients">
              <legend>Informações por porção</legend>
              <p>Informe os valores que você conhece ou estime-os. Zero também é válido.</p>
              <div className="ft-nutrient-grid">
                {nutrientFields.map(({ key, label, unit }) => (
                  <Field key={key} id={`food-${key}`} label={<>{label} <span>({unit})</span></>} className="ft-field" error={foodErrors[key]}>
                    <input id={`food-${key}`} className="input" type="text" inputMode="decimal" maxLength={24} value={foodForm[key]} onChange={setFood(key)} />
                  </Field>
                ))}
              </div>
            </fieldset>
            <Field id="food-source" label="Como você informou esses valores?" className="ft-field ft-source-field" error={foodErrors.nutritionSource} hint="O aplicativo não verifica nem recomenda valores nutricionais.">
              <select id="food-source" className="input ft-select" value={foodForm.nutritionSource} onChange={setFood('nutritionSource')}>
                <option value="">Escolha uma opção</option>
                <option value="user-reported">Informados por mim</option>
                <option value="user-estimated">Estimados por mim</option>
              </select>
            </Field>
            </details>
            <div className="ft-form-actions">
              <Button type="submit" disabled={busy}>
                <Save aria-hidden="true" /> {editingFood ? 'Salvar alterações' : 'Registrar alimento'}
              </Button>
              <span>Os valores totais serão calculados pela quantidade informada.</span>
            </div>
          </form>
        )}

        <NutrientTotals entries={entriesForDate} goals={data.profile?.goals ?? null} />

        <nav className="ft-meal-tabs" aria-label="Detalhes por refeição" role="tablist">
          <button type="button" role="tab" aria-selected={selectedMealTab === 'summary'} className={selectedMealTab === 'summary' ? 'is-active' : ''} onClick={() => setSelectedMealTab('summary')}>Resumo</button>
          {mealKeys.map((meal) => (
            <button key={meal} type="button" role="tab" aria-selected={selectedMealTab === meal} className={selectedMealTab === meal ? 'is-active' : ''} onClick={() => setSelectedMealTab(meal)}>
              {mealLabels[meal]} <span>{mealGroups.find((group) => group.meal === meal)?.entries.length ?? 0}</span>
            </button>
          ))}
        </nav>
        {selectedMealTab === 'summary' ? (
          <div className="ft-meal-summary-grid">
            {mealGroups.map(({ meal, entries }) => (
              <button className="ft-meal-summary-card" type="button" key={meal} onClick={() => setSelectedMealTab(meal)}>
                <span>{mealLabels[meal]}</span>
                <strong>{sum(entries, 'calories')} kcal</strong>
                <small>{entries.length} {entries.length === 1 ? 'alimento' : 'alimentos'}</small>
              </button>
            ))}
          </div>
        ) : (
          <div className="ft-meal-groups">
            {mealGroups.filter(({ meal }) => meal === selectedMealTab).map(({ meal, entries }) => (
              <section className="ft-meal-group" key={meal} aria-labelledby={`meal-${meal}`}>
                <div className="ft-meal-heading">
                  <div><h3 id={`meal-${meal}`}>{mealLabels[meal]}</h3><span>{sum(entries, 'calories')} kcal</span></div>
                  <Button variant="outline" size="sm" onClick={() => openNewFoodForMeal(meal)} disabled={busy} aria-label={`Adicionar alimento em ${mealLabels[meal]}`}><Plus aria-hidden="true" /> Adicionar</Button>
                </div>
                <p className="ft-meal-subtotal">
                  Subtotal · {sum(entries, 'calories')} kcal
                  <span>Proteínas {sum(entries, 'proteins')} g</span><span>Carboidratos {sum(entries, 'carbohydrates')} g</span><span>Gorduras {sum(entries, 'fats')} g</span><span>Fibras {sum(entries, 'fiber')} g</span>
                </p>
                {entries.length ? entries.map((entry) => (
                  <article className="ft-record" key={entry.id}>
                    <div className="ft-record-copy"><strong>{entry.name}</strong><span>{decimalText(entry.quantity)} × {entry.portion}</span><small>{entry.nutritionSource === 'user-estimated' ? 'Valores estimados por você' : 'Valores informados por você'}</small></div>
                    <div className="ft-record-nutrients">{decimalText(calculateFoodEntryNutrient(entry, 'calories'))} kcal<span>P {decimalText(calculateFoodEntryNutrient(entry, 'proteins'))} g · C {decimalText(calculateFoodEntryNutrient(entry, 'carbohydrates'))} g</span></div>
                    <div className="ft-record-actions">
                      <Button variant="ghost" size="sm" onClick={() => copyFoodEntry(entry)} disabled={busy}><Copy aria-hidden="true" /> Copiar para o dia</Button>
                      <Button variant="ghost" size="sm" onClick={() => toggleFavorite(entry)} disabled={busy} aria-pressed={favoriteBySource.has(entry.id)}><Heart aria-hidden="true" /> {favoriteBySource.has(entry.id) ? 'Salvo' : 'Favoritar'}</Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => openEditFood(entry)} disabled={busy} aria-label={`Editar ${entry.name}`}><Pencil aria-hidden="true" /> Editar</Button>
                      <Button variant="ghost" size="sm" onClick={() => removeFood(entry)} disabled={busy}><Trash2 aria-hidden="true" /> Excluir</Button>
                    </div>
                  </article>
                )) : <p className="ft-favorites-empty">Nenhum alimento registrado nesta refeição para este dia.</p>}
              </section>
            ))}
          </div>
        )}

        <section className="ft-favorites" aria-labelledby="favorites-title">
          <div className="ft-favorites-heading">
            <div><p className="ft-kicker">SEUS SALVOS</p><h3 id="favorites-title">Alimentos favoritos</h3></div>
            <Heart size={18} aria-hidden="true" />
          </div>
          {data.favoriteFoods.length ? (
            <div className="ft-favorite-list">
              {data.favoriteFoods.map((favorite) => (
                <div className="ft-favorite-row" key={favorite.id}>
                  <div>
                    <strong>{favorite.name}</strong>
                    <span>{favorite.portion} · {favorite.nutritionSource === 'user-estimated' ? 'estimado por você' : 'informado por você'}</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => openNewFood(favorite)}>
                    <Plus aria-hidden="true" /> Usar
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => removeFavorite(favorite)} disabled={busy} aria-label={`Remover ${favorite.name} dos favoritos`}>
                    <Trash2 aria-hidden="true" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="ft-favorites-empty">Seus lançamentos podem ser salvos aqui para preencher novamente quando você escolher.</p>
          )}
        </section>
      </section>

      <section className="ft-card ft-water-card" aria-labelledby="water-section-title">
        <div className="ft-section-heading">
          <div className="ft-section-mark ft-water-mark"><Droplets size={19} aria-hidden="true" /></div>
          <div><p className="ft-kicker">HIDRATAÇÃO</p><h2 id="water-section-title">Água registrada</h2></div>
          {!waterEditorOpen && <Button onClick={openNewWater}><Plus aria-hidden="true" /> Registrar água</Button>}
        </div>

        {waterFeedback && (
          <p className={`ft-feedback ft-feedback-${waterFeedback.kind}`} role={waterFeedback.kind === 'error' ? 'alert' : 'status'} aria-live="polite">
            {waterFeedback.message}
          </p>
        )}

        <nav className="ft-meal-tabs ft-water-tabs" aria-label="Seções de hidratação" role="tablist">
          <button type="button" role="tab" aria-selected={selectedWaterTab === 'summary'} className={selectedWaterTab === 'summary' ? 'is-active' : ''} onClick={() => setSelectedWaterTab('summary')}>Resumo</button>
          <button type="button" role="tab" aria-selected={selectedWaterTab === 'history'} className={selectedWaterTab === 'history' ? 'is-active' : ''} onClick={() => setSelectedWaterTab('history')}>Registros <span>{waterForDate.length}</span></button>
        </nav>
        {selectedWaterTab === 'summary' && <>
          <div className="ft-water-summary">
            <div><span>Total registrado neste dia</span><strong>{decimalText(waterTotal)} <small>ml</small></strong></div>
            {waterGoal !== null ? (
              <div className="ft-water-goal">
                <span>Meta pessoal configurada</span><strong>{decimalText(waterGoal)} ml</strong><span>{decimalText((waterTotal / waterGoal) * 100)}% da meta</span>
                <span>{waterTotal > waterGoal ? `${decimalText(waterTotal - waterGoal)} ml acima da meta` : waterTotal === waterGoal ? 'Meta atingida' : `Faltam ${decimalText(waterGoal - waterTotal)} ml para a meta`}</span>
              </div>
            ) : <div className="ft-water-goal"><span>Sem meta configurada</span><Link href="/perfil">Definir no Perfil</Link></div>}
          </div>
          <div className="ft-quick-actions" role="group" aria-label="Ações rápidas de água">
            <Button variant="outline" onClick={() => quickWater(500)} disabled={busy}><Plus aria-hidden="true" /> Registrar 500 ml</Button>
            {cupVolume !== null ? <Button variant="outline" onClick={() => quickWater(cupVolume)} disabled={busy}><Droplets aria-hidden="true" /> Registrar um copo ({decimalText(cupVolume)} ml)</Button> : <p className="ft-cup-note">O volume do seu copo não está configurado. <Link href="/perfil">Você pode informar isso no Perfil.</Link></p>}
          </div>
        </>}

        {waterEditorOpen && (
          <form className="ft-editor ft-water-editor" onSubmit={onWaterSubmit} noValidate>
            <div className="ft-editor-top">
              <h3>{editingWater ? 'Editar registro de água' : 'Novo registro de água'}</h3>
              <Button variant="ghost" onClick={() => { setWaterEditorOpen(false); setEditingWater(null); }}>
                <X aria-hidden="true" /> Fechar
              </Button>
            </div>
            <div className="ft-form-grid ft-water-form-grid">
              <Field id="water-date" label="Data" className="ft-field" error={waterError.date}>
                <input id="water-date" className="input" type="date" value={waterForm.date} onChange={(e) => setWaterForm((v) => ({ ...v, date: e.target.value }))} />
              </Field>
              <Field id="water-volume" label="Volume (ml)" className="ft-field" error={waterError.volumeMl} hint="Vírgula decimal é aceita.">
                <input id="water-volume" className="input" type="text" inputMode="decimal" maxLength={24} placeholder="Informe o volume" value={waterForm.volumeMl} onChange={(e) => setWaterForm((v) => ({ ...v, volumeMl: e.target.value }))} />
              </Field>
            </div>
            <div className="ft-form-actions">
              <Button type="submit" disabled={busy}>
                <Save aria-hidden="true" /> {editingWater ? 'Salvar alterações' : 'Registrar água'}
              </Button>
            </div>
          </form>
        )}

        {selectedWaterTab === 'history' && (waterForDate.length ? (
          <div className="ft-water-list">
            {waterForDate.map((entry) => (
              <div className="ft-water-row" key={entry.id}>
                <span className="ft-water-row-icon"><Droplets size={16} aria-hidden="true" /></span>
                <strong>{decimalText(entry.volumeMl)} ml</strong>
                <span className="ft-water-date">{formatDate(entry.date)}</span>
                <div>
                  <Button variant="ghost" size="sm" onClick={() => openEditWater(entry)}><Pencil aria-hidden="true" /> Editar</Button>
                  <Button variant="ghost" size="sm" onClick={() => removeWater(entry)} disabled={busy}><Trash2 aria-hidden="true" /> Excluir</Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="ft-empty ft-water-empty">
            <span className="ft-empty-icon"><Droplets size={20} aria-hidden="true" /></span>
            <h3>Sem registros de água neste dia</h3>
            <p>Você pode adicionar um registro quando quiser. Não há cobrança nem recomendação de quantidade.</p>
            {!waterEditorOpen && <Button variant="outline" onClick={openNewWater}><Plus aria-hidden="true" /> Registrar água</Button>}
          </div>
        ))}
      </section>

      <p className="ft-privacy-note">
        <Check size={15} aria-hidden="true" /> Seus registros ficam salvos na sua conta. Este espaço não oferece orientação médica.
      </p>
    </div>
  );
}
