import { describe, expect, it } from 'vitest';
import { FOODS_BR, searchLocal } from './foods-br';
import { ESTIMATES_BATCH4 } from './foods-batch4';

const base = (name: string) => name.replace(/\s*\(estimativa[^)]*\)\s*$/i, '').trim().toLowerCase();

describe('estimativas (lote 4)', () => {
  it('traz um lote grande, todo rotulado como estimativa', () => {
    expect(ESTIMATES_BATCH4.length).toBeGreaterThanOrEqual(500);
    for (const food of ESTIMATES_BATCH4) {
      expect(food.origin, food.name).toBe('estimate');
      expect(food.name.endsWith('(estimativa)'), food.name).toBe(true);
      expect(food.code?.startsWith('estimate-br4-'), food.name).toBe(true);
      expect(food.units?.length, food.name).toBeGreaterThan(0);
    }
  });

  it('tem códigos e nomes únicos em todo o catálogo', () => {
    const codes = FOODS_BR.map((food) => food.code).filter(Boolean);
    expect(new Set(codes).size).toBe(codes.length);
    const names = FOODS_BR.map((food) => base(food.name));
    for (const food of ESTIMATES_BATCH4) expect(names.filter((n) => n === base(food.name)).length, food.name).toBe(1);
  });

  it('mantém valores válidos e calorias coerentes com os macronutrientes (±12%)', () => {
    for (const food of ESTIMATES_BATCH4) {
      for (const value of [food.kcal, food.protein, food.carbs, food.fat, food.fiber]) {
        expect(Number.isFinite(value) && value >= 0, food.name).toBe(true);
      }
      const atwater = 4 * food.protein + 4 * food.carbs + 9 * food.fat;
      expect(Math.abs(atwater - food.kcal), food.name).toBeLessThanOrEqual(Math.max(2, food.kcal * 0.12));
      for (const [label, grams] of food.units ?? []) {
        expect(label.length, food.name).toBeGreaterThan(0);
        expect(grams, food.name).toBeGreaterThan(0);
      }
    }
  });

  it('encontra itens do lote pela busca local', () => {
    expect(searchLocal('baião de dois', 20).length).toBeGreaterThan(0);
    for (const [query, code] of [
      ['whey protein isolado', 'estimate-br4-whey-protein-isolado'],
      ['moqueca baiana de peixe', 'estimate-br4-moqueca-baiana-de-peixe'],
      ['pad thai de frango', 'estimate-br4-pad-thai-de-frango'],
      ['x-salada', 'estimate-br4-x-salada'],
      ['queijo cottage', 'estimate-br4-queijo-cottage'],
    ] as const) {
      expect(searchLocal(query, 12).some((food) => food.code === code), query).toBe(true);
    }
  });

  it('não muda o primeiro resultado de buscas que já funcionavam (regressão zero)', () => {
    for (const [query, code] of [
      ['arroz', 'taco-3'],
      ['feijão', 'taco-561'],
      ['pão francês', 'taco-53'],
      ['ovo cozido', 'taco-488'],
      ['frango', 'taco-410'],
      ['leite', 'estimate-extra-9001'],
      ['banana', 'taco-182'],
      ['café', 'estimate-br2-cafe-com-acucar'],
      ['whey', 'estimate-intl-whey-protein-em-po'],
    ] as const) {
      expect(searchLocal(query)[0]?.code, query).toBe(code);
    }
  });

  it('lotes adicionais só preenchem vagas depois dos itens anteriores do catálogo', () => {
    for (const query of ['arroz', 'pão', 'queijo', 'bolo', 'suco']) {
      const results = searchLocal(query, 50);
      const firstBatch4 = results.findIndex((food) => food.code?.startsWith('estimate-br4-'));
      const firstUsdaBatch5 = results.findIndex((food) => food.code?.startsWith('usda-sr28-'));
      if (firstBatch4 >= 0) {
        expect(results.slice(firstBatch4).every((food) =>
          food.code?.startsWith('estimate-br4-') || food.code?.startsWith('usda-sr28-'),
        ), query).toBe(true);
      }
      if (firstUsdaBatch5 >= 0) {
        expect(results.slice(firstUsdaBatch5).every((food) => food.code?.startsWith('usda-sr28-')), query).toBe(true);
      }
    }
  });
});
