import { describe, expect, it } from 'vitest';
import { FOODS_BR, gramsFor, parseQuery, scale, searchLocal } from './foods-br';

describe('busca local de alimentos', () => {
  it('contains the 590-row TACO table plus the two explicitly approximate milk entries', () => {
    expect(FOODS_BR.length).toBe(592);
  });

  it('finds rice by common name without accents', () => {
    expect(searchLocal('arroz').some((f) => f.name.includes('Arroz, tipo 1, cozido'))).toBe(true);
  });

  it('recognizes aipim and macaxeira as mandioca', () => {
    expect(searchLocal('aipim').some((f) => f.name.includes('Mandioca'))).toBe(true);
    expect(searchLocal('macaxeira').some((f) => f.name.includes('Mandioca'))).toBe(true);
  });

  it('recognizes bolacha as biscoito', () => {
    expect(searchLocal('bolacha').some((f) => f.name.includes('Biscoito'))).toBe(true);
  });

  it('recognizes common spelling variants of mussarela', () => {
    expect(searchLocal('mucarela').some((f) => f.name.includes('mussarela'))).toBe(true);
    expect(searchLocal('mozarela').some((f) => f.name.includes('mussarela'))).toBe(true);
  });

  it('finds egg entries for plural input', () => {
    const q = parseQuery('2 ovos');
    expect(q).toEqual({ name: 'ovos', amount: 2, unit: null });
    expect(searchLocal(q.name).some((f) => f.name.startsWith('Ovo, de galinha'))).toBe(true);
  });
});

describe('interpretação de quantidade e cálculo', () => {
  it('parses quantity and weight unit in natural language', () => {
    expect(parseQuery('150 g de arroz')).toEqual({ name: 'arroz', amount: 150, unit: 'g' });
    expect(parseQuery('150g arroz')).toEqual({ name: 'arroz', amount: 150, unit: 'g' });
  });

  it('parses a household measure', () => {
    expect(parseQuery('1 colher de sopa de azeite')).toEqual({
      name: 'azeite',
      amount: 1,
      unit: 'colher de sopa',
    });
  });

  it('converts 150 g of cooked type-1 rice to 192 kcal', () => {
    const rice = FOODS_BR.find((f) => f.code === 'taco-3');
    expect(rice).toBeDefined();
    expect(scale(rice!, 150).calories).toBe(192);
  });

  it('converts 2 eggs using the first TACO unit (50 g each)', () => {
    const egg = FOODS_BR.find((f) => f.code === 'taco-488');
    expect(egg).toBeDefined();
    expect(gramsFor(egg!, parseQuery('2 ovos')).grams).toBe(100);
    expect(scale(egg!, 100).calories).toBe(146);
  });

  it('scales every macro linearly', () => {
    const sample = { kcal: 200, protein: 10, carbs: 20, fat: 5, fiber: 4 };
    const scaled = scale({ ...sample, name: 'Teste', origin: 'local' }, 50);
    expect(scaled).toEqual({ calories: 100, proteins: 5, carbohydrates: 10, fats: 2.5, fiber: 2 });
  });
});
