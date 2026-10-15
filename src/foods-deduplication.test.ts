import { describe, expect, it } from 'vitest';
import { searchLocal } from './foods-br';

describe('deduplicação de estimativas de receitas', () => {
  it.each([
    {
      query: 'macarrão alho e óleo',
      canonicalCode: 'estimate-br3-macarrao-alho-e-oleo',
      duplicateCode: 'estimate-br4-macarrao-ao-alho-e-oleo',
    },
    {
      query: 'frango tikka masala',
      canonicalCode: 'estimate-intl-frango-tikka-masala',
      duplicateCode: 'estimate-br4-tikka-masala-de-frango',
    },
    {
      query: 'espaguete carbonara',
      canonicalCode: 'estimate-intl-espaguete-carbonara',
      duplicateCode: 'estimate-br4-espaguete-a-carbonara',
    },
  ])('retorna apenas um registro para "$query"', ({ query, canonicalCode, duplicateCode }) => {
    const codes = searchLocal(query, 50)
      .map((food) => food.code)
      .filter((code) => code === canonicalCode || code === duplicateCode);

    expect(codes).toEqual([canonicalCode]);
  });
});
