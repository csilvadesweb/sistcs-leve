/**
 * Alimentos comuns no Brasil, valores APROXIMADOS por 100 g (preparo indicado no nome).
 * São referências aproximadas, inspiradas em tabelas como a TACO, digitadas à mão:
 * servem para agilizar o registro, não como fonte oficial. O app sempre deixa editar os valores.
 */
export interface FoodPer100 {
  name: string;
  brand?: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  origin: 'local' | 'off';
  code?: string;
  /** Medidas caseiras: [nome no singular, gramas]. A primeira é a padrão quando a pessoa digita só um número. */
  units?: Array<[string, number]>;
}

const L = (name: string, kcal: number, protein: number, carbs: number, fat: number, fiber: number): FoodPer100 => ({
  name, kcal, protein, carbs, fat, fiber, origin: 'local',
});

const RAW_FOODS: FoodPer100[] = [
  L('Arroz branco cozido', 128, 2.5, 28.1, 0.2, 1.6),
  L('Arroz integral cozido', 124, 2.6, 25.8, 1.0, 2.7),
  L('Feijão carioca cozido', 76, 4.8, 13.6, 0.5, 8.5),
  L('Feijão preto cozido', 77, 4.5, 14.0, 0.5, 8.4),
  L('Lentilha cozida', 93, 6.3, 16.3, 0.5, 7.9),
  L('Peito de frango grelhado', 159, 32.0, 0, 2.5, 0),
  L('Carne bovina (patinho) grelhada', 219, 35.9, 0, 7.3, 0),
  L('Carne bovina moída refogada', 212, 26.7, 0, 10.9, 0),
  L('Tilápia grelhada', 128, 26.0, 0, 2.6, 0),
  L('Ovo de galinha cozido', 146, 13.3, 0.6, 9.5, 0),
  L('Leite integral', 61, 3.2, 4.6, 3.3, 0),
  L('Leite desnatado', 35, 3.4, 4.9, 0.1, 0),
  L('Iogurte natural integral', 51, 4.1, 1.9, 3.0, 0),
  L('Queijo minas frescal', 264, 17.4, 3.2, 20.2, 0),
  L('Queijo mussarela', 330, 22.6, 3.0, 25.2, 0),
  L('Pão francês', 300, 8.0, 58.6, 3.1, 2.3),
  L('Pão de forma integral', 253, 9.4, 49.9, 3.7, 6.9),
  L('Banana prata', 98, 1.3, 26.0, 0.1, 2.0),
  L('Maçã com casca', 56, 0.3, 15.2, 0, 1.3),
  L('Laranja pera', 37, 1.0, 8.9, 0.1, 0.8),
  L('Mamão papaia', 40, 0.5, 10.4, 0.1, 1.0),
  L('Abacate', 96, 1.2, 6.0, 8.4, 6.3),
  L('Batata inglesa cozida', 52, 1.2, 11.9, 0, 1.3),
  L('Batata-doce cozida', 77, 0.6, 18.4, 0.1, 2.2),
  L('Mandioca cozida', 125, 0.6, 30.1, 0.3, 1.6),
  L('Macarrão cozido', 102, 3.4, 19.9, 0.5, 1.5),
  L('Aveia em flocos', 394, 13.9, 66.6, 8.5, 9.1),
  L('Brócolis cozido', 25, 2.1, 4.4, 0.5, 3.4),
  L('Alface', 11, 1.3, 1.7, 0.2, 1.8),
  L('Tomate', 15, 1.1, 3.1, 0.2, 1.2),
  L('Cenoura crua', 34, 1.3, 7.7, 0.2, 3.2),
  L('Azeite de oliva', 884, 0, 0, 100, 0),
  L('Manteiga', 726, 0.4, 0.1, 82.4, 0),
  L('Açúcar refinado', 387, 0.3, 99.5, 0, 0),
  L('Castanha-do-pará', 643, 14.5, 15.1, 63.5, 7.9),
  L('Ovo de galinha frito', 240, 15.6, 1.2, 18.6, 0),
  L('Pão de queijo', 363, 5.1, 34.2, 24.6, 0.6),
  L('Cuscuz de milho cozido', 113, 2.2, 25.3, 0.7, 2.1),
  L('Biscoito cream cracker', 432, 10.1, 68.7, 14.4, 2.5),
  L('Chocolate ao leite', 540, 7.2, 59.6, 30.3, 2.2),
  L('Suco de laranja', 45, 0.7, 10.4, 0.2, 0.2),
  L('Refrigerante de cola', 42, 0, 10.6, 0, 0),
  L('Pizza de mussarela', 267, 11.3, 33.5, 9.6, 2.1),
  L('Manga', 64, 0.4, 16.7, 0.2, 1.6),
  L('Melancia', 33, 0.9, 8.1, 0, 0.1),
  L('Uva', 53, 0.7, 13.6, 0.2, 0.9),
  L('Abacaxi', 48, 0.9, 12.3, 0.1, 1.0),
  L('Morango', 30, 0.9, 6.8, 0.3, 1.7),
  L('Pepino', 10, 0.9, 2.0, 0.1, 1.1),
  L('Cebola', 39, 1.7, 8.9, 0.2, 2.2),
  L('Beterraba cozida', 32, 1.3, 7.2, 0.1, 1.9),
  L('Chuchu cozido', 19, 0.4, 4.8, 0, 1.0),
];

const U = (...u: Array<[string, number]>) => u;
const UNITS: Record<string, Array<[string, number]>> = {
  'Ovo de galinha cozido': U(['ovo', 50]),
  'Ovo de galinha frito': U(['ovo', 50]),
  'Pão francês': U(['pao', 50], ['fatia', 25]),
  'Pão de forma integral': U(['fatia', 25]),
  'Pão de queijo': U(['unidade', 20]),
  'Banana prata': U(['banana', 70]),
  'Maçã com casca': U(['maca', 130]),
  'Laranja pera': U(['laranja', 140]),
  'Manga': U(['fatia', 80]),
  'Melancia': U(['fatia', 200]),
  'Mamão papaia': U(['fatia', 120]),
  'Tomate': U(['tomate', 100]),
  'Batata inglesa cozida': U(['batata', 100]),
  'Queijo mussarela': U(['fatia', 15]),
  'Queijo minas frescal': U(['fatia', 30]),
  'Leite integral': U(['copo', 200], ['xicara', 240]),
  'Leite desnatado': U(['copo', 200], ['xicara', 240]),
  'Suco de laranja': U(['copo', 200]),
  'Refrigerante de cola': U(['lata', 350], ['copo', 200]),
  'Iogurte natural integral': U(['pote', 170]),
  'Arroz branco cozido': U(['colher de sopa', 25], ['concha', 90]),
  'Arroz integral cozido': U(['colher de sopa', 25], ['concha', 90]),
  'Feijão carioca cozido': U(['concha', 100], ['colher de sopa', 25]),
  'Feijão preto cozido': U(['concha', 100], ['colher de sopa', 25]),
  'Aveia em flocos': U(['colher de sopa', 15]),
  'Azeite de oliva': U(['colher de sopa', 13], ['colher de cha', 4]),
  'Manteiga': U(['colher de cha', 5], ['colher de sopa', 15]),
  'Açúcar refinado': U(['colher de cha', 5], ['colher de sopa', 15]),
  'Castanha-do-pará': U(['unidade', 4]),
  'Biscoito cream cracker': U(['unidade', 6]),
  'Chocolate ao leite': U(['quadrado', 5]),
  'Pizza de mussarela': U(['fatia', 110]),
  'Peito de frango grelhado': U(['file', 120]),
  'Tilápia grelhada': U(['file', 120]),
  'Uva': U(['cacho', 100]),
};

export const FOODS_BR: FoodPer100[] = RAW_FOODS.map((f) => ({ ...f, units: UNITS[f.name] }));

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
const stemAll = (text: string) => normalize(text).split(/\s+/).filter(Boolean).map(stem).join(' ');

export function searchLocal(query: string, limit = 8): FoodPer100[] {
  const terms = stemAll(query).split(' ').filter(Boolean);
  if (!terms.length) return [];
  return FOODS_BR.filter((f) => {
    const n = stemAll(f.name);
    return terms.every((t) => n.includes(t));
  }).slice(0, limit);
}

/* ---------- Open Food Facts (produtos embalados, pelo navegador) ---------- */

const OFF = 'https://world.openfoodfacts.org';
const FIELDS = 'code,product_name,brands,nutriments';

function num(v: unknown): number | null {
  const n = typeof v === 'string' ? Number(v) : (v as number);
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
}
const round1 = (n: number) => Math.round(n * 10) / 10;

function fromOff(p: any): FoodPer100 | null {
  const n = p?.nutriments;
  const name = String(p?.product_name ?? '').trim();
  if (!n || !name) return null;
  const kcal = num(n['energy-kcal_100g']) ?? (num(n['energy_100g']) !== null ? num(n['energy_100g'])! / 4.184 : null);
  if (kcal === null) return null;
  return {
    name,
    brand: String(p.brands ?? '').split(',')[0]?.trim() || undefined,
    kcal: round1(kcal),
    protein: round1(num(n['proteins_100g']) ?? 0),
    carbs: round1(num(n['carbohydrates_100g']) ?? 0),
    fat: round1(num(n['fat_100g']) ?? 0),
    fiber: round1(num(n['fiber_100g']) ?? 0),
    origin: 'off',
    code: p.code ? String(p.code) : undefined,
  };
}

export async function searchOpenFoodFacts(query: string, signal?: AbortSignal): Promise<FoodPer100[]> {
  const url = `${OFF}/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=15&lc=pt&cc=br&fields=${FIELDS}`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error('A busca de produtos está indisponível agora.');
  const json = await res.json();
  return ((json.products ?? []) as any[]).map(fromOff).filter((x): x is FoodPer100 => x !== null);
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

const SHOW: Record<string, string> = { pao: 'pão', maca: 'maçã', file: 'filé', xicara: 'xícara', 'colher de cha': 'colher de chá' };
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
  if (first) return { grams: first[1], label: `1× ${show(first[0])}` };
  return { grams: 100, label: '100 g' };
}
