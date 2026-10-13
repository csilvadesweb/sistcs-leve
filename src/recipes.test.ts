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

  it('mantém IDs e nomes únicos e nutrientes não negativos', () => {
    const ids = RECIPES.map((recipe) => recipe.id);
    const names = RECIPES.map((recipe) => recipe.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').replace(/[^a-z0-9]+/g, ' ').trim());
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(names).size).toBe(names.length);
    for (const recipe of RECIPES) {
      for (const nutrient of Object.values(recipe.nutrientsPerServing)) {
        expect(Number.isFinite(nutrient)).toBe(true);
        expect(nutrient).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('classifica o lote brasileiro sem sobrepor os filtros Fitness e Brasileira e usa preparo específico', () => {
    const batch = RECIPES.filter((recipe) => recipe.id.startsWith('brl'));
    expect(batch).toHaveLength(100);
    expect(batch.filter((recipe) => recipe.tags?.includes('Fitness'))).toHaveLength(50);
    expect(batch.filter((recipe) => recipe.tags?.includes('Brasileira'))).toHaveLength(50);
    for (const recipe of batch) {
      expect(recipe.tags?.includes('Fitness') && recipe.tags?.includes('Brasileira')).toBe(false);
      expect(recipe.description).not.toContain('Refeição caseira com');
      expect(recipe.steps.join(' ')).not.toContain('até atingir a textura desejada');
      expect(recipe.steps).toHaveLength(3);
    }
  });

  it('filtra por categoria', () => {
    const results = filterRecipes(RECIPES, '', 'Vegetariana');
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((recipe) => recipe.category === 'Vegetariana')).toBe(true);
  });

  it('prioriza Fitness primeiro, receitas brasileiras em seguida, e oferece filtros dedicados', () => {
    const all = filterRecipes(RECIPES, '');
    expect(all.length).toBe(RECIPES.length);
    const firstNonFitness = all.findIndex((recipe) => !recipe.tags?.includes('Fitness'));
    expect(all[0].tags).toContain('Fitness');
    expect(firstNonFitness).toBeGreaterThanOrEqual(0);
    expect(all.slice(0, firstNonFitness).every((recipe) => recipe.tags?.includes('Fitness'))).toBe(true);

    const fitnessOnly = all.filter((recipe) => recipe.tags?.includes('Fitness'));
    const brazilianOnly = all.filter((recipe) => recipe.tags?.includes('Brasileira') && !recipe.tags?.includes('Fitness'));
    const neither = all.filter((recipe) => !recipe.tags?.includes('Fitness') && !recipe.tags?.includes('Brasileira'));
    const lastFitnessIndex = Math.max(...fitnessOnly.map((recipe) => all.indexOf(recipe)));
    const firstBrazilianOnlyIndex = brazilianOnly.length ? Math.min(...brazilianOnly.map((recipe) => all.indexOf(recipe))) : -1;
    const firstNeitherIndex = neither.length ? Math.min(...neither.map((recipe) => all.indexOf(recipe))) : -1;
    if (firstBrazilianOnlyIndex >= 0) expect(lastFitnessIndex).toBeLessThan(firstBrazilianOnlyIndex);
    if (firstNeitherIndex >= 0 && firstBrazilianOnlyIndex >= 0) expect(firstBrazilianOnlyIndex).toBeLessThan(firstNeitherIndex);
    if (firstNeitherIndex >= 0 && firstBrazilianOnlyIndex < 0) expect(lastFitnessIndex).toBeLessThan(firstNeitherIndex);

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
