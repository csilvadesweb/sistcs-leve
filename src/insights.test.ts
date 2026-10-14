import { describe, expect, it, vi } from 'vitest';

vi.mock('./supabase', () => ({ supabase: {} }));
import { achievements, loggingStreak, weeklySummary } from './insights';
import type { FoodEntry, UserGoals } from './data';

const entry = (date: string, calories: number, proteins = 0): FoodEntry => ({
  id: `${date}-${calories}`, date, meal: 'lunch', name: 'x', portion: '1', quantity: 1,
  nutrientsPerPortion: { calories, proteins, carbohydrates: 0, fats: 0, fiber: 0 }, nutritionSource: 'user-reported',
});
const goals: UserGoals = { calories: 2000, proteins: 100, carbohydrates: null, fats: null, fiber: null, waterMl: null };

describe('loggingStreak', () => {
  it('conta dias seguidos terminando hoje', () => {
    expect(loggingStreak([{ date: '2026-10-13' }, { date: '2026-10-12' }, { date: '2026-10-11' }], '2026-10-13')).toBe(3);
  });
  it('não zera a sequência se hoje ainda está vazio', () => {
    expect(loggingStreak([{ date: '2026-10-12' }, { date: '2026-10-11' }], '2026-10-13')).toBe(2);
  });
  it('quebra a sequência quando falta um dia', () => {
    expect(loggingStreak([{ date: '2026-10-13' }, { date: '2026-10-11' }], '2026-10-13')).toBe(1);
  });
  it('é zero sem registros recentes e atravessa virada de mês', () => {
    expect(loggingStreak([], '2026-10-13')).toBe(0);
    expect(loggingStreak([{ date: '2026-10-01' }, { date: '2026-09-30' }], '2026-10-01')).toBe(2);
  });
});

describe('weeklySummary', () => {
  it('calcula médias só dos dias com registro e acertos de meta', () => {
    const s = weeklySummary([
      entry('2026-10-13', 1000, 60), entry('2026-10-13', 1000, 50), // 2000 kcal, 110 g
      entry('2026-10-12', 1000, 40),
      entry('2026-10-01', 9999, 999), // fora da janela
    ], goals, '2026-10-13');
    expect(s.daysLogged).toBe(2);
    expect(s.avgCalories).toBe(1500);
    expect(s.avgProteins).toBe(75);
    expect(s.proteinDaysHit).toBe(1);
    expect(s.calorieDaysOnTarget).toBe(1);
  });
  it('sem metas devolve null nos acertos e sem dados devolve médias nulas', () => {
    const s = weeklySummary([], null, '2026-10-13');
    expect(s).toEqual({ daysLogged: 0, avgCalories: null, avgProteins: null, proteinDaysHit: null, calorieDaysOnTarget: null });
  });
});

describe('achievements', () => {
  it('marca conquistas conforme a sequência e o total de dias', () => {
    const days = ['2026-10-13', '2026-10-12', '2026-10-11'].map((date) => ({ date }));
    const a = Object.fromEntries(achievements(days, '2026-10-13').map((x) => [x.id, x.earned]));
    expect(a).toEqual({ first: true, streak3: true, streak7: false, days30: false });
  });
});
