export interface MealPhotoEstimate {
  name: string;
  grams: number;
  calories: number;
  proteins: number;
  carbohydrates: number;
  fats: number;
  fiber: number;
  confidence: 'high' | 'medium' | 'low';
}

const NUTRIENT_KEYS = ['calories', 'proteins', 'carbohydrates', 'fats', 'fiber'] as const;

/** Untrusted AI output must be finite, non-negative, and identifiable before entering the diary. */
export function isValidMealPhotoEstimate(value: unknown): value is MealPhotoEstimate {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<MealPhotoEstimate>;
  return typeof item.name === 'string' &&
    item.name.trim().length > 0 &&
    item.name.length <= 120 &&
    typeof item.grams === 'number' &&
    Number.isFinite(item.grams) &&
    item.grams > 0 &&
    item.grams <= 10000 &&
    (item.confidence === 'high' || item.confidence === 'medium' || item.confidence === 'low') &&
    NUTRIENT_KEYS.every((key) => typeof item[key] === 'number' && Number.isFinite(item[key]) && item[key]! >= 0);
}

export function normalizeMealPhotoEstimates(value: unknown): MealPhotoEstimate[] {
  return Array.isArray(value) ? value.filter(isValidMealPhotoEstimate) : [];
}

export function hasCompleteNonNegativeNutrition(values: unknown[]): boolean {
  return values.length > 0 && values.every((value) =>
    typeof value === 'number' && Number.isFinite(value) && value >= 0
  );
}
