import { describe, expect, it } from 'vitest';
import { gramsFor, parseQuery, scale, searchLocal, type FoodPer100 } from './foods-br';

const sample: FoodPer100 = {
  name: 'Alimento de teste',
  kcal: 200,
  protein: 10,
  carbs: 30,
  fat: 5,
  fiber: 4,
  origin: 'local',
  units: [['colher de sopa', 20], ['unidade', 50]],
};

describe('parseQuery — linguagem natural de porções', () => {
  it.each([
    ['2 ovos', { name: 'ovos', amount: 2, unit: null }],
    ['150 g de arroz', { name: 'arroz', amount: 150, unit: 'g' }],
    ['1 colher de sopa de azeite', { name: 'azeite', amount: 1, unit: 'colher de sopa' }],
    ['1,5 kg de batata', { name: 'batata', amount: 1.5, unit: 'kg' }],
  ])('interpreta %s sem perder quantidade ou alimento', (input, expected) => {
    expect(parseQuery(input)).toEqual(expected);
  });

  it('normaliza acentos e espaços excedentes', () => {
    expect(parseQuery('  150   g de maçã  ')).toEqual({ name: 'maca', amount: 150, unit: 'g' });
  });
});

describe('gramsFor — conversão de porções', () => {
  it('converte peso informado em gramas', () => {
    expect(gramsFor(sample, parseQuery('150 g de alimento')).grams).toBe(150);
  });

  it('converte medida caseira usando a medida específica do alimento', () => {
    expect(gramsFor(sample, parseQuery('2 colheres de sopa de alimento')).grams).toBe(40);
  });

  it('usa a primeira medida cadastrada quando só há quantidade e nome', () => {
    expect(gramsFor(sample, parseQuery('2 alimento')).grams).toBe(40);
  });
});

describe('scale — cálculo nutricional por peso', () => {
  it('escala calorias e macros proporcionalmente a 150 g', () => {
    expect(scale(sample, 150)).toEqual({
      calories: 300,
      proteins: 15,
      carbohydrates: 45,
      fats: 7.5,
      fiber: 6,
    });
  });

  it('retorna zero para peso zero sem produzir NaN', () => {
    expect(Object.values(scale(sample, 0))).toEqual([0, 0, 0, 0, 0]);
  });
});

describe('searchLocal — catálogo TACO', () => {
  it('encontra alimentos comuns sem diferenciar maiúsculas e acentos', () => {
    expect(searchLocal('ARROZ').length).toBeGreaterThan(0);
    expect(searchLocal('banana').length).toBeGreaterThan(0);
    expect(searchLocal('maca').length).toBeGreaterThan(0);
  });

  it('mantém resultados determinísticos e respeita o limite solicitado', () => {
    expect(searchLocal('arroz', 5)).toEqual(searchLocal('arroz', 5));
    expect(searchLocal('arroz', 5)).toHaveLength(5);
  });

  it('retorna lista vazia para consulta sem termos úteis', () => {
    expect(searchLocal('   ')).toEqual([]);
  });
});
