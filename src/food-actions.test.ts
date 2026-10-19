import { describe, expect, it } from 'vitest';
import { QUICK_CALORIES_MAX, copyDayInputs, foodEntryToInput, previousDay, quickCaloriesInput } from './food-actions';
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

describe('registro rápido e cópia de dia', () => {
  const at = (id: string, date: string, meal: FoodEntry['meal']): FoodEntry => ({ ...entry, id, date, meal });
  const list = [at('a', '2026-10-18', 'breakfast'), at('b', '2026-10-18', 'lunch'), at('c', '2026-10-17', 'lunch')];

  it('calcula o dia anterior atravessando mês e ano', () => {
    expect(previousDay('2026-10-19')).toBe('2026-10-18');
    expect(previousDay('2026-03-01')).toBe('2026-02-28');
    expect(previousDay('2026-01-01')).toBe('2025-12-31');
    expect(previousDay('lixo')).toBe('lixo');
  });

  it('copia o dia inteiro ou só uma refeição, mantendo a refeição e sem IDs', () => {
    const day = copyDayInputs(list, '2026-10-18', '2026-10-19');
    expect(day.map((i) => i.meal)).toEqual(['breakfast', 'lunch']);
    expect(day.every((i) => i.date === '2026-10-19' && !('id' in i))).toBe(true);
    expect(copyDayInputs(list, '2026-10-18', '2026-10-19', 'lunch')).toHaveLength(1);
    expect(copyDayInputs(list, '2026-10-01', '2026-10-19')).toEqual([]);
  });

  it('monta o registro rápido só com calorias e marca como estimado', () => {
    const input = quickCaloriesInput('2026-10-19', 'snack', 250.04, '  Pão de queijo  ');
    expect(input).toMatchObject({ name: 'Pão de queijo', quantity: 1, nutritionSource: 'user-estimated' });
    expect(input?.nutrientsPerPortion).toEqual({ calories: 250, proteins: 0, carbohydrates: 0, fats: 0, fiber: 0 });
    expect(quickCaloriesInput('2026-10-19', 'snack', 100)?.name).toBe('Registro rápido');
  });

  it('recusa calorias inválidas', () => {
    for (const bad of [0, -5, Number.NaN, Infinity, QUICK_CALORIES_MAX + 1]) {
      expect(quickCaloriesInput('2026-10-19', 'snack', bad)).toBeNull();
    }
  });
});
