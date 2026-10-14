import { describe, expect, it } from 'vitest';
import { analyzeAdaptiveProgress } from './adaptive-goals';
import type { FoodEntry, WeightEntry } from './data';

function weight(date: string, weightKg: number): WeightEntry {
  return { id: date, date, weightKg, note: '' };
}
function food(date: string, calories = 1800): FoodEntry {
  return {
    id: date, date, meal: 'lunch', name: 'Refeição', portion: 'porção',
    quantity: 1,
    nutrientsPerPortion: { calories, proteins: 20, carbohydrates: 50, fats: 10, fiber: 5 },
    nutritionSource: 'user-estimated',
  };
}

describe('analyzeAdaptiveProgress', () => {
  it('requires enough weigh-ins and diary coverage before producing an insight', () => {
    expect(analyzeAdaptiveProgress(
      [weight('2026-10-01', 80), weight('2026-10-16', 80)],
      Array.from({ length: 10 }, (_, index) => food(`2026-10-${String(index + 1).padStart(2, '0')}`)),
      'lose', 1800, '2026-10-28',
    )).toBeNull();
  });

  it('flags a cautious review when the weight trend does not match a loss goal', () => {
    const weights = [
      weight('2026-10-02', 80), weight('2026-10-05', 80.1), weight('2026-10-09', 79.9),
      weight('2026-10-17', 80), weight('2026-10-21', 80.1), weight('2026-10-26', 80),
    ];
    const foods = Array.from({ length: 14 }, (_, index) => food(`2026-10-${String(index + 1).padStart(2, '0')}`));
    const result = analyzeAdaptiveProgress(weights, foods, 'lose', 1800, '2026-10-28');
    expect(result?.kind).toBe('review');
    expect(result?.calorieGoal).toBe(1800);
    expect(result?.message).toContain('não reduzimos nem alteramos');
  });
});
