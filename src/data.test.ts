import { describe, expect, it, vi } from 'vitest';

// Os testes exercitam funções puras; não devem inicializar Auth/Realtime nem acessar Supabase.
vi.mock('./supabase', () => ({ supabase: {} }));
import {
  addDays,
  calculateFoodEntryNutrient,
  calculateFoodNutrientTotals,
  createDataExport,
  fastHours,
  lastDays,
  weightSummary,
  type FoodEntry,
  type WeightEntry,
} from './data';

const nutrients = {
  calories: 210,
  proteins: 12,
  carbohydrates: 30,
  fats: 6,
  fiber: 4,
};

const entries: FoodEntry[] = [
  {
    id: 'food-1',
    date: '2026-10-12',
    meal: 'breakfast',
    name: 'Aveia',
    portion: '30 g',
    quantity: 2,
    nutrientsPerPortion: nutrients,
    nutritionSource: 'user-estimated',
  },
  {
    id: 'food-2',
    date: '2026-10-12',
    meal: 'lunch',
    name: 'Arroz',
    portion: '100 g',
    quantity: 1.5,
    nutrientsPerPortion: { calories: 128, proteins: 2.5, carbohydrates: 28.1, fats: 0.2, fiber: 1.6 },
    nutritionSource: 'user-reported',
  },
];

describe('diário alimentar — cálculos', () => {
  it('calcula o nutriente considerando a quantidade registrada', () => {
    expect(calculateFoodEntryNutrient(entries[0]!, 'calories')).toBe(420);
  });

  it('soma calorias e macros de várias refeições sem alterar os lançamentos', () => {
    const before = structuredClone(entries);
    expect(calculateFoodNutrientTotals(entries)).toEqual({
      calories: 612,
      proteins: 27.75,
      carbohydrates: 102.15,
      fats: 12.3,
      fiber: 10.4,
    });
    expect(entries).toEqual(before);
  });

  it('devolve zeros quando o diário está vazio', () => {
    expect(calculateFoodNutrientTotals([])).toEqual({
      calories: 0,
      proteins: 0,
      carbohydrates: 0,
      fats: 0,
      fiber: 0,
    });
  });
});

describe('calendário e histórico de peso', () => {
  it('avança e retrocede datas atravessando mês, ano e ano bissexto', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
    expect(addDays('2024-02-29', 1)).toBe('2024-03-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('gera uma janela inclusiva de dias em ordem cronológica', () => {
    expect(lastDays('2026-10-12', 3)).toEqual(['2026-10-10', '2026-10-11', '2026-10-12']);
    expect(lastDays('2026-10-12', 1)).toEqual(['2026-10-12']);
  });

  it('identifica primeiro e último peso por data sem modificar a lista original', () => {
    const weights: WeightEntry[] = [
      { id: 'w2', date: '2026-10-10', weightKg: 79.5, note: '' },
      { id: 'w3', date: '2026-10-12', weightKg: 79, note: '' },
      { id: 'w1', date: '2026-10-08', weightKg: 80, note: '' },
    ];
    const original = [...weights];
    expect(weightSummary(weights)).toEqual({ first: weights[2], latest: weights[1] });
    expect(weights).toEqual(original);
  });

  it('retorna nulos quando ainda não há pesagens', () => {
    expect(weightSummary([])).toEqual({ first: null, latest: null });
  });
});

describe('jejum e exportação', () => {
  it('calcula duração de jejum concluído e em andamento sem permitir duração negativa', () => {
    expect(fastHours({ startedAt: '2026-10-12T08:00:00.000Z', endedAt: '2026-10-12T20:30:00.000Z' })).toBe(12.5);
    expect(fastHours({ startedAt: '2026-10-12T08:00:00.000Z', endedAt: null }, Date.parse('2026-10-12T14:00:00.000Z'))).toBe(6);
    expect(fastHours({ startedAt: '2026-10-12T08:00:00.000Z', endedAt: '2026-10-12T07:00:00.000Z' })).toBe(0);
  });

  it('exporta dados com identificador de app, versão e conteúdo sem alterar a origem', () => {
    const data = { foodEntries: entries };
    const exported = createDataExport(data as never);
    expect(exported).toMatchObject({ app: 'SISTCS Leve', formatVersion: 3, data });
    expect(Number.isNaN(Date.parse(exported.exportedAt))).toBe(false);
    expect(data.foodEntries).toEqual(entries);
  });
});
