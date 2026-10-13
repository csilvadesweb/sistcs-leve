import { afterEach, describe, expect, it, vi } from 'vitest';
import { FOODS_BR, gramsFor, lookupBarcode, normalizeBarcodeInput, parseQuery, scale, searchLocal, searchOpenFoodFacts, searchOpenFoodFactsPage, searchTempoLifeFoods, type FoodPer100 } from './foods-br';

afterEach(() => vi.unstubAllGlobals());

const sample: FoodPer100 = {
  name: 'Alimento de teste',
  kcal: 200,
  protein: 10,
  carbs: 30,
  fat: 5,
  fiber: 4,
  origin: 'local',
  units: [['colher de sopa', 20], ['unidade', 50]],
};

describe('parseQuery — linguagem natural de porções', () => {
  it.each([
    ['2 ovos', { name: 'ovos', amount: 2, unit: null }],
    ['150 g de arroz', { name: 'arroz', amount: 150, unit: 'g' }],
    ['1 colher de sopa de azeite', { name: 'azeite', amount: 1, unit: 'colher de sopa' }],
    ['1,5 kg de batata', { name: 'batata', amount: 1.5, unit: 'kg' }],
  ])('interpreta %s sem perder quantidade ou alimento', (input, expected) => {
    expect(parseQuery(input)).toEqual(expected);
  });

  it('normaliza acentos e espaços excedentes', () => {
    expect(parseQuery('  150   g de maçã  ')).toEqual({ name: 'maca', amount: 150, unit: 'g' });
  });
});

describe('gramsFor — conversão de porções', () => {
  it('converte peso informado em gramas', () => {
    expect(gramsFor(sample, parseQuery('150 g de alimento')).grams).toBe(150);
  });

  it('converte medida caseira usando a medida específica do alimento', () => {
    expect(gramsFor(sample, parseQuery('2 colheres de sopa de alimento')).grams).toBe(40);
  });

  it('usa a primeira medida cadastrada quando só há quantidade e nome', () => {
    expect(gramsFor(sample, parseQuery('2 alimento')).grams).toBe(40);
  });
});

describe('scale — cálculo nutricional por peso', () => {
  it('escala calorias e macros proporcionalmente a 150 g', () => {
    expect(scale(sample, 150)).toEqual({
      calories: 300,
      proteins: 15,
      carbohydrates: 45,
      fats: 7.5,
      fiber: 6,
    });
  });

  it('retorna zero para peso zero sem produzir NaN', () => {
    expect(Object.values(scale(sample, 0))).toEqual([0, 0, 0, 0, 0]);
  });
});

describe('searchLocal — catálogo TACO', () => {
  it('encontra alimentos comuns sem diferenciar maiúsculas e acentos', () => {
    expect(searchLocal('ARROZ').length).toBeGreaterThan(0);
    expect(searchLocal('banana').length).toBeGreaterThan(0);
    expect(searchLocal('maca').length).toBeGreaterThan(0);
  });

  it('reconhece nomes regionais comuns para alimentos já cadastrados', () => {
    expect(searchLocal('pão de sal', 20).some((food) => /pão, trigo, francês/i.test(food.name))).toBe(true);
    expect(searchLocal('jerimum', 20).some((food) => /abóbora/i.test(food.name))).toBe(true);
    expect(searchLocal('bergamota', 20).some((food) => /tangerina/i.test(food.name))).toBe(true);
    expect(searchLocal('mexerica', 20).some((food) => /tangerina/i.test(food.name))).toBe(true);
    expect(searchLocal('batata salsa', 20).some((food) => /batata, baroa/i.test(food.name))).toBe(true);
    expect(searchLocal('mandioquinha', 20).some((food) => /batata, baroa/i.test(food.name))).toBe(true);
    expect(searchLocal('pão cacetinho', 20).some((food) => /pão, trigo, francês/i.test(food.name))).toBe(true);
    expect(searchLocal('feijão de corda', 20).some((food) => /feijão, fradinho/i.test(food.name))).toBe(true);
    expect(searchLocal('feijão macassa', 20).some((food) => /feijão, fradinho/i.test(food.name))).toBe(true);
  });

  it('encontra strogonoff de carne bovina e identifica que os nutrientes são estimados', () => {
    const results = searchLocal('strogonoff de carne');
    expect(results).toContainEqual(expect.objectContaining({
      name: 'Strogonoff de carne bovina (estimativa caseira)',
      origin: 'estimate',
      kcal: 170,
      code: 'recipe-strogonoff-carne',
    }));
    expect(searchLocal('strogonoff')).toContainEqual(expect.objectContaining({ code: 'recipe-strogonoff-carne' }));
  });

  it('fornece medidas caseiras úteis para alimentos de referência sem porções cadastradas', async () => {
    const { householdUnitsForFood } = await import('./foods-br');
    expect(householdUnitsForFood({ ...sample, name: 'Rice, white, cooked', units: undefined })[0]).toEqual(['colher de sopa cheia', 25]);
    expect(householdUnitsForFood({ ...sample, name: 'Beans, black, cooked', units: undefined })[0]).toEqual(['concha média', 100]);
    expect(householdUnitsForFood({ ...sample, name: 'Chicken breast, cooked', units: undefined })[0]).toEqual(['filé médio', 120]);
    expect(householdUnitsForFood({ ...sample, name: 'Olive oil', units: undefined })[0]).toEqual(['colher de chá', 5]);
    expect(householdUnitsForFood({ ...sample, name: 'Milk, whole', units: undefined })[0]).toEqual(['copo', 200]);
    expect(householdUnitsForFood({ ...sample, name: 'Salmon, cooked', units: undefined })[0]).toEqual(['filé médio', 120]);
    expect(householdUnitsForFood({ ...sample, name: 'Rice flour', units: undefined })[0]).toEqual(['colher de sopa rasa', 12]);
    expect(householdUnitsForFood({ ...sample, name: 'Salt', units: undefined })[0]).toEqual(['colher de sopa rasa', 12]);
  });

  it('mantém resultados determinísticos e respeita o limite solicitado', () => {
    expect(searchLocal('arroz', 5)).toEqual(searchLocal('arroz', 5));
    expect(searchLocal('arroz', 5)).toHaveLength(5);
  });

  it('retorna lista vazia para consulta sem termos úteis', () => {
    expect(searchLocal('   ')).toEqual([]);
  });
});


describe('Cobertura de preparações brasileiras estimadas', () => {
  it.each([
    ['pão de queijo', 'estimate-br-pao-de-queijo'],
    ['feijoada', 'estimate-br-feijoada'],
    ['brigadeiro', 'estimate-br-brigadeiro'],
    ['tapioca sem recheio', 'estimate-br-tapioca'],
    ['cuscuz de tapioca', 'estimate-br-cuscuz-tapioca'],
    ['moqueca de peixe', 'estimate-br-moqueca-peixe'],
    ['esfiha', 'estimate-br-esfiha'],
    ['bolo de cenoura', 'estimate-br-bolo-cenoura'],
    ['bolo de cenoura com cobertura de chocolate', 'estimate-br-bolo-cenoura-chocolate'],
    ['pamonha com coco', 'estimate-br-pamonha-coco'],
    ['coxinha de frango', 'estimate-br-coxinha-frango'],
    ['pastel frito', 'estimate-br-pastel-frito'],
  ])('encontra %s e identifica os valores como estimativas', (query, code) => {
    expect(searchLocal(query, 20)).toContainEqual(expect.objectContaining({ code, origin: 'estimate' }));
  });

  it('mantém valores numéricos válidos e medidas caseiras nas preparações estimadas', () => {
    const additions = FOODS_BR.filter((food) => food.code?.startsWith('estimate-br-'));
    expect(additions).toHaveLength(12);
    for (const food of additions) {
      expect([food.kcal, food.protein, food.carbs, food.fat, food.fiber].every((n) => Number.isFinite(n) && n >= 0)).toBe(true);
      expect(food.units?.length).toBeGreaterThan(0);
    }
  });
});


describe('origem dos valores aproximados', () => {
  it.each([
    ['leite integral', 'estimate-extra-9001'],
    ['leite desnatado', 'estimate-extra-9002'],
  ])('não classifica %s como registro da TACO', (query, code) => {
    expect(searchLocal(query, 20)).toContainEqual(expect.objectContaining({
      code,
      origin: 'estimate',
    }));
    expect(FOODS_BR).toContainEqual(expect.objectContaining({
      code,
      origin: 'estimate',
    }));
  });
});

describe('normalização de entrada do código de barras', () => {
  it('preserva até 14 dígitos ao colar código formatado com separadores', () => {
    expect(normalizeBarcodeInput('1-2345 6789-0123')).toBe('1234567890123');
    expect(normalizeBarcodeInput(' 789 123 456 78901 ')).toBe('78912345678901');
  });

  it('remove caracteres não numéricos e limita a 14 dígitos sem truncar antes da limpeza', () => {
    expect(normalizeBarcodeInput('789.123.456.78901')).toBe('78912345678901');
    expect(normalizeBarcodeInput('123456789012345678')).toBe('12345678901234');
    expect(normalizeBarcodeInput('sem código')).toBe('');
  });
});

describe('Open Food Facts — integração externa resiliente', () => {
  it('mapeia produto e nutrientes para valores por 100 g', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        products: [{
          code: '78912345',
          product_name: 'Biscoito de teste',
          brands: 'Marca A, Marca B',
          nutriments: {
            'energy-kcal_100g': 250,
            proteins_100g: 5,
            carbohydrates_100g: 40,
            fat_100g: 8,
            fiber_100g: 2,
            'saturated-fat_100g': 2.5,
            sugars_100g: 12,
            sodium_100g: 0.42,
          },
        }],
      }),
    }));
    await expect(searchOpenFoodFacts('biscoito')).resolves.toMatchObject([{
      name: 'Biscoito de teste',
      brand: 'Marca A',
      kcal: 250,
      protein: 5,
      carbs: 40,
      fat: 8,
      fiber: 2,
      origin: 'off',
      code: '78912345',
      sourceUrl: 'https://world.openfoodfacts.org/product/78912345',
      sourceLicense: 'ODbL-1.0; Database Contents License',
      saturatedFat: 2.5,
      sugars: 12,
      sodiumMg: 420,
      reportedNutrients: { protein: true, carbs: true, fat: true, fiber: true },
    }]);
  });

  it('pede páginas sucessivas ao Open Food Facts e informa se há mais resultados', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ count: 61, page: 1, page_size: 30, products: [{ code: 'page1', product_name: 'Produto página 1', nutriments: { 'energy-kcal_100g': 100 } }] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ count: 61, page: 3, page_size: 30, products: [{ code: 'page3', product_name: 'Produto página 3', nutriments: { 'energy-kcal_100g': 120 } }] }) });
    vi.stubGlobal('fetch', fetchMock);
    await expect(searchOpenFoodFactsPage('produto paginacao', 1)).resolves.toMatchObject({ foods: [{ code: 'page1' }], hasMore: true });
    await expect(searchOpenFoodFactsPage('produto paginacao', 3)).resolves.toMatchObject({ foods: [{ code: 'page3' }], hasMore: false });
    expect(fetchMock.mock.calls[0]?.[0]).toContain('page=1');
    expect(fetchMock.mock.calls[1]?.[0]).toContain('page=3');
  });
  it('usa apenas alimentos USDA com licença pública explícita na base genérica', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        count: 2,
        foods: [
          { slug: 'banana-raw', name: 'Banana, raw', source: 'usda_sr_legacy', values_license: 'us_public_domain', url: 'https://tempolife.app/calories/banana-raw', per_100g: { kcal: 89, protein_g: 1.1, carbs_g: 22.8, fat_g: 0.3, fiber_g: 2.6 } },
          { slug: 'cassava-raw', name: 'Cassava, raw', source: 'usda_sr_legacy', values_license: 'us_public_domain', url: 'https://tempolife.app/calories/cassava-raw', per_100g: { kcal: 160, protein_g: 1.4, carbs_g: 38.1, fat_g: 0.3, fiber_g: 1.8 } },
          { slug: 'black-beans-cooked', name: 'Beans, black, mature seeds, cooked', source: 'usda_sr_legacy', values_license: 'us_public_domain', url: 'https://tempolife.app/calories/black-beans-cooked', per_100g: { kcal: 132, protein_g: 8.9, carbs_g: 23.7, fat_g: 0.5, fiber_g: 8.7 } },
          { slug: 'black-eyed-peas-cooked', name: 'Cowpeas, common, mature seeds, cooked', source: 'usda_sr_legacy', values_license: 'us_public_domain', url: 'https://tempolife.app/calories/black-eyed-peas-cooked', per_100g: { kcal: 116, protein_g: 7.7, carbs_g: 20.8, fat_g: 0.5, fiber_g: 6.5 } },
          { slug: 'collard-greens', name: 'Collards, cooked', source: 'usda_sr_legacy', values_license: 'us_public_domain', url: 'https://tempolife.app/calories/collard-greens', per_100g: { kcal: 33, protein_g: 2.7, carbs_g: 5.7, fat_g: 0.7, fiber_g: 4 } },
          { slug: 'okra-raw', name: 'Okra, raw', source: 'usda_sr_legacy', values_license: 'us_public_domain', url: 'https://tempolife.app/calories/okra-raw', per_100g: { kcal: 33, protein_g: 1.9, carbs_g: 7.5, fat_g: 0.2, fiber_g: 3.2 } },
          { slug: 'yam-raw', name: 'Yam, raw', source: 'usda_sr_legacy', values_license: 'us_public_domain', url: 'https://tempolife.app/calories/yam-raw', per_100g: { kcal: 118, protein_g: 1.5, carbs_g: 27.9, fat_g: 0.2, fiber_g: 4.1 } },
          { slug: 'chayote-raw', name: 'Chayote, raw', source: 'usda_sr_legacy', values_license: 'us_public_domain', url: 'https://tempolife.app/calories/chayote-raw', per_100g: { kcal: 19, protein_g: 0.8, carbs_g: 4.5, fat_g: 0.1, fiber_g: 1.7 } },
          { slug: 'zucchini-raw', name: 'Squash, summer, zucchini, includes skin, raw', source: 'usda_sr_legacy', values_license: 'us_public_domain', url: 'https://tempolife.app/calories/zucchini-raw', per_100g: { kcal: 17, protein_g: 1.2, carbs_g: 3.1, fat_g: 0.3, fiber_g: 1 } },
          { slug: 'cauliflower-raw', name: 'Cauliflower, raw', source: 'usda_sr_legacy', values_license: 'us_public_domain', url: 'https://tempolife.app/calories/cauliflower-raw', per_100g: { kcal: 25, protein_g: 1.9, carbs_g: 5, fat_g: 0.3, fiber_g: 2 } },
          { slug: 'cabbage-raw', name: 'Cabbage, raw', source: 'usda_sr_legacy', values_license: 'us_public_domain', url: 'https://tempolife.app/calories/cabbage-raw', per_100g: { kcal: 25, protein_g: 1.3, carbs_g: 5.8, fat_g: 0.1, fiber_g: 2.5 } },
          { slug: 'parsley-root-raw', name: 'Parsley root, raw', source: 'usda_sr_legacy', values_license: 'us_public_domain', url: 'https://tempolife.app/calories/parsley-root-raw', per_100g: { kcal: 55, protein_g: 2.3, carbs_g: 12.3, fat_g: 0.6, fiber_g: 4.3 } },
          { slug: 'pinto-beans-cooked', name: 'Beans, pinto, mature seeds, cooked', source: 'usda_sr_legacy', values_license: 'us_public_domain', url: 'https://tempolife.app/calories/pinto-beans-cooked', per_100g: { kcal: 143, protein_g: 9, carbs_g: 26.2, fat_g: 0.7, fiber_g: 9 } },
          { slug: 'banana-unverified', name: 'Banana curated', source: 'curated_unverified', values_license: null, per_100g: { kcal: 999, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 } },
        ],
      }),
    }));
    await expect(searchTempoLifeFoods('banana')).resolves.toEqual([expect.objectContaining({
      name: 'Banana, raw', origin: 'usda', code: 'usda-banana-raw', kcal: 89, protein: 1.1, carbs: 22.8, fat: 0.3, fiber: 2.6, sourceLicense: 'us_public_domain',
    })]);
    await expect(searchTempoLifeFoods('mandioca')).resolves.toEqual([expect.objectContaining({
      name: 'Cassava, raw', code: 'usda-cassava-raw', origin: 'usda',
    })]);
    await expect(searchTempoLifeFoods('feijão preto')).resolves.toEqual([expect.objectContaining({
      name: 'Beans, black, mature seeds, cooked', code: 'usda-black-beans-cooked',
    })]);
    await expect(searchTempoLifeFoods('feijão fradinho')).resolves.toEqual([expect.objectContaining({
      name: 'Cowpeas, common, mature seeds, cooked', code: 'usda-black-eyed-peas-cooked',
    })]);
    await expect(searchTempoLifeFoods('couve manteiga')).resolves.toEqual([expect.objectContaining({
      name: 'Collards, cooked', code: 'usda-collard-greens',
    })]);
    await expect(searchTempoLifeFoods('quiabo')).resolves.toEqual([expect.objectContaining({
      name: 'Okra, raw', code: 'usda-okra-raw',
    })]);
    await expect(searchTempoLifeFoods('inhame')).resolves.toEqual([expect.objectContaining({
      name: 'Yam, raw', code: 'usda-yam-raw',
    })]);
    await expect(searchTempoLifeFoods('chuchu')).resolves.toEqual([expect.objectContaining({
      name: 'Chayote, raw', code: 'usda-chayote-raw',
    })]);
    await expect(searchTempoLifeFoods('abobrinha')).resolves.toEqual([expect.objectContaining({
      name: 'Squash, summer, zucchini, includes skin, raw', code: 'usda-zucchini-raw',
    })]);
    await expect(searchTempoLifeFoods('couve-flor')).resolves.toEqual([expect.objectContaining({
      name: 'Cauliflower, raw', code: 'usda-cauliflower-raw',
    })]);
    await expect(searchTempoLifeFoods('repolho')).resolves.toEqual([expect.objectContaining({
      name: 'Cabbage, raw', code: 'usda-cabbage-raw',
    })]);
    await expect(searchTempoLifeFoods('mandioquinha')).resolves.toEqual([expect.objectContaining({
      name: 'Parsley root, raw', code: 'usda-parsley-root-raw',
    })]);
    await expect(searchTempoLifeFoods('feijão carioca')).resolves.toEqual([expect.objectContaining({
      name: 'Beans, pinto, mature seeds, cooked', code: 'usda-pinto-beans-cooked',
    })]);
  });
  it('converte energia em kJ para kcal quando o campo direto está ausente', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        products: [{
          product_name: 'Produto com energia em kJ',
          nutriments: { energy_100g: 418.4 },
        }],
      }),
    }));
    const results = await searchOpenFoodFacts('produto');
    expect(results[0]?.kcal).toBe(100);
  });

  it('ignora produtos sem nome ou sem energia válida', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        products: [
          { product_name: 'Sem energia', nutriments: { proteins_100g: 3 } },
          { nutriments: { 'energy-kcal_100g': 120 } },
        ],
      }),
    }));
    await expect(searchOpenFoodFacts('produto sem energia')).resolves.toEqual([]);
  });

  it('ignora calorias negativas e neutraliza macros negativos de catálogo colaborativo', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        products: [
          { product_name: 'Produto com energia inválida', nutriments: { 'energy-kcal_100g': -25 } },
          {
            product_name: 'Produto com macros inválidos',
            nutriments: {
              'energy-kcal_100g': 120,
              proteins_100g: -4,
              carbohydrates_100g: 'not-a-number',
              fat_100g: 3.26,
              fiber_100g: -0.5,
            },
          },
        ],
      }),
    }));

    await expect(searchOpenFoodFacts('produto macros invalidos')).resolves.toEqual([
      expect.objectContaining({
        name: 'Produto com macros inválidos',
        kcal: 120,
        protein: 0,
        carbs: 0,
        fat: 3.3,
        fiber: 0,
      }),
    ]);
  });

  it('preserva nutrientes adicionais e distingue valores ausentes de zero', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({
      status: 1,
      product: { product_name: 'Produto com tabela parcial', nutriments: {
        'energy-kcal_100g': 210, proteins_100g: 6, carbohydrates_100g: 24, fat_100g: 9,
        'saturated-fat_100g': 3, sugars_100g: 8, sodium_100g: 0.35,
      } },
    }) }));
    await expect(lookupBarcode('7891234567890')).resolves.toMatchObject({
      kcal: 210, protein: 6, carbs: 24, fat: 9, saturatedFat: 3, sugars: 8, sodiumMg: 350,
      reportedNutrients: { protein: true, carbs: true, fat: true, fiber: false },
    });
  });
  it('normaliza espaços e hífens no código de barras antes da consulta', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({
      status: 1,
      product: { product_name: 'Produto com código', nutriments: { 'energy-kcal_100g': 100 } },
    }) });
    vi.stubGlobal('fetch', fetchMock);
    await expect(lookupBarcode(' 789-123-456 ')).resolves.toMatchObject({ code: '789123456', name: 'Produto com código' });
    expect(fetchMock.mock.calls[0]?.[0]).toContain('/product/789123456.json');
  });

  it('não consulta a API para códigos vazios ou com caracteres inválidos', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await expect(lookupBarcode('   ')).resolves.toBeNull();
    await expect(lookupBarcode('123abc456')).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('retorna null quando o código de barras não existe', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 404, ok: false }));
    await expect(lookupBarcode('00000000')).resolves.toBeNull();
  });

  it('expõe erro controlado quando a busca externa falha', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503 }));
    await expect(searchOpenFoodFacts('produto indisponivel')).rejects.toThrow('A busca de produtos está indisponível agora.');
  });
});