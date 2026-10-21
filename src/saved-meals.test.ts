import { describe, expect, it } from 'vitest';
import type { FoodEntry, SavedMeal } from './data';
import { savedItemFromFavorite, savedMealCalories, savedMealFromEntries, savedMealToInputs, validateSavedMeal } from './food-actions';

const entry = (over: Partial<FoodEntry> = {}): FoodEntry => ({
  id: 'e1', date: '2026-10-19', meal: 'lunch', name: 'Arroz', portion: '100 g', quantity: 2,
  nutrientsPerPortion: { calories: 130, proteins: 2.5, carbohydrates: 28, fats: 0.3, fiber: 1 },
  extras: { saturatedFat: null, sugars: 0.1, sodiumMg: null }, nutritionSource: 'user-reported', ...over,
});

describe('refeições salvas', () => {
  it('cria a refeição a partir dos lançamentos, sem IDs nem datas', () => {
    const meal = savedMealFromEntries('  Almoço   fit ', [entry(), entry({ id: 'e2', name: 'Frango' })]);
    expect(meal?.name).toBe('Almoço fit');
    expect(meal?.items).toHaveLength(2);
    expect(JSON.stringify(meal)).not.toContain('e1');
    expect(meal?.items[0].extras?.saturatedFat).toBeNull();
  });

  it('recusa nome vazio ou refeição sem itens', () => {
    expect(savedMealFromEntries('  ', [entry()])).toBeNull();
    expect(savedMealFromEntries('Café', [])).toBeNull();
  });

  it('registra todos os itens no dia e na refeição escolhidos', () => {
    const saved: SavedMeal = { id: 'm', name: 'X', items: savedMealFromEntries('X', [entry()])!.items };
    const inputs = savedMealToInputs(saved, '2026-10-20', 'dinner');
    expect(inputs).toEqual([expect.objectContaining({ date: '2026-10-20', meal: 'dinner', name: 'Arroz', quantity: 2 })]);
    inputs[0].nutrientsPerPortion.calories = 1;
    expect(saved.items[0].nutrientsPerPortion.calories).toBe(130);
  });

  it('soma calorias pela quantidade e valida a edição', () => {
    const items = savedMealFromEntries('X', [entry()])!.items;
    expect(savedMealCalories(items)).toBe(260);
    expect(validateSavedMeal('X', items)).toBeNull();
    expect(validateSavedMeal('', items)).toMatch(/nome/);
    expect(validateSavedMeal('X', [])).toMatch(/ao menos um/);
    expect(validateSavedMeal('X', [{ ...items[0], quantity: 0 }])).toMatch(/quantidades/);
  });

  it('favorito entra com quantidade 1', () => {
    const item = savedItemFromFavorite({ id: 'f', sourceEntryId: null, name: 'Whey', portion: '30 g', nutrientsPerPortion: entry().nutrientsPerPortion, nutritionSource: 'user-estimated' });
    expect(item.quantity).toBe(1);
    expect(item.nutritionSource).toBe('user-estimated');
  });
});

import { recentKey, validateFavoriteForm } from './food-actions';

describe('favoritos e recentes dentro da aba', () => {
  it('valida o formulário de favorito', () => {
    expect(validateFavoriteForm({ name: 'Pão', portion: '1 fatia', values: [70, 2, 12, 1, 1] })).toBeNull();
    expect(validateFavoriteForm({ name: ' ', portion: '1 fatia', values: [1, 0, 0, 0, 0] })).toMatch(/nome/);
    expect(validateFavoriteForm({ name: 'Pão', portion: '', values: [1, 0, 0, 0, 0] })).toMatch(/porção/);
    expect(validateFavoriteForm({ name: 'Pão', portion: '1', values: [Number.NaN, 0, 0, 0, 0] })).toMatch(/números/);
    expect(validateFavoriteForm({ name: 'Pão', portion: '1', values: [-1, 0, 0, 0, 0] })).toMatch(/números/);
  });

  it('identifica o mesmo recente sem diferenciar maiúsculas', () => {
    expect(recentKey({ name: 'Arroz ', portion: '100 G' })).toBe(recentKey({ name: 'arroz', portion: '100 g' }));
  });
});
