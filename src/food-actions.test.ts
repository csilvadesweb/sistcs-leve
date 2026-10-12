import { describe, expect, it } from 'vitest';
import { foodEntryToInput } from './food-actions';
import type { FoodEntry } from './data';

const entry: FoodEntry = {
  id: 'original-id',
  date: '2026-10-11',
  meal: 'dinner',
  name: 'Arroz integral',
  portion: '100 g',
  quantity: 1.5,
  nutrientsPerPortion: { calories: 123, proteins: 2.6, carbohydrates: 25, fats: 1, fiber: 3.2 },
  nutritionSource: 'user-reported',
};

describe('repetir alimento', () => {
  it('copies nutrition data to a selected day without reusing the original ID', () => {
    const copied = foodEntryToInput(entry, '2026-10-12');

    expect(copied).toEqual({
      date: '2026-10-12',
      meal: 'dinner',
      name: 'Arroz integral',
      portion: '100 g',
      quantity: 1.5,
      nutrientsPerPortion: { calories: 123, proteins: 2.6, carbohydrates: 25, fats: 1, fiber: 3.2 },
      nutritionSource: 'user-reported',
    });
    expect('id' in copied).toBe(false);
    expect(entry.date).toBe('2026-10-11');
  });

  it('allows choosing a different meal while preserving the original entry', () => {
    const copied = foodEntryToInput(entry, '2026-10-12', 'lunch');

    expect(copied.meal).toBe('lunch');
    expect(copied.nutrientsPerPortion).toEqual(entry.nutrientsPerPortion);
    expect(copied.nutrientsPerPortion).not.toBe(entry.nutrientsPerPortion);
  });
});
