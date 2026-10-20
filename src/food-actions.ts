import type { FoodEntry, FoodEntryInput, MealType } from './data';

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
