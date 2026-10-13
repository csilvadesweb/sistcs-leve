import type { MealType } from './data';
import type { Recipe } from './recipes';

export const WEEK_DAYS = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'] as const;
export type PlannedMeal = { id: string; day: string; meal: MealType; recipeId: string };
export type PlannedMealWithRecipe = PlannedMeal & { recipe: Recipe };
export type ShoppingIngredient = { ingredient: string; count: number };

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'snack', 'dinner', 'other'];

export function validatePlannedMeals(value: unknown, recipes: Recipe[]): PlannedMeal[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is PlannedMeal =>
    Boolean(item && typeof item === 'object' &&
      typeof item.id === 'string' &&
      typeof item.day === 'string' && WEEK_DAYS.includes(item.day as (typeof WEEK_DAYS)[number]) &&
      MEAL_TYPES.includes(item.meal) &&
      typeof item.recipeId === 'string' && recipes.some((recipe) => recipe.id === item.recipeId))
  );
}

export function resolvePlannedMeals(items: PlannedMeal[], recipes: Recipe[]): PlannedMealWithRecipe[] {
  return items.flatMap((item) => {
    const recipe = recipes.find((candidate) => candidate.id === item.recipeId);
    return recipe ? [{ ...item, recipe }] : [];
  });
}

/** Groups identical ingredient descriptions. Counts occurrences, but intentionally does not infer/merge numeric quantities. */
export function buildShoppingList(items: PlannedMealWithRecipe[]): ShoppingIngredient[] {
  const grouped = new Map<string, ShoppingIngredient>();
  for (const item of items) {
    for (const ingredient of item.recipe.ingredients) {
      const key = ingredient.trim().toLocaleLowerCase('pt-BR');
      const existing = grouped.get(key);
      if (existing) existing.count += 1;
      else grouped.set(key, { ingredient: ingredient.trim(), count: 1 });
    }
  }
  return [...grouped.values()].sort((a, b) => a.ingredient.localeCompare(b.ingredient, 'pt-BR'));
}
