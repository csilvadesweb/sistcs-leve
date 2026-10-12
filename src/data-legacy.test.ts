import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('./supabase', () => ({ supabase: {} }));
import { readLegacyData } from './data';

const KEY = 'meu-progresso-total:local-data:v1';

function mockStorage(value: string | null) {
  const getItem = vi.fn((key: string) => key === KEY ? value : null);
  vi.stubGlobal('window', { localStorage: { getItem } });
  return getItem;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('importação legada — leitura segura', () => {
  it('retorna nulo quando não há dados antigos', () => {
    mockStorage(null);
    expect(readLegacyData()).toBeNull();
  });

  it('retorna nulo quando o conteúdo não é JSON válido', () => {
    mockStorage('{not-json');
    expect(readLegacyData()).toBeNull();
  });

  it('retorna nulo para um objeto válido sem registros importáveis', () => {
    mockStorage(JSON.stringify({ profile: null, foodEntries: [], favoriteFoods: [], waterEntries: [] }));
    expect(readLegacyData()).toBeNull();
  });

  it('lê dados legados conhecidos sem alterar o conteúdo e usa a chave esperada', () => {
    const legacy = {
      profile: { displayName: 'Pessoa', goals: { calories: 1800 } },
      foodEntries: [{ id: 'legacy-food', name: 'Banana' }],
      favoriteFoods: [],
      waterEntries: [],
    };
    const getItem = mockStorage(JSON.stringify(legacy));

    expect(readLegacyData()).toEqual(legacy);
    expect(getItem).toHaveBeenCalledWith(KEY);
  });

  it('retorna nulo quando o acesso ao armazenamento lança uma exceção', () => {
    vi.stubGlobal('window', { localStorage: { getItem: () => { throw new Error('storage blocked'); } } });
    expect(readLegacyData()).toBeNull();
  });
});
