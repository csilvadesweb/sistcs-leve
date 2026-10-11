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
}

const L = (name: string, kcal: number, protein: number, carbs: number, fat: number, fiber: number): FoodPer100 => ({
  name, kcal, protein, carbs, fat, fiber, origin: 'local',
});

export const FOODS_BR: FoodPer100[] = [
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
];

export function normalize(text: string) {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

export function searchLocal(query: string, limit = 8): FoodPer100[] {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  return FOODS_BR.filter((f) => {
    const n = normalize(f.name);
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
