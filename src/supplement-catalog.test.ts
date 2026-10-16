import { describe, expect, it } from 'vitest';
import { SUPPLEMENT_SEARCH_TERMS } from './supplement-catalog';

describe('atalhos do catálogo de suplementos', () => {
  it('inclui categorias comuns e mantém termos únicos para a busca', () => {
    expect(SUPPLEMENT_SEARCH_TERMS).toContain('Whey protein');
    expect(SUPPLEMENT_SEARCH_TERMS).toContain('Creatina');
    expect(SUPPLEMENT_SEARCH_TERMS).toContain('Multivitamínico');
    expect(SUPPLEMENT_SEARCH_TERMS).toContain('Ômega 3');
    expect(new Set(SUPPLEMENT_SEARCH_TERMS.map((term) => term.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR'))).size)
      .toBe(SUPPLEMENT_SEARCH_TERMS.length);
  });
});
