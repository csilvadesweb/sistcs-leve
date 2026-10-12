import { beforeEach, describe, expect, it, vi } from 'vitest';

const { fromMock, results } = vi.hoisted(() => ({
  fromMock: vi.fn(),
  results: {} as Record<string, { data: unknown; error: { message: string } | null }>,
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
    ];
    expect(fromMock.mock.calls.map(([table]) => table)).toEqual(expectedTables);

    for (const call of fromMock.mock.results) {
      expect((call.value as { eq: ReturnType<typeof vi.fn> }).eq).toHaveBeenCalledWith('user_id', 'user-a');
    }
  });
});
