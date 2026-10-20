import { beforeEach, describe, expect, it, vi } from 'vitest';

const { fromMock, results } = vi.hoisted(() => ({
  fromMock: vi.fn(),
  results: {} as Record<string, { data: unknown; error: { message: string; code?: string } | null }>,
}));

vi.mock('./supabase', () => ({
  supabase: { from: fromMock },
}));

import { loadAll } from './data';

function queryFor(table: string) {
  const query: Record<string, unknown> = {};
  for (const method of ['select', 'eq', 'order', 'limit']) {
    query[method] = vi.fn(() => query);
  }
  query.maybeSingle = vi.fn(async () => results[table] ?? { data: null, error: null });
  query.then = (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) =>
    Promise.resolve(results[table] ?? { data: [], error: null }).then(resolve, reject);
  return query;
}

describe('persistência — falha segura ao carregar dados', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const key of Object.keys(results)) delete results[key];
    fromMock.mockImplementation((table: string) => queryFor(table));
  });

  it('propaga erro de leitura de alimentos em vez de devolver um diário incompleto como sucesso', async () => {
    results.food_entries = { data: null, error: { message: 'permission denied' } };

    await expect(loadAll('user-a')).rejects.toThrow('Não foi possível carregar os alimentos. (permission denied)');
  });

  it('propaga erro de leitura de perfil', async () => {
    results.profiles = { data: null, error: { message: 'network error' } };

    await expect(loadAll('user-a')).rejects.toThrow('Não foi possível carregar o perfil. (network error)');
  });

  it('carrega uma conta vazia com coleções vazias sem falhar', async () => {
    const result = await loadAll('user-a');

    expect(result.profile).toBeNull();
    expect(result.foodEntries).toEqual([]);
    expect(result.favoriteFoods).toEqual([]);
    expect(result.waterEntries).toEqual([]);
    expect(result.weightEntries).toEqual([]);
    expect(result.medications).toEqual([]);
    expect(result.medicationLogs).toEqual([]);
    expect(result.progressPhotos).toEqual([]);
    expect(result.fastingEntries).toEqual([]);
    expect(result.exerciseEntries).toEqual([]);
    expect(result.exerciseTrackingAvailable).toBe(true);
  });

  it('mantém o app carregável quando a migration opcional de exercícios ainda não existe', async () => {
    results.exercise_entries = { data: null, error: { code: '42P01', message: 'relation exercise_entries does not exist' } };

    const result = await loadAll('user-a');

    expect(result.exerciseEntries).toEqual([]);
    expect(result.exerciseTrackingAvailable).toBe(false);
  });

  it('mantém o app carregável quando a tabela de refeições salvas ainda não existe', async () => {
    results.saved_meals = { data: null, error: { code: '42P01', message: 'relation saved_meals does not exist' } };

    const result = await loadAll('user-a');

    expect(result.savedMeals).toEqual([]);
    expect(result.savedMealsAvailable).toBe(false);
  });

  it('carrega refeições salvas e ignora itens inválidos', async () => {
    results.saved_meals = { data: [{ id: 'm1', name: 'Café da manhã', items: [
      { name: 'Ovo', portion: '1 unidade', quantity: 2, nutrientsPerPortion: { calories: 70, proteins: 6 }, nutritionSource: 'user-reported' },
      { portion: 'sem nome' },
    ] }], error: null };

    const result = await loadAll('user-a');

    expect(result.savedMealsAvailable).toBe(true);
    expect(result.savedMeals).toHaveLength(1);
    expect(result.savedMeals[0].items).toHaveLength(1);
    expect(result.savedMeals[0].items[0].nutrientsPerPortion.fats).toBe(0);
  });

  it('não esconde falhas de permissão ou rede no diário de exercícios', async () => {
    results.exercise_entries = { data: null, error: { code: '42501', message: 'permission denied' } };

    await expect(loadAll('user-a')).rejects.toThrow('Não foi possível carregar os exercícios. (permission denied)');
  });

  it('filtra todas as leituras pelo identificador da conta solicitada', async () => {
    await loadAll('user-a');

    const expectedTables = [
      'profiles',
      'food_entries',
      'favorite_foods',
      'water_entries',
      'weight_entries',
      'medications',
      'medication_logs',
      'progress_photos',
      'fasting_entries',
      'exercise_entries',
      'medication_effect_logs',
    ];
    expect(fromMock.mock.calls.map(([table]) => table)).toEqual(expectedTables);

    for (const call of fromMock.mock.results) {
      expect((call.value as { eq: ReturnType<typeof vi.fn> }).eq).toHaveBeenCalledWith('user_id', 'user-a');
    }
  });
});
