import { describe, expect, it } from 'vitest';
import { scaleExtras, type FoodPer100 } from './foods-br';

const base: FoodPer100 = { name: 'Biscoito', kcal: 450, protein: 7, carbs: 70, fat: 15, fiber: 2, origin: 'off' };

describe('scaleExtras', () => {
  it('escala os valores informados pela porção', () => {
    expect(scaleExtras({ ...base, saturatedFat: 6, sugars: 20, sodiumMg: 400 }, 50)).toEqual({ saturatedFat: 3, sugars: 10, sodiumMg: 200 });
  });

  it('mantém null quando a fonte não informou, em vez de virar zero', () => {
    expect(scaleExtras(base, 100)).toEqual({ saturatedFat: null, sugars: null, sodiumMg: null });
    expect(scaleExtras({ ...base, sodiumMg: 0 }, 100).sodiumMg).toBe(0);
  });
});
