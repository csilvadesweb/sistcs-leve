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
