import { describe, expect, it } from 'vitest';
import { SUPPLEMENT_SEARCH_TERMS } from './supplement-catalog';

describe('termos de descoberta de suplementos', () => {
  it('cobre grupos de suplementos nacionais e importados', () => {
    for (const term of [
      'Whey protein isolado',
      'Creatina monohidratada',
      'Multivitamínico',
      'Vitamina D3 K2',
      'Ômega 3',
      'Probiótico',
      'Colágeno tipo II',
      'Ashwagandha',
      'Isotônico em pó',
    ]) expect(SUPPLEMENT_SEARCH_TERMS).toContain(term);
  });

  it('não contém consultas duplicadas', () => {
    expect(new Set(SUPPLEMENT_SEARCH_TERMS).size).toBe(SUPPLEMENT_SEARCH_TERMS.length);
  });
});
