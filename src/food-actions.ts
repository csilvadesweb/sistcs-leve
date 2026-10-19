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
