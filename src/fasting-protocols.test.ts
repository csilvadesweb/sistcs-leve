import { describe, expect, it } from 'vitest';
import { FASTING_METHODS, FASTING_PROTOCOLS, isValidFastingTarget } from './fasting-protocols';

describe('protocolos de jejum', () => {
  it('oferece protocolos diários conhecidos em ordem crescente de duração', () => {
    expect(FASTING_PROTOCOLS.map((p) => p.hours)).toEqual([12, 13, 14, 15, 16, 17, 18, 20, 23, 24]);
    expect(FASTING_PROTOCOLS.every((p) => p.label.length > 0 && p.hint.length > 0)).toBe(true);
  });

  it('documenta métodos diários e semanais sem confundi-los', () => {
    expect(FASTING_METHODS.some((m) => m.id === 'five-two' && m.timerHours === undefined)).toBe(true);
    expect(FASTING_METHODS.some((m) => m.id === 'alternate-day' && m.timerHours === undefined)).toBe(true);
    expect(FASTING_METHODS.some((m) => m.id === 'omad' && m.timerHours === 23)).toBe(true);
  });

  it('mantém os limites do cronômetro entre 12 e 24 horas', () => {
    expect(isValidFastingTarget(12)).toBe(true);
    expect(isValidFastingTarget(24)).toBe(true);
    expect(isValidFastingTarget(11)).toBe(false);
    expect(isValidFastingTarget(25)).toBe(false);
    expect(isValidFastingTarget(Number.NaN)).toBe(false);
  });
});
