import { describe, expect, it } from 'vitest';
import { filterRecipes, RECIPES, scaleRecipeNutrients } from './recipes';

describe('catálogo de receitas', () => {
  it('tem receitas próprias com ingredientes, preparo e indicação de estimativa nutricional', () => {
    expect(RECIPES.length).toBeGreaterThanOrEqual(10);
    for (const recipe of RECIPES) {
      expect(recipe.ingredients.length).toBeGreaterThan(0);
      expect(recipe.steps.length).toBeGreaterThan(0);
      expect(recipe.nutritionNote.toLowerCase()).toContain('estimativa');
      expect(recipe.nutrientsPerServing.calories).toBeGreaterThan(0);
    }
  });

  it('filtra por categoria', () => {
    const results = filterRecipes(RECIPES, '', 'Vegetariana');
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((recipe) => recipe.category === 'Vegetariana')).toBe(true);
  });

  it('prioriza todas as receitas Fitness antes das brasileiras exclusivas e oferece filtros dedicados', () => {
    const all = filterRecipes(RECIPES, '');
    const firstNonFitness = all.findIndex((recipe) => !recipe.tags?.includes('Fitness'));

    expect(all.length).toBe(RECIPES.length);
    expect(all[0].tags).toContain('Fitness');
    expect(firstNonFitness).toBeGreaterThanOrEqual(0);
    expect(all.slice(0, firstNonFitness).every((recipe) => recipe.tags?.includes('Fitness'))).toBe(true);
    expect(all.slice(firstNonFitness).every((recipe) => !recipe.tags?.includes('Fitness'))).toBe(true);
    expect(filterRecipes(RECIPES, '', 'Brasileira').every((recipe) => recipe.tags?.includes('Brasileira'))).toBe(true);
    expect(filterRecipes(RECIPES, '', 'Fitness').every((recipe) => recipe.tags?.includes('Fitness'))).toBe(true);
  });

  it('busca sem diferenciar maiúsculas e acentos e inclui ingredientes', () => {
    expect(filterRecipes(RECIPES, 'banana').some((recipe) => recipe.id === 'overnight-aveia-banana')).toBe(true);
    expect(filterRecipes(RECIPES, 'MACARRAO').some((recipe) => recipe.id === 'macarrao-tomate')).toBe(true);
    expect(filterRecipes(RECIPES, 'grão-de-bico').some((recipe) => recipe.id === 'salada-grao-de-bico')).toBe(true);
  });

  it('escala todos os nutrientes de acordo com as porções sem alterar a origem', () => {
    const base = { calories: 300, proteins: 20, carbohydrates: 30, fats: 10, fiber: 5 };
    const before = { ...base };
    expect(scaleRecipeNutrients(base, 2)).toEqual({ calories: 600, proteins: 40, carbohydrates: 60, fats: 20, fiber: 10 });
    expect(scaleRecipeNutrients(base, 0.5)).toEqual({ calories: 150, proteins: 10, carbohydrates: 15, fats: 5, fiber: 2.5 });
    expect(scaleRecipeNutrients(base, Number.NaN)).toEqual(base);
    expect(base).toEqual(before);
  });
});
