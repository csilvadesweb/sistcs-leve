/**
 * Busca de alimentos: TACO 4ª edição, referência USDA SR Legacy licenciada e Open Food Facts para produtos embalados.
 * A origem/licença dos dados externos é preservada e os valores devem ser conferidos antes de registrar.
 */
import { TACO } from './foods-taco';

export interface FoodPer100 {
  name: string;
  brand?: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  origin: 'local' | 'off' | 'estimate' | 'usda';
  sourceUrl?: string;
  sourceLicense?: string;
  code?: string;
  /** Medidas caseiras: [nome no singular, gramas]. A primeira é a padrão quando a pessoa digita só um número. */
  units?: Array<[string, number]>;
}

/**
 * Base local: TACO 4ª edição (NEPA/UNICAMP), ver foods-taco.ts. Os dois leites abaixo não têm valores
 * na TACO; usamos referências aproximadas de rótulos comuns, digitadas à mão.
 */
const EXTRA: Array<[number, string, number, number, number, number, number]> = [
  [9001, 'Leite de vaca, integral (aproximado)', 61, 3.2, 4.6, 3.3, 0],
  [9002, 'Leite de vaca, desnatado (aproximado)', 35, 3.4, 4.9, 0.1, 0],
];

const U = (...u: Array<[string, number]>) => u;
const COLHER_ARROZ = U(['colher de sopa', 25], ['concha', 90]);
const COLHER_FEIJAO = U(['concha', 100], ['colher de sopa', 25]);
const COPO = U(['copo', 200], ['xicara', 240]);
/** Medidas caseiras por código da TACO: a primeira é a padrão quando a pessoa digita só um número. */
const UNITS: Record<number, Array<[string, number]>> = {
  1: COLHER_ARROZ, 3: COLHER_ARROZ, 5: COLHER_ARROZ,
  7: U(['colher de sopa', 15]),
  13: U(['unidade', 6]),
  48: U(['fatia', 25]), 49: U(['fatia', 25]), 50: U(['fatia', 25]), 51: U(['fatia', 25]), 52: U(['fatia', 25]),
  53: U(['pao', 50], ['fatia', 25]),
  63: U(['unidade', 8]),
  88: U(['unidade', 130]), 91: U(['unidade', 100]), 93: U(['porcao', 100]),
  109: U(['unidade', 80]), 110: U(['unidade', 80]),
  140: U(['unidade', 20]), 141: U(['unidade', 20]),
  157: U(['unidade', 100]),
  163: U(['unidade', 300]),
  177: U(['banana', 70]), 178: U(['banana', 70]), 179: U(['banana', 80]), 180: U(['banana', 60]), 182: U(['banana', 70]),
  197: U(['unidade', 170]), 200: U(['unidade', 170]),
  208: U(['unidade', 140]), 214: U(['unidade', 140]), 216: U(['unidade', 140]),
  209: COPO, 215: COPO, 217: COPO,
  220: U(['unidade', 60]),
  221: U(['maca', 130]), 222: U(['maca', 130]),
  225: U(['fatia', 150]), 226: U(['fatia', 120]),
  228: U(['unidade', 250]), 229: U(['unidade', 250]), 231: U(['unidade', 250]),
  235: U(['fatia', 200]), 236: U(['fatia', 100]),
  256: U(['cacho', 100]), 257: U(['cacho', 100]),
  260: U(['colher de sopa', 13], ['colher de cha', 4]),
  261: U(['colher de cha', 5], ['colher de sopa', 15]), 262: U(['colher de cha', 5], ['colher de sopa', 15]),
  263: U(['colher de cha', 5], ['colher de sopa', 15]), 264: U(['colher de cha', 5], ['colher de sopa', 15]),
  272: U(['colher de sopa', 13]), 270: U(['colher de sopa', 13]), 269: U(['colher de sopa', 13]), 268: U(['colher de sopa', 13]),
  317: U(['file', 120]), 315: U(['file', 120]),
  346: U(['bife', 100]), 358: U(['bife', 100]), 370: U(['bife', 100]), 377: U(['bife', 100]), 383: U(['fatia', 100]), 381: U(['fatia', 100]),
  386: U(['unidade', 130]), 389: U(['unidade', 80]), 390: U(['unidade', 80]),
  398: U(['unidade', 100]), 408: U(['file', 120]), 410: U(['file', 120]), 413: U(['unidade', 100]),
  417: U(['unidade', 90]),
  438: U(['fatia', 15]), 439: U(['fatia', 15]), 424: U(['fatia', 15]), 323: U(['fatia', 15]),
  447: U(['colher de sopa', 15]),
  448: U(['pote', 170]), 449: U(['pote', 170]), 451: U(['pote', 170]), 452: U(['pote', 170]),
  453: U(['colher de sopa', 20]),
  456: U(['colher de sopa', 10]), 459: U(['colher de sopa', 10]),
  461: U(['fatia', 30]), 462: U(['fatia', 30]), 463: U(['fatia', 15]), 467: U(['fatia', 15]),
  468: U(['colher de sopa', 30]),
  480: U(['lata', 350], ['copo', 200]), 481: U(['lata', 350], ['copo', 200]), 482: U(['lata', 350], ['copo', 200]), 483: U(['lata', 350], ['copo', 200]),
  488: U(['ovo', 50]), 489: U(['ovo', 50]), 490: U(['ovo', 50]), 485: U(['ovo', 10]),
  484: U(['unidade', 100]),
  491: U(['colher de sopa', 15]),
  492: U(['colher de cha', 5], ['colher de sopa', 15]), 493: U(['colher de cha', 5], ['colher de sopa', 15]), 494: U(['colher de cha', 5], ['colher de sopa', 15]),
  495: U(['quadrado', 5]),
  507: U(['colher de sopa', 20]),
  524: U(['colher de sopa', 15]),
  533: U(['fatia', 100]),
  557: U(['colher de sopa', 15]),
  561: COLHER_FEIJAO, 567: COLHER_FEIJAO, 563: COLHER_FEIJAO, 565: COLHER_FEIJAO, 569: COLHER_FEIJAO, 571: COLHER_FEIJAO, 573: COLHER_FEIJAO,
  577: U(['colher de sopa', 25]),
  589: U(['unidade', 4]), 588: U(['unidade', 3]), 587: U(['unidade', 2]),
};
UNITS[9001] = COPO;
UNITS[9002] = COPO;

/** Alimentos do dia a dia que aparecem primeiro nos resultados. */
const PRIORITY = new Set([
  3, 1, 561, 567, 488, 490, 53, 52, 182, 214, 226, 221, 235, 229, 239, 164, 163, 257,
  410, 377, 358, 317, 408, 9001, 9002, 448, 461, 463, 91, 88, 129, 78, 157, 110, 100, 577,
  7, 260, 262, 494, 589, 480, 495, 13, 140, 533, 495, 386, 468, 453,
]);
const PRIORITY_ORDER = [...PRIORITY];

export const FOODS_BR: FoodPer100[] = [
  ...[...TACO, ...EXTRA].map(([id, name, kcal, protein, carbs, fat, fiber]) => ({
  name,
  kcal,
  protein,
  carbs,
  fat,
  fiber,
  origin: 'local' as const,
  code: `taco-${id}`,
  units: UNITS[id],
  })),
  {
  // Estimativa genérica de receita caseira; não é um valor oficial da TACO nem substitui rótulo/receita específica.
  name: 'Strogonoff de carne bovina (estimativa caseira)',
  kcal: 170,
  protein: 12,
  carbs: 5,
  fat: 12,
  fiber: 0,
  origin: 'estimate',
  code: 'recipe-strogonoff-carne',
  units: [['porção', 150]],
}];

const RANK = new Map<string, number>(
  [...TACO, ...EXTRA].map(([id], i) => [`taco-${id}`, PRIORITY_ORDER.includes(id) ? PRIORITY_ORDER.indexOf(id) - 1000 : i]),
);

export function normalize(text: string) {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

/** Singular simples para casar "ovos" com "ovo", "pães" com "pão", "colheres" com "colher". */
export function stem(word: string) {
  const w = normalize(word);
  if (w.endsWith('aes')) return `${w.slice(0, -3)}ao`;
  if (w.endsWith('oes')) return `${w.slice(0, -3)}ao`;
  if (w.length > 3 && w.endsWith('res')) return w.slice(0, -2);
  if (w.length > 3 && w.endsWith('s')) return w.slice(0, -1);
  return w;
}
const stemAll = (text: string) => normalize(text).replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean).map(stem).join(' ');

const STOPWORDS = new Set(['de', 'da', 'do', 'com', 'e', 'em', 'a', 'o']);
const ALIASES: Record<string, string> = {
  mucarela: 'mussarela', mozarela: 'mussarela', muzzarela: 'mussarela', mingnon: 'mignon',
  coca: 'refrigerante cola', pepsi: 'refrigerante cola', guarana: 'refrigerante guarana',
  frango: 'frango', bolacha: 'biscoito', macaxeira: 'mandioca', aipim: 'mandioca', pao: 'pao',
};

export function searchLocal(query: string, limit = 8): FoodPer100[] {
  const terms = stemAll(query)
    .split(' ')
    .filter((t) => t && !STOPWORDS.has(t))
    .flatMap((t) => (ALIASES[t] ?? t).split(' '));
  if (!terms.length) return [];
  const hits = FOODS_BR.filter((f) => {
    const words = stemAll(f.name).split(' ');
    return terms.every((t, i) =>
      words.some((w) => w === t || (w.startsWith(t) && ((i === terms.length - 1 && t.length >= 3) || w.length - t.length <= 2))),
    );
  });
  const score = (f: FoodPer100) => {
    const rank = RANK.get(f.code ?? '') ?? 5000;
    const words = f.name.split(',').length;
    const raw = /\b(cru|crua|crus|cruas)\b/i.test(f.name) ? 3 : 0;
    return rank < 0 ? rank : words + raw + rank / 10000;
  };
  return hits.sort((a, b) => score(a) - score(b)).slice(0, limit);
}

/* ---------- Referências genéricas USDA via TempoLife (somente linhas licenciadas) ---------- */

type TempoLifeRow = {
  slug?: unknown;
  name?: unknown;
  source?: unknown;
  values_license?: unknown;
  url?: unknown;
  per_100g?: { kcal?: unknown; protein_g?: unknown; carbs_g?: unknown; fat_g?: unknown; fiber_g?: unknown };
};
let tempoFoodsPromise: Promise<FoodPer100[]> | null = null;
let tempoFoodsExpiresAt = 0;
const TEMPO_FOODS_TTL_MS = 24 * 60 * 60 * 1000;
const TEMPO_FOODS_URL = 'https://tempolife.app/datasets/foods.json';

const TEMPO_QUERY_ALIASES: Record<string, string> = {
  'arroz integral': 'brown rice', 'arroz branco': 'white rice', arroz: 'rice',
  'carne moida': 'ground beef', 'carne bovina': 'beef', carne: 'beef',
  'peito de frango': 'chicken breast', frango: 'chicken',
  'leite integral': 'whole milk', 'leite desnatado': 'skim milk', leite: 'milk',
  'batata doce': 'sweet potato', batata: 'potato',
  feijao: 'beans', ovo: 'egg', ovos: 'eggs', pao: 'bread', 'pao integral': 'whole wheat bread',
  maca: 'apple', banana: 'banana', tomate: 'tomato', cebola: 'onion', cenoura: 'carrot',
  brocolis: 'broccoli', aveia: 'oats', macarrao: 'pasta', queijo: 'cheese', iogurte: 'yogurt',
  azeite: 'olive oil', cafe: 'coffee', acucar: 'sugar', mel: 'honey', milho: 'corn',
  morango: 'strawberry', abacate: 'avocado', manga: 'mango', salmao: 'salmon', atum: 'tuna',
  peixe: 'fish', amendoim: 'peanuts', castanha: 'nuts', farinha: 'flour',
};

function tempoQuery(query: string): string {
  const normalized = normalize(query).replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  if (TEMPO_QUERY_ALIASES[normalized]) return TEMPO_QUERY_ALIASES[normalized]!;
  return normalized.split(' ').map((word) => TEMPO_QUERY_ALIASES[word] ?? word).join(' ');
}

async function loadTempoFoods(): Promise<FoodPer100[]> {
  if (tempoFoodsPromise && tempoFoodsExpiresAt > Date.now()) return tempoFoodsPromise;
  tempoFoodsExpiresAt = Date.now() + TEMPO_FOODS_TTL_MS;
  tempoFoodsPromise = fetch(TEMPO_FOODS_URL, { headers: { Accept: 'application/json' } }).then(async (res) => {
    if (!res.ok) throw new Error('A base internacional de alimentos está indisponível.');
    const json = await res.json();
    const rows = Array.isArray(json.foods) ? json.foods as TempoLifeRow[] : [];
    return rows.flatMap((row): FoodPer100[] => {
      // Não usar linhas sem licença explícita: a base de origem mistura registros de licenças diferentes.
      if (row.source !== 'usda_sr_legacy' || row.values_license !== 'us_public_domain') return [];
      const name = typeof row.name === 'string' ? row.name.trim() : '';
      const slug = typeof row.slug === 'string' ? row.slug : '';
      const n = row.per_100g;
      const kcal = num(n?.kcal);
      if (!name || !slug || !n || kcal === null || kcal < 0) return [];
      return [{
        name, kcal: round1(kcal), protein: nonNegativeNutrient(n.protein_g),
        carbs: nonNegativeNutrient(n.carbs_g), fat: nonNegativeNutrient(n.fat_g),
        fiber: nonNegativeNutrient(n.fiber_g), origin: 'usda', code: `usda-${slug}`,
        sourceUrl: typeof row.url === 'string' ? row.url : 'https://tempolife.app/',
        sourceLicense: 'us_public_domain',
      }];
    });
  }).catch((error) => {
    tempoFoodsPromise = null;
    tempoFoodsExpiresAt = 0;
    throw error;
  });
  return tempoFoodsPromise;
}

/** Busca alimentos genéricos de referência; usa apenas valores USDA com licença pública explícita. */
export async function searchTempoLifeFoods(query: string, limit = 20): Promise<FoodPer100[]> {
  const translated = tempoQuery(query);
  const terms = stemAll(translated).split(' ').filter((term) => term && !STOPWORDS.has(term));
  if (terms.length === 0) return [];
  const foods = await loadTempoFoods();
  return foods.filter((food) => {
    const words = stemAll(`${food.name} ${food.code ?? ''}`).split(' ');
    return terms.every((term) => words.some((word) => word === term || word.startsWith(term)));
  }).slice(0, Math.max(1, Math.min(50, limit))).map((food) => ({ ...food }));
}
/* ---------- Open Food Facts (produtos embalados, pelo navegador) ---------- */

const OFF = 'https://world.openfoodfacts.org';
const FIELDS = 'code,product_name,brands,nutriments';

function num(v: unknown): number | null {
  const n = typeof v === 'string' ? Number(v) : (v as number);
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
}
const round1 = (n: number) => Math.round(n * 10) / 10;

function nonNegativeNutrient(value: unknown): number {
  const parsed = num(value);
  // Catálogos colaborativos podem conter valores negativos inválidos; nunca os propagamos ao diário.
  return parsed === null || parsed < 0 ? 0 : round1(parsed);
}

function fromOff(p: any): FoodPer100 | null {
  const n = p?.nutriments;
  const name = String(p?.product_name ?? '').trim();
  if (!n || !name) return null;
  const directKcal = num(n['energy-kcal_100g']);
  const energyKj = num(n['energy_100g']);
  const kcal = directKcal !== null ? directKcal : energyKj !== null ? energyKj / 4.184 : null;
  if (kcal === null || kcal < 0) return null;
  return {
    name,
    brand: String(p.brands ?? '').split(',')[0]?.trim() || undefined,
    kcal: round1(kcal),
    protein: nonNegativeNutrient(n['proteins_100g']),
    carbs: nonNegativeNutrient(n['carbohydrates_100g']),
    fat: nonNegativeNutrient(n['fat_100g']),
    fiber: nonNegativeNutrient(n['fiber_100g']),
    origin: 'off',
    code: p.code ? String(p.code) : undefined,
  };
}

// Cache apenas em memória: reduz chamadas repetidas à API pública sem persistir dados pessoais.
const OFF_SEARCH_CACHE = new Map<string, { expiresAt: number; result: { foods: FoodPer100[]; hasMore: boolean } }>();
const OFF_SEARCH_CACHE_TTL_MS = 10 * 60 * 1000;
const OFF_SEARCH_CACHE_MAX = 20;

export async function searchOpenFoodFactsPage(query: string, page = 1, signal?: AbortSignal): Promise<{ foods: FoodPer100[]; hasMore: boolean }> {
  const normalizedQuery = normalize(query);
  const safePage = Number.isInteger(page) && page > 0 ? page : 1;
  if (!normalizedQuery || signal?.aborted) return { foods: [], hasMore: false };
  const cacheKey = `${normalizedQuery}|${safePage}`;
  const cached = OFF_SEARCH_CACHE.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return { foods: cached.result.foods.map((food) => ({ ...food })), hasMore: cached.result.hasMore };
  }
  if (cached) OFF_SEARCH_CACHE.delete(cacheKey);

  const url = `${OFF}/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page=${safePage}&page_size=30&lc=pt&cc=br&fields=${FIELDS}`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error('A busca de produtos está indisponível agora.');
  const json = await res.json();
  const products = (json.products ?? []) as any[];
  const foods = products.map(fromOff).filter((x): x is FoodPer100 => x !== null);
  const total = num(json.count);
  const returnedPage = num(json.page) ?? safePage;
  const pageSize = num(json.page_size) ?? 30;
  const hasMore = total !== null ? returnedPage * pageSize < total : products.length >= pageSize;
  if (signal?.aborted) return { foods: [], hasMore: false };

  const result = { foods, hasMore };
  OFF_SEARCH_CACHE.set(cacheKey, { expiresAt: Date.now() + OFF_SEARCH_CACHE_TTL_MS, result });
  while (OFF_SEARCH_CACHE.size > OFF_SEARCH_CACHE_MAX) {
    const oldestKey = OFF_SEARCH_CACHE.keys().next().value;
    if (oldestKey === undefined) break;
    OFF_SEARCH_CACHE.delete(oldestKey);
  }
  return { foods: foods.map((food) => ({ ...food })), hasMore };
}

/** Compatibilidade com chamadas existentes: primeira página de produtos. */
export async function searchOpenFoodFacts(query: string, signal?: AbortSignal): Promise<FoodPer100[]> {
  return (await searchOpenFoodFactsPage(query, 1, signal)).foods;
}
export async function lookupBarcode(code: string, signal?: AbortSignal): Promise<FoodPer100 | null> {
  const res = await fetch(`${OFF}/api/v2/product/${encodeURIComponent(code)}.json?fields=${FIELDS}`, { signal });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('A consulta de código de barras está indisponível agora.');
  const json = await res.json();
  return json.status === 1 ? fromOff({ ...json.product, code }) : null;
}

export function scale(f: FoodPer100, grams: number) {
  const k = grams / 100;
  return {
    calories: round1(f.kcal * k),
    proteins: round1(f.protein * k),
    carbohydrates: round1(f.carbs * k),
    fats: round1(f.fat * k),
    fiber: round1(f.fiber * k),
  };
}


/* ---------- Texto livre: "2 ovos", "150 g de arroz", "1 colher de sopa de azeite" ---------- */

const WEIGHT_UNITS: Record<string, number> = { g: 1, gr: 1, grama: 1, kg: 1000, quilo: 1000, ml: 1, l: 1000, litro: 1000 };
const HOME_UNITS: Record<string, number> = { 'colher de sopa': 15, 'colher de cha': 5, xicara: 240, copo: 200, concha: 100, fatia: 30, pote: 170, lata: 350, unidade: 0, un: 0 };

export interface ParsedQuery {
  name: string;
  amount: number | null;
  unit: string | null;
}

const NUM = /^(\d+(?:[.,]\d+)?)([a-z]*)$/;

export function parseQuery(raw: string): ParsedQuery {
  const tokens = normalize(raw).split(/\s+/).filter(Boolean);
  const toNum = (t: string) => Number(t.replace(',', '.'));
  const isUnit = (t: string) => stem(t) in WEIGHT_UNITS || stem(t) in HOME_UNITS || stem(t) === 'colher';
  const takeUnit = (rest: string[]): [string | null, number] => {
    if (!rest.length) return [null, 0];
    if (stem(rest[0]!) === 'colher') {
      const kind = rest[1] === 'de' && rest[2] ? stem(rest[2]) : '';
      if (kind === 'sopa' || kind === 'cha') return [`colher de ${kind}`, 3];
      return ['colher de sopa', 1];
    }
    if (isUnit(rest[0]!)) return [stem(rest[0]!), 1];
    return [null, 0];
  };

  // Número no começo: "2 ovos", "150g arroz", "1 colher de sopa de azeite"
  const lead = tokens[0] ? NUM.exec(tokens[0]) : null;
  if (lead) {
    let unit: string | null = lead[2] ? stem(lead[2]) : null;
    let used = 1;
    if (!unit) {
      const [u, n] = takeUnit(tokens.slice(1));
      unit = u;
      used += n;
    } else if (!(unit in WEIGHT_UNITS) && !(unit in HOME_UNITS)) {
      return { name: tokens.slice(0).join(' '), amount: null, unit: null };
    }
    let rest = tokens.slice(used);
    if (rest[0] === 'de' || rest[0] === 'do' || rest[0] === 'da') rest = rest.slice(1);
    return { name: rest.join(' '), amount: toNum(lead[1]!), unit };
  }
  // Número no fim: "arroz 150", "arroz 150g", "arroz 150 g"
  for (const span of [2, 1]) {
    const tail = tokens.slice(-span);
    const m = tail[0] ? NUM.exec(tail[0]) : null;
    if (!m || tokens.length <= span) continue;
    const unit = span === 2 ? stem(tail[1]!) : m[2] ? stem(m[2]) : null;
    if (span === 2 && !(unit! in WEIGHT_UNITS || unit! in HOME_UNITS)) continue;
    if (span === 1 && unit && !(unit in WEIGHT_UNITS || unit in HOME_UNITS)) continue;
    return { name: tokens.slice(0, -span).join(' '), amount: toNum(m[1]!), unit };
  }
  return { name: tokens.join(' '), amount: null, unit: null };
}

const SHOW: Record<string, string> = { porcao: 'porção', pao: 'pão', maca: 'maçã', file: 'filé', xicara: 'xícara', 'colher de cha': 'colher de chá' };
const show = (u: string) => SHOW[u] ?? u;

/** Converte o que a pessoa digitou em gramas para o alimento escolhido. */
export function gramsFor(food: FoodPer100, q: ParsedQuery): { grams: number; label: string } {
  const first = food.units?.[0];
  const find = (u: string) => food.units?.find(([k]) => stem(k) === stem(u) || stemAll(k) === stemAll(u));
  const count = q.amount ?? 1;
  if (q.unit && q.unit in WEIGHT_UNITS) {
    const g = count * WEIGHT_UNITS[q.unit]!;
    return { grams: g, label: `${round1(count)} ${q.unit}` };
  }
  if (q.unit) {
    const own = find(q.unit);
    const g = own ? own[1] : HOME_UNITS[q.unit] || (first ? first[1] : 0);
    if (g) return { grams: count * g, label: `${round1(count)}× ${show(q.unit)}` };
  }
  if (q.amount !== null && !q.unit) {
    if (first) return { grams: count * first[1], label: `${round1(count)}× ${show(first[0])}` };
    return { grams: q.amount, label: `${round1(q.amount)} g` };
  }
  if (first && first[1] >= 50) return { grams: first[1], label: `1× ${show(first[0])}` };
  return { grams: 100, label: '100 g' };
}
