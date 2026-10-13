import { describe, expect, it } from 'vitest';
import { TACO } from './foods-taco';
import { FOODS_BR } from './foods-br';
import { RECIPES } from './recipes';

/**
 * Baseline quality gates for the five competitive areas.
 * These are regression floors, not claims that the app already beats competitors.
 */
describe('quality floors — catalog and nutrition integrity', () => {
  it('preserves the complete TACO baseline instead of silently shrinking the Brazilian reference catalog', () => {
    expect(TACO.length).toBeGreaterThanOrEqual(590);
    for (const [, name, kcal, protein, carbs, fat, fiber] of TACO) {
      expect(name.trim().length).toBeGreaterThan(0);
      for (const value of [kcal, protein, carbs, fat, fiber]) {
        expect(Number.isFinite(value)).toBe(true);
        expect(value).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('preserves the currently declared minimum of 1,137 recipes and their basic nutritional integrity', () => {
    expect(RECIPES.length).toBeGreaterThanOrEqual(1137);
    for (const recipe of RECIPES) {
      expect(recipe.id.trim().length).toBeGreaterThan(0);
      expect(recipe.name.trim().length).toBeGreaterThan(0);
      expect(recipe.ingredients.length).toBeGreaterThan(0);
      expect(recipe.steps.length).toBeGreaterThan(0);
      for (const value of Object.values(recipe.nutrientsPerServing)) {
        expect(Number.isFinite(value)).toBe(true);
        expect(value).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('keeps food-search entries traceable and rejects invalid numeric nutrition values', () => {
    expect(FOODS_BR.length).toBeGreaterThanOrEqual(TACO.length);
    for (const food of FOODS_BR) {
      expect(food.name.trim().length).toBeGreaterThan(0);
      for (const value of [food.kcal, food.protein, food.carbs, food.fat, food.fiber]) {
        expect(Number.isFinite(value)).toBe(true);
        expect(value).toBeGreaterThanOrEqual(0);
      }
      if (food.origin === 'off' || food.origin === 'usda') {
        expect(food.sourceUrl).toMatch(/^https:\/\//);
        expect(food.sourceLicense?.trim().length).toBeGreaterThan(0);
      }
    }
  });
});
