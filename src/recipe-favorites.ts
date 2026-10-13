/** Validates persisted favorite IDs against the current catalog. */
export function validateFavoriteIds(value: unknown, validRecipeIds: readonly string[]): string[] {
  if (!Array.isArray(value)) return [];
  const valid = new Set(validRecipeIds);
  return [...new Set(value.filter((id): id is string => typeof id === 'string' && valid.has(id)))];
}

export function toggleFavoriteId(current: readonly string[], recipeId: string, validRecipeIds: readonly string[]): string[] {
  if (!validRecipeIds.includes(recipeId)) return [...current];
  return current.includes(recipeId) ? current.filter((id) => id !== recipeId) : [...current, recipeId];
}
