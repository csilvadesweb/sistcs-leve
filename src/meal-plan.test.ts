import { describe, expect, it } from 'vitest';
import { RECIPES } from './recipes';
import { buildShoppingList, resolvePlannedMeals, validatePlannedMeals, WEEK_DAYS } from './meal-plan';

const plan = [
  { id: 'a', day: WEEK_DAYS[0], meal: 'breakfast', recipeId: 'overnight-aveia-banana' },
  { id: 'b', day: WEEK_DAYS[1], meal: 'snack', recipeId: 'overnight-aveia-banana' },
  { id: 'c', day: 'Funday', meal: 'lunch', recipeId: 'arroz-feijao-frango' },
  { id: 'd', day: WEEK_DAYS[0], meal: 'invalid', recipeId: 'arroz-feijao-frango' },
  { id: 'e', day: WEEK_DAYS[0], meal: 'lunch', recipeId: 'missing-recipe' },
];

describe('planejamento semanal e lista de compras', () => {
  it('valida planos persistidos e descarta dias, refeições e receitas inválidos', () => {
    expect(validatePlannedMeals(plan, RECIPES)).toEqual(plan.slice(0, 2));
    expect(validatePlannedMeals('not-json-array', RECIPES)).toEqual([]);
    expect(validatePlannedMeals(null, RECIPES)).toEqual([]);
  });

  it('resolve as receitas sem deixar itens órfãos', () => {
    const valid = validatePlannedMeals(plan, RECIPES);
    const resolved = resolvePlannedMeals(valid, RECIPES);
    expect(resolved).toHaveLength(2);
    expect(resolved[0].recipe.name).toBe('Aveia com banana e iogurte');
  });

  it('soma quantidades explícitas repetidas e conta ocorrências sem converter medidas ambíguas', () => {
    const resolved = resolvePlannedMeals(validatePlannedMeals(plan, RECIPES), RECIPES);
    const shopping = buildShoppingList(resolved);
    expect(shopping.find((entry) => entry.ingredient === '80 g de Aveia em flocos')?.count).toBe(2);
    expect(shopping.map((entry) => entry.ingredient)).toEqual([...shopping.map((entry) => entry.ingredient)].sort((a, b) => a.localeCompare(b, 'pt-BR')));
  });

  it('soma apenas quantidades com o mesmo nome e unidade explícita', () => {
    const customRecipes = [
      { ...RECIPES[0], id: 'grams-a', ingredients: ['40 g de aveia em flocos', '100 ml de leite'] },
      { ...RECIPES[0], id: 'grams-b', ingredients: ['40 g de aveia em flocos', '0,5 l de leite'] },
    ];
    const meals = [
      { id: 'x', day: WEEK_DAYS[0], meal: 'breakfast' as const, recipeId: 'grams-a' },
      { id: 'y', day: WEEK_DAYS[1], meal: 'snack' as const, recipeId: 'grams-b' },
    ];
    const shopping = buildShoppingList(resolvePlannedMeals(meals, customRecipes));
    expect(shopping.find((entry) => entry.ingredient === '80 g de Aveia em flocos')?.count).toBe(2);
    expect(shopping.find((entry) => entry.ingredient === '100 ml de Leite')?.count).toBe(1);
    expect(shopping.find((entry) => entry.ingredient === '0,5 l de Leite')?.count).toBe(1);
  });

  it('mantém ingredientes sem quantidade/unidade explícita separados, sem inferir somas', () => {
    const customRecipes = [
      { ...RECIPES[0], id: 'household-a', ingredients: ['1 banana média'] },
      { ...RECIPES[0], id: 'household-b', ingredients: ['2 bananas médias'] },
    ];
    const meals = [
      { id: 'x', day: WEEK_DAYS[0], meal: 'breakfast' as const, recipeId: 'household-a' },
      { id: 'y', day: WEEK_DAYS[1], meal: 'snack' as const, recipeId: 'household-b' },
    ];
    const shopping = buildShoppingList(resolvePlannedMeals(meals, customRecipes));
    expect(shopping).toHaveLength(2);
  });

  it('não modifica o planejamento de entrada ao gerar a lista de compras', () => {
    const valid = validatePlannedMeals(plan, RECIPES);
    const snapshot = structuredClone(valid);
    buildShoppingList(resolvePlannedMeals(valid, RECIPES));
    expect(valid).toEqual(snapshot);
  });
});
