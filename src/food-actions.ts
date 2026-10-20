import type { FavoriteFood, FoodEntry, FoodEntryInput, MealType, SavedMeal, SavedMealInput, SavedMealItem } from './data';

/** Builds a fresh input for repeating an entry without copying its database ID. */
export function foodEntryToInput(
  entry: FoodEntry,
  date: string = entry.date,
  meal: MealType = entry.meal,
): FoodEntryInput {
  return {
    date,
    meal,
    name: entry.name,
    portion: entry.portion,
    quantity: entry.quantity,
    nutrientsPerPortion: { ...entry.nutrientsPerPortion },
    ...(entry.extras ? { extras: { ...entry.extras } } : {}),
    nutritionSource: entry.nutritionSource,
  };
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Dia de calendário anterior (AAAA-MM-DD), sem depender do fuso do aparelho. */
export function previousDay(date: string): string {
  const match = ISO_DATE.exec(date);
  if (!match) return date;
  const [, year, month, day] = match.map(Number);
  return new Date(Date.UTC(year, month - 1, day - 1)).toISOString().slice(0, 10);
}

/**
 * Lançamentos de `sourceDate` (opcionalmente só de uma refeição) prontos para
 * serem repetidos em `targetDate`, sem reaproveitar o ID do banco.
 */
export function copyDayInputs(
  entries: readonly FoodEntry[],
  sourceDate: string,
  targetDate: string,
  meal?: MealType,
): FoodEntryInput[] {
  return entries
    .filter((entry) => entry.date === sourceDate && (!meal || entry.meal === meal))
    .map((entry) => foodEntryToInput(entry, targetDate, entry.meal));
}

export const QUICK_CALORIES_MAX = 10000;

/**
 * Registro rápido: só calorias, sem escolher alimento. Fica marcado como
 * estimado, porque o usuário não informou os demais nutrientes.
 */
export function quickCaloriesInput(
  date: string,
  meal: MealType,
  calories: number,
  name = '',
): FoodEntryInput | null {
  if (!Number.isFinite(calories) || calories <= 0 || calories > QUICK_CALORIES_MAX) return null;
  return {
    date,
    meal,
    name: name.trim().slice(0, 80) || 'Registro rápido',
    portion: '1 porção',
    quantity: 1,
    nutrientsPerPortion: { calories: Math.round(calories * 10) / 10, proteins: 0, carbohydrates: 0, fats: 0, fiber: 0 },
    nutritionSource: 'user-estimated',
  };
}

export interface RecentFood {
  /** Lançamento mais recente desse alimento, usado como modelo para repetir. */
  entry: FoodEntry;
  /** Quantas vezes apareceu no período. */
  uses: number;
}

const normalizeKey = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
/** Nome padrão do registro rápido, já normalizado (sem acento) como os nomes comparados. */
const QUICK_NAME = normalizeKey('Registro rápido');

/**
 * Alimentos que a pessoa mais repete, a partir do próprio histórico (sem
 * tabela nova). Agrupa por nome + porção, ordena por uso e depois por
 * recência, e ignora o "Registro rápido" (só calorias, sem alimento).
 */
export function recentFoods(entries: readonly FoodEntry[], limit = 8): RecentFood[] {
  const groups = new Map<string, RecentFood>();
  for (const entry of entries) {
    const name = normalizeKey(entry.name);
    if (!name || name === QUICK_NAME) continue;
    const key = `${name}|${normalizeKey(entry.portion)}`;
    const current = groups.get(key);
    if (!current) groups.set(key, { entry, uses: 1 });
    else {
      current.uses += 1;
      if (entry.date > current.entry.date) current.entry = entry;
    }
  }
  return [...groups.values()]
    .sort((a, b) => b.uses - a.uses || b.entry.date.localeCompare(a.entry.date) || a.entry.name.localeCompare(b.entry.name))
    .slice(0, Math.max(0, limit));
}

/* ---------- refeições salvas ---------- */

export const SAVED_MEAL_NAME_MAX = 80;
export const SAVED_MEAL_ITEMS_MAX = 60;

const itemFromEntry = (entry: FoodEntry | FoodEntryInput): SavedMealItem => ({
  name: entry.name,
  portion: entry.portion,
  quantity: entry.quantity,
  nutrientsPerPortion: { ...entry.nutrientsPerPortion },
  ...(entry.extras ? { extras: { ...entry.extras } } : {}),
  nutritionSource: entry.nutritionSource,
});

/** Lançamentos do dia viram uma refeição salva (sem datas nem IDs). */
export function savedMealFromEntries(name: string, entries: Array<FoodEntry | FoodEntryInput>): SavedMealInput | null {
  const clean = name.trim().replace(/\s+/g, ' ').slice(0, SAVED_MEAL_NAME_MAX);
  if (!clean || entries.length === 0) return null;
  return { name: clean, items: entries.slice(0, SAVED_MEAL_ITEMS_MAX).map(itemFromEntry) };
}

/** Um favorito entra na refeição com quantidade 1. */
export function savedItemFromFavorite(favorite: FavoriteFood): SavedMealItem {
  return {
    name: favorite.name,
    portion: favorite.portion,
    quantity: 1,
    nutrientsPerPortion: { ...favorite.nutrientsPerPortion },
    ...(favorite.extras ? { extras: { ...favorite.extras } } : {}),
    nutritionSource: favorite.nutritionSource,
  };
}

export const savedItemFromEntry = itemFromEntry;

/** Registra todos os itens da refeição salva no dia e na refeição escolhidos. */
export function savedMealToInputs(meal: SavedMeal, date: string, mealType: MealType): FoodEntryInput[] {
  return meal.items.map((item) => ({
    date,
    meal: mealType,
    name: item.name,
    portion: item.portion,
    quantity: item.quantity,
    nutrientsPerPortion: { ...item.nutrientsPerPortion },
    ...(item.extras ? { extras: { ...item.extras } } : {}),
    nutritionSource: item.nutritionSource,
  }));
}

export function savedMealCalories(items: SavedMealItem[]): number {
  return Math.round(items.reduce((sum, item) => sum + item.nutrientsPerPortion.calories * item.quantity, 0) * 10) / 10;
}

/** Valida o que a pessoa editou: nome, ao menos um item e quantidades positivas. */
export function validateSavedMeal(name: string, items: SavedMealItem[]): string | null {
  if (!name.trim()) return 'Dê um nome à refeição.';
  if (items.length === 0) return 'Inclua ao menos um alimento.';
  if (items.length > SAVED_MEAL_ITEMS_MAX) return `Uma refeição pode ter até ${SAVED_MEAL_ITEMS_MAX} alimentos.`;
  if (items.some((item) => !Number.isFinite(item.quantity) || item.quantity <= 0 || item.quantity > 10000)) return 'Confira as quantidades: use números maiores que zero.';
  return null;
}
