import { describe, expect, it } from 'vitest';
import { TACO } from './foods-taco';

describe('integridade do catálogo TACO versionado', () => {
  it('mantém IDs positivos e únicos', () => {
    const ids = TACO.map(([id]) => id);
    expect(ids.length).toBeGreaterThan(500);
    expect(ids.every((id) => Number.isInteger(id) && id > 0)).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('mantém nomes preenchidos e nutrientes numéricos, finitos e não negativos por 100 g', () => {
    for (const [id, name, kcal, protein, carbs, fat, fiber] of TACO) {
      expect(name.trim(), `nome do item ${id}`).not.toBe('');
      for (const [field, value] of Object.entries({ kcal, protein, carbs, fat, fiber })) {
        expect(Number.isFinite(value), `item ${id}, ${field}`).toBe(true);
        expect(value, `item ${id}, ${field}`).toBeGreaterThanOrEqual(0);
      }
      expect(kcal, `energia do item ${id}`).toBeLessThanOrEqual(1000);
      for (const [field, value] of Object.entries({ protein, carbs, fat, fiber })) {
        expect(value, `item ${id}, ${field} por 100 g`).toBeLessThanOrEqual(100);
      }
    }
  });

  it('preserva referências alimentares básicas usadas na busca', () => {
    expect(TACO).toContainEqual([3, 'Arroz, tipo 1, cozido', 128, 2.5, 28.1, 0.2, 1.6]);
    expect(TACO).toContainEqual([53, 'Pão, trigo, francês', 300, 8, 58.6, 3.1, 2.3]);
    expect(TACO.some(([, name]) => /banana/i.test(name))).toBe(true);
    expect(TACO.some(([, name]) => /feijão/i.test(name))).toBe(true);
  });
});
