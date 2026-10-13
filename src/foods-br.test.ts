import { afterEach, describe, expect, it, vi } from 'vitest';
import { FOODS_BR, gramsFor, lookupBarcode, parseQuery, scale, searchLocal, searchOpenFoodFacts, searchOpenFoodFactsPage, searchTempoLifeFoods, type FoodPer100 } from './foods-br';

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
          { slug: 'banana-unverified', name: 'Banana curated', source: 'curated_unverified', values_license: null, per_100g: { kcal: 999, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 } },
        ],
      }),
    }));
    await expect(searchTempoLifeFoods('banana')).resolves.toEqual([expect.objectContaining({
      name: 'Banana, raw', origin: 'usda', code: 'usda-banana-raw', kcal: 89, protein: 1.1, carbs: 22.8, fat: 0.3, fiber: 2.6, sourceLicense: 'us_public_domain',
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

  it('retorna null quando o código de barras não existe', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 404, ok: false }));
    await expect(lookupBarcode('00000000')).resolves.toBeNull();
  });

  it('expõe erro controlado quando a busca externa falha', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503 }));
    await expect(searchOpenFoodFacts('produto indisponivel')).rejects.toThrow('A busca de produtos está indisponível agora.');
  });
});
