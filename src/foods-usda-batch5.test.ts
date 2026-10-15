import { describe, expect, it } from 'vitest';
import { USDA_SR_LEGACY_BATCH5 } from './foods-usda-batch5';
import { searchLocal } from './foods-br';

const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

describe('lote USDA SR28 com 1.000 alimentos', () => {
  it('contém exatamente 1.000 IDs de origem únicos', () => {
    expect(USDA_SR_LEGACY_BATCH5).toHaveLength(1000);
    const codes = USDA_SR_LEGACY_BATCH5.map((food) => food.code);
    expect(new Set(codes).size).toBe(1000);
    expect(codes.every((code) => /^usda-sr28-\d{5}$/.test(code ?? ''))).toBe(true);
  });
  it('tem nomes únicos, nutrientes válidos por 100 g e licença rastreável', () => {
    const names = USDA_SR_LEGACY_BATCH5.map((food) => normalize(food.name));
    expect(new Set(names).size).toBe(1000);
    for (const food of USDA_SR_LEGACY_BATCH5) {
      expect(food.name.trim()).not.toBe('');
      expect(food.aliases?.length).toBeGreaterThan(0);
      expect(food.origin).toBe('usda');
      expect(food.sourceLicense).toBe('CC BY 4.0');
      expect(food.sourceUrl).toContain('data.gov/dataset/usda');
      for (const value of [food.kcal, food.protein, food.carbs, food.fat, food.fiber]) {
        expect(Number.isFinite(value)).toBe(true);
        expect(value).toBeGreaterThanOrEqual(0);
      }
      expect(food.kcal).toBeLessThanOrEqual(1000);
      expect(food.protein).toBeLessThanOrEqual(100);
      expect(food.carbs).toBeLessThanOrEqual(100);
      expect(food.fat).toBeLessThanOrEqual(100);
      expect(food.fiber).toBeLessThanOrEqual(100);
    }
  });
  it('permite buscar pelo nome original inglês sem mudar a prioridade do catálogo', () => {
    expect(searchLocal('BUTTER WHIPPED WITH SALT', 1000).some((food) => food.code === 'usda-sr28-01002')).toBe(true);
    expect(searchLocal('arroz')[0]?.code).toBe('taco-3');
    expect(searchLocal('feijão')[0]?.code).toBe('taco-561');
  });
});
