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

type ParsedMeasuredIngredient = { amount: number; unit: 'g' | 'kg' | 'ml' | 'l'; name: string };

function parseMeasuredIngredient(value: string): ParsedMeasuredIngredient | null {
  const match = value.trim().match(/^(\d+(?:[.,]\d+)?)\s*(kg|g|ml|l)\s+(?:de\s+)?(.+)$/i);
  if (!match) return null;
  const amount = Number(match[1].replace(',', '.'));
  const unit = match[2].toLocaleLowerCase('pt-BR') as ParsedMeasuredIngredient['unit'];
  const name = match[3].trim();
  if (!Number.isFinite(amount) || amount <= 0 || !name) return null;
  return { amount, unit, name };
}

function formatAmount(amount: number): string {
  const rounded = Math.round(amount * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded).replace('.', ',');
}

/** Sums only matching, explicit mass/volume units. Ambiguous household measures remain separate. */
export function buildShoppingList(items: PlannedMealWithRecipe[]): ShoppingIngredient[] {
  const grouped = new Map<string, ShoppingIngredient>();
  const measured = new Map<string, { amount: number; unit: ParsedMeasuredIngredient['unit']; name: string; count: number }>();

  for (const item of items) {
    for (const rawIngredient of item.recipe.ingredients) {
      const ingredient = rawIngredient.trim();
      const parsed = parseMeasuredIngredient(ingredient);
      if (parsed) {
        const normalizedName = parsed.name.toLocaleLowerCase('pt-BR').replace(/\s+/g, ' ');
        const key = `measured:${parsed.unit}:${normalizedName}`;
        const existing = measured.get(key);
        if (existing) {
          existing.amount += parsed.amount;
          existing.count += 1;
        } else {
          measured.set(key, { ...parsed, name: parsed.name.replace(/^./, (c) => c.toLocaleUpperCase('pt-BR')), count: 1 });
        }
        continue;
      }

      // Descrições sem unidade explícita não são interpretadas para evitar somas nutricionalmente incorretas.
      const key = ingredient.toLocaleLowerCase('pt-BR');
      const existing = grouped.get(key);
      if (existing) existing.count += 1;
      else grouped.set(key, { ingredient, count: 1 });
    }
  }

  for (const entry of measured.values()) {
    const unitLabel = entry.unit;
    const ingredient = `${formatAmount(entry.amount)} ${unitLabel} de ${entry.name}`;
    grouped.set(`measured:${entry.unit}:${entry.name.toLocaleLowerCase('pt-BR').replace(/\s+/g, ' ')}`, {
      ingredient,
      count: entry.count,
    });
  }

  return [...grouped.values()].sort((a, b) => a.ingredient.localeCompare(b.ingredient, 'pt-BR'));
}
