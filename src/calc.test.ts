import { describe, expect, it } from 'vitest';
import { ageFromBirth, estimate, type EstimateInput } from './calc';

const complete: EstimateInput = {
  sex: 'female',
  birthDate: '1990-06-15',
  heightCm: 165,
  weightKg: 70,
  activity: 'moderate',
  goalType: 'maintain',
  weeklyRateKg: null,
  macroPreset: 'balanced',
};

describe('idade e estimativa de metas', () => {
  it('calcula idade antes e depois do aniversário', () => {
    expect(ageFromBirth('1990-06-15', '2026-06-14')).toBe(35);
    expect(ageFromBirth('1990-06-15', '2026-06-15')).toBe(36);
    expect(ageFromBirth('1990-06-15', '2026-12-01')).toBe(36);
  });

  it('não calcula enquanto faltarem dados obrigatórios', () => {
    const result = estimate({ ...complete, heightCm: null, activity: null }, '2026-10-12');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain('altura');
      expect(result.reason).toContain('nível de atividade');
    }
  });

  it('recusa estimativa automática para menores de 18 anos', () => {
    const result = estimate({ ...complete, birthDate: '2010-10-13' }, '2026-10-12');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain('maiores de 18 anos');
  });

  it('gera metas finitas, macros, fibras e água para perfil adulto completo', () => {
    const result = estimate(complete, '2026-10-12');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.age).toBe(36);
      expect(result.bmr).toBeGreaterThan(0);
      expect(result.tdee).toBeGreaterThan(result.bmr);
      expect(result.kcal).toBeGreaterThan(0);
      expect(result.protein).toBeGreaterThan(0);
      expect(result.carbs).toBeGreaterThan(0);
      expect(result.fats).toBeGreaterThan(0);
      expect(result.fiber).toBeGreaterThan(0);
      expect(result.waterMl).toBe(2450);
    }
  });

  it('aplica o piso configurado quando a meta de perda ficaria baixa demais', () => {
    const result = estimate({
      ...complete,
      sex: 'female',
      birthDate: '1980-01-01',
      heightCm: 150,
      weightKg: 40,
      activity: 'sedentary',
      goalType: 'lose',
      weeklyRateKg: 1,
    }, '2026-10-12');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.kcal).toBeGreaterThanOrEqual(1200);
      expect(result.floorApplied).toBe(true);
    }
  });

  it('mantém a estimativa sem déficit quando o objetivo é manter peso', () => {
    const result = estimate({ ...complete, goalType: 'maintain' }, '2026-10-12');
    expect(result.ok).toBe(true);
    if (result.ok) expect(Math.abs(result.delta)).toBeLessThanOrEqual(5);
  });

  it.each([
    ['peso abaixo do limite', { weightKg: 19.9 }],
    ['peso acima do limite', { weightKg: 400.1 }],
    ['peso não finito', { weightKg: Number.NaN }],
    ['altura abaixo do limite', { heightCm: 49.9 }],
    ['altura acima do limite', { heightCm: 260.1 }],
    ['altura não finita', { heightCm: Number.POSITIVE_INFINITY }],
  ])('recusa %s antes de calcular metas', (_label, overrides) => {
    const result = estimate({ ...complete, ...overrides }, '2026-10-12');
    expect(result.ok).toBe(false);
  });

  it('recusa datas de nascimento impossíveis', () => {
    const result = estimate({ ...complete, birthDate: '1990-02-30' }, '2026-10-12');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain('data de nascimento');
  });

  it('retorna idade inválida para datas malformadas', () => {
    expect(ageFromBirth('1990-13-01', '2026-10-12')).toBeNaN();
    expect(ageFromBirth('1990-01-01', '2026-02-30')).toBeNaN();
  });
  it.each([
    ['ritmo semanal NaN', { weeklyRateKg: Number.NaN }],
    ['ritmo semanal infinito', { weeklyRateKg: Number.POSITIVE_INFINITY }],
    ['sexo inválido', { sex: 'unknown' as EstimateInput['sex'] }],
    ['objetivo inválido', { goalType: 'unknown' as EstimateInput['goalType'] }],
    ['preset inválido', { macroPreset: 'unknown' as EstimateInput['macroPreset'] }],
    ['atividade inválida', { activity: 'unknown' as EstimateInput['activity'] }],
  ])('recusa %s sem produzir metas NaN', (_label, overrides) => {
    const result = estimate({ ...complete, ...overrides }, '2026-10-12');
    expect(result.ok).toBe(false);
  });

  it('não produz metas não finitas mesmo com dados numéricos extremos', () => {
    const result = estimate({ ...complete, weightKg: Number.MAX_VALUE }, '2026-10-12');
    expect(result.ok).toBe(false);
  });

});
