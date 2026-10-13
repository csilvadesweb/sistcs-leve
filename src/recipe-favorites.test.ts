import { describe, expect, it } from 'vitest';
import { toggleFavoriteId, validateFavoriteIds } from './recipe-favorites';

const ids = ['aveia', 'omelete', 'tapioca'];

describe('favoritos de receitas', () => {
  it('descarta dados persistidos inválidos e IDs que não existem no catálogo', () => {
    expect(validateFavoriteIds(['aveia', 'unknown', 'aveia', 3, null], ids)).toEqual(['aveia']);
    expect(validateFavoriteIds({ id: 'aveia' }, ids)).toEqual([]);
  });

  it('adiciona e remove favoritos sem mutar o estado anterior', () => {
    const current = ['aveia'];
    expect(toggleFavoriteId(current, 'omelete', ids)).toEqual(['aveia', 'omelete']);
    expect(toggleFavoriteId(current, 'aveia', ids)).toEqual([]);
    expect(current).toEqual(['aveia']);
  });

  it('ignora IDs fora do catálogo', () => {
    expect(toggleFavoriteId(['aveia'], 'missing', ids)).toEqual(['aveia']);
  });
});
