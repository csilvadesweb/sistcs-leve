import { describe, expect, it } from 'vitest';
import { hasCompleteNonNegativeNutrition, isValidMealPhotoEstimate, normalizeMealPhotoEstimates } from './photo-nutrition';

const valid = {
  name: 'Arroz cozido', grams: 150, calories: 195, proteins: 4, carbohydrates: 42, fats: 0.4, fiber: 1.5, confidence: 'high',
};

describe('validação de estimativas por foto', () => {
  it('aceita itens completos, finitos e não negativos', () => {
    expect(isValidMealPhotoEstimate(valid)).toBe(true);
    expect(normalizeMealPhotoEstimates([valid])).toEqual([valid]);
  });

  it.each([
    ['nome vazio', { ...valid, name: '   ' }],
    ['porção zero', { ...valid, grams: 0 }],
    ['porção absurda', { ...valid, grams: 10001 }],
    ['calorias negativas', { ...valid, calories: -1 }],
    ['proteína NaN', { ...valid, proteins: Number.NaN }],
    ['gordura infinita', { ...valid, fats: Number.POSITIVE_INFINITY }],
    ['confiança desconhecida', { ...valid, confidence: 'certain' }],
  ])('rejeita %s', (_label, item) => {
    expect(isValidMealPhotoEstimate(item)).toBe(false);
    expect(normalizeMealPhotoEstimates([item])).toEqual([]);
  });

  it('não converte nutrientes ausentes, negativos ou não finitos em zero', () => {
    expect(hasCompleteNonNegativeNutrition([100, 20, 30, 10, 4])).toBe(true);
    expect(hasCompleteNonNegativeNutrition([100, null, 30, 10, 4])).toBe(false);
    expect(hasCompleteNonNegativeNutrition([100, -1, 30, 10, 4])).toBe(false);
    expect(hasCompleteNonNegativeNutrition([100, Number.NaN, 30, 10, 4])).toBe(false);
    expect(hasCompleteNonNegativeNutrition([])).toBe(false);
  });
});
