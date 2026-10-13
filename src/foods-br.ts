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
  /** Base nutricional usada pelo rótulo: 100 g para sólidos ou 100 ml para bebidas. */
  basis?: '100g' | '100ml';
  /** Nutrientes adicionais do rótulo; ausente significa que a fonte não informou o valor. */
  saturatedFat?: number;
  sugars?: number;
  sodiumMg?: number;
  reportedNutrients?: { protein: boolean; carbs: boolean; fat: boolean; fiber: boolean };
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
  // Frutas: medidas por unidade aproximada da parte comestível; o peso varia com o tamanho.
  163: U(['unidade', 200], ['fatia', 50]), // abacate
  164: U(['fatia', 80]), 165: U(['porção', 100]),
  166: U(['unidade', 100]), 169: U(['unidade', 12]), 170: U(['porção', 100]),
  171: U(['unidade', 60]), 172: U(['unidade', 65]), 173: U(['unidade', 60]),
  177: U(['banana', 70]), 178: U(['banana', 70]), 179: U(['banana', 80]), 180: U(['banana', 60]), 181: U(['banana', 80]), 182: U(['banana', 70]),
  184: U(['unidade', 100]), 189: U(['unidade', 100]), 190: U(['unidade', 90]),
  194: U(['unidade', 50]), 195: U(['unidade', 50]), 196: U(['fatia', 80]),
  197: U(['unidade', 170]), 200: U(['unidade', 170]),
  204: U(['bagos', 20]), 206: U(['unidade', 5]), 207: U(['unidade', 75]),
  208: U(['unidade', 140]), 210: U(['unidade', 130]), 212: U(['unidade', 130]), 214: U(['unidade', 140]), 216: U(['unidade', 140]),
  220: U(['unidade', 60]), 221: U(['maçã', 130]), 222: U(['maçã', 130]),
  223: U(['porção', 30]), 225: U(['fatia', 150]), 226: U(['unidade', 300]),
  228: U(['unidade', 200]), 229: U(['unidade', 200]), 231: U(['unidade', 200]),
  232: U(['unidade', 50]), 233: U(['porção', 100]), 234: U(['copo', 200]),
  235: U(['fatia', 200]), 236: U(['fatia', 100]), 239: U(['unidade', 12]),
  240: U(['unidade', 30]), 244: U(['unidade', 100]), 245: U(['unidade', 100]),
  247: U(['unidade', 10]), 248: U(['porção', 100]), 251: U(['unidade', 90]), 252: U(['copo', 200]),
  256: U(['cacho pequeno', 100]), 257: U(['cacho pequeno', 100]), 258: U(['copo', 200]),
  478: U(['copo', 200]), 590: U(['fatia', 40]),
  209: COPO, 215: COPO, 217: COPO,
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

/** Estimativas caseiras adicionais, não transcrições verificadas da TBCA/USP. Valores por 100 g; receitas variam conforme preparo. */
const BRAZILIAN_ESTIMATES: FoodPer100[] = [
  { name: 'Pão de queijo, assado (estimativa)', kcal: 330, protein: 6, carbs: 35, fat: 18, fiber: 1, origin: 'estimate', code: 'estimate-br-pao-de-queijo', units: [['unidade pequena', 25], ['porção (2 unidades)', 50]] },
  { name: 'Feijoada (estimativa caseira)', kcal: 150, protein: 10, carbs: 12, fat: 7, fiber: 5, origin: 'estimate', code: 'estimate-br-feijoada', units: [['concha', 150], ['porção', 150]] },
  { name: 'Brigadeiro caseiro (estimativa)', kcal: 390, protein: 5, carbs: 60, fat: 14, fiber: 1, origin: 'estimate', code: 'estimate-br-brigadeiro', units: [['unidade', 25], ['porção (4 unidades pequenas)', 100]] },
  { name: 'Tapioca sem recheio (estimativa)', kcal: 230, protein: 0.2, carbs: 57, fat: 0.1, fiber: 0.2, origin: 'estimate', code: 'estimate-br-tapioca', units: [['unidade média', 60]] },
  { name: 'Cuscuz de tapioca com coco (estimativa)', kcal: 240, protein: 2, carbs: 45, fat: 6, fiber: 2, origin: 'estimate', code: 'estimate-br-cuscuz-tapioca', units: [['pedaço médio', 70]] },
  { name: 'Moqueca de peixe (estimativa caseira)', kcal: 140, protein: 14, carbs: 4, fat: 8, fiber: 1, origin: 'estimate', code: 'estimate-br-moqueca-peixe', units: [['concha cheia', 150], ['porção', 150]] },
  { name: 'Esfiha assada (estimativa)', kcal: 270, protein: 10, carbs: 35, fat: 9, fiber: 2, origin: 'estimate', code: 'estimate-br-esfiha', units: [['unidade média', 70]] },
  { name: 'Bolo de cenoura simples (estimativa caseira)', kcal: 350, protein: 5, carbs: 55, fat: 12, fiber: 1, origin: 'estimate', code: 'estimate-br-bolo-cenoura', units: [['fatia média', 50]] },
  { name: 'Bolo de cenoura com cobertura de chocolate (estimativa)', kcal: 380, protein: 5, carbs: 58, fat: 14, fiber: 2, origin: 'estimate', code: 'estimate-br-bolo-cenoura-chocolate', units: [['fatia média', 50]] },
  { name: 'Pamonha de milho com coco (estimativa caseira)', kcal: 220, protein: 3, carbs: 40, fat: 6, fiber: 3, origin: 'estimate', code: 'estimate-br-pamonha-coco', units: [['unidade média', 100]] },
  { name: 'Coxinha de frango frita (estimativa)', kcal: 290, protein: 9, carbs: 35, fat: 12, fiber: 2, origin: 'estimate', code: 'estimate-br-coxinha-frango', units: [['unidade média', 50], ['porção (2 unidades)', 100]] },
  { name: 'Pastel frito (estimativa caseira)', kcal: 380, protein: 8, carbs: 40, fat: 20, fiber: 1, origin: 'estimate', code: 'estimate-br-pastel-frito', units: [['unidade média', 50]] },
];

export const FOODS_BR: FoodPer100[] = [
  ...BRAZILIAN_ESTIMATES,
  ...[...TACO, ...EXTRA].map(([id, name, kcal, protein, carbs, fat, fiber]) => ({
  name,
  kcal,
  protein,
  carbs,
  fat,
  fiber,
  origin: id >= 9000 ? 'estimate' as const : 'local' as const,
  code: id >= 9000 ? `estimate-extra-${id}` : `taco-${id}`,
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
  [...TACO, ...EXTRA].map(([id], i) => [id >= 9000 ? `estimate-extra-${id}` : `taco-${id}`, PRIORITY_ORDER.includes(id) ? PRIORITY_ORDER.indexOf(id) - 1000 : i]),
);

export function normalize(text: string) {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

/** Medidas caseiras aproximadas para frutas de bases externas que não trazem unidades. */
export function householdUnitsForFood(food: FoodPer100): Array<[string, number]> {
  if (food.units?.length) return food.units;
  const name = normalize(food.name);
  // Frutas frescas e secas.
  if (/ameixa.*(seca|desidratada)|prune|dried plum/.test(name)) return [['unidade', 9.5], ['porção (5 unidades)', 47.5]];
  if (/damasco.*(seco|desidratado)|dried apricot/.test(name)) return [['unidade', 8]];
  if (/tâmara|tamara|date, dried|dried date/.test(name)) return [['unidade', 8]];
  if (/figo.*(seco|desidratado)|dried fig/.test(name)) return [['unidade', 20]];
  if (/banana/.test(name)) return [['unidade', 80]];
  if (/(maçã|maca|apple)(?!.*(suco|juice|néctar|nectar))/.test(name)) return [['unidade', 180]];
  if (/(pera|pear)(?!.*(suco|juice|néctar|nectar))/.test(name)) return [['unidade', 170]];
  if (/(laranja|orange)(?!.*(suco|juice|refrigerante|soda))/.test(name)) return [['unidade', 130]];
  if (/tangerina|mexerica|mandarin|clementine/.test(name)) return [['unidade', 80]];
  if (/kiwi/.test(name)) return [['unidade', 75]];
  if (/morango|strawberr/.test(name)) return [['unidade', 12], ['porção (10 unidades)', 120]];
  if (/(uva|grape)(?!.*(suco|juice|vinho|wine|passa|raisin))/.test(name)) return [['unidade', 5], ['cacho pequeno', 100]];
  if (/abacate|avocado/.test(name)) return [['unidade', 200], ['fatia', 50]];
  if (/abacaxi|pineapple/.test(name)) return [['fatia', 80], ['porção', 100]];
  if (/mam[aã]o|papaya/.test(name)) return [['fatia', 150], ['unidade pequena', 300]];
  if (/manga|mango/.test(name)) return [['unidade', 200], ['fatia', 40]];
  if (/melancia|watermelon/.test(name)) return [['fatia', 200]];
  if (/mel[aã]o|cantaloupe|honeydew/.test(name)) return [['fatia', 100]];
  if (/p[eê]ssego|peach|nectarine/.test(name)) return [['unidade', 150]];
  if (/ameixa|plum/.test(name)) return [['unidade', 65]];
  if (/goiaba|guava/.test(name)) return [['unidade', 170]];
  if (/cereja|cherr/.test(name)) return [['unidade', 8]];
  if (/framboesa|raspberr|amora|blackberr|blueberr|mirtilo/.test(name)) return [['unidade', 3], ['porção', 100]];
  // Outros alimentos normalmente contados por unidade ou por embalagem individual.
  if (/ovo(?!.*(pó|po|líquido|liquido))|egg/.test(name)) return [['unidade', 50]];
  if (/p[aã]o franc[eê]s|bread roll|roll, bread/.test(name)) return [['unidade', 50]];
  if (/torrada|toast/.test(name)) return [['unidade', 10]];
  if (/fatia de pão|p[aã]o de forma|sliced bread|white bread|whole wheat bread/.test(name)) return [['fatia', 25]];
  if (/biscoito|bolacha|cookie|cracker/.test(name)) return [['unidade', 10], ['porção (5 unidades)', 50]];
  if (/barra de cereal|cereal bar|protein bar/.test(name)) return [['unidade', 25]];
  if (/quadrado de chocolate|chocolate.*(quadrado|square)/.test(name)) return [['quadrado', 5]];
  if (/iogurte|yogurt/.test(name)) return [['pote', 170]];
  if (/queijo.*(fatia|slice)|slice.*cheese/.test(name)) return [['fatia', 20]];
  if (/presunto|mortadela|peito de peru|ham|deli turkey|bologna/.test(name)) return [['fatia', 15]];
  if (/salsicha|hot dog sausage|sausage/.test(name)) return [['unidade', 50]];
  if (/hamb[uú]rguer|hamburger patty|meatball|alm[oô]ndega/.test(name)) return [['unidade', 100]];
  if (/pizza/.test(name)) return [['fatia', 100]];
  if (/castanha|am[eê]ndoa|noz|amendoim|nut|almond|walnut|peanut/.test(name)) return [['porção (um punhado)', 30]];
  if (/lata|canned/.test(name) && /atum|sardinha|milho|ervilha|tuna|sardine|corn|peas/.test(name)) return [['lata drenada (aprox.)', 120]];
  // Medidas de alimentos básicos para resultados internacionais que não incluem porções.
  // São aproximações domésticas; o peso real varia com o utensílio, compactação e preparo.
  if (/flour|farinha|starch|amido|fuba|cornmeal|sugar|a[cç][uú]car|\bsalt\b|\bsal\b/.test(name)) return [['colher de sopa rasa', 12], ['xícara', 120], ['porção', 10]];
  if (/rice|arroz/.test(name)) return [['colher de sopa cheia', 25], ['xícara cozida', 160], ['porção', 100]];
  if (/beans|feij[aã]o|lentil|lentilha|chickpea|gr[aã]o de bico|pea soup/.test(name)) return [['concha média', 100], ['colher de sopa', 25], ['porção', 100]];
  if (/pasta|macarr[aã]o|spaghetti|noodle/.test(name)) return [['pegador (cozido)', 80], ['xícara cozida', 140], ['porção', 100]];
  if (/oatmeal|aveia|porridge|granola|cereal/.test(name)) return [['colher de sopa', 10], ['xícara', 80], ['porção', 30]];

  if (/olive oil|vegetable oil|azeite|oil,/.test(name)) return [['colher de chá', 5], ['colher de sopa', 13]];
  if (/milk|leite|juice|suco|water|[aá]gua|coffee|caf[eé]|tea,|ch[aá]/.test(name)) return [['copo', 200], ['xícara', 240], ['colher de sopa', 15]];
  if (/potato|batata|sweet potato|mandioca|cassava|yam|inhame/.test(name)) return [['unidade média', 130], ['colher de sopa (amassado)', 25], ['porção', 100]];
  if (/chicken|frango|beef|carne|pork|porco|fish|peixe|salmon|salm[aã]o|tuna|atum/.test(name)) return [['filé médio', 120], ['porção', 100]];
  if (/lettuce|alface|spinach|espinafre|couve|greens|broccoli|br[oó]colis/.test(name)) return [['xícara picada', 35], ['porção', 50]];
  if (/tomato|tomate|onion|cebola|carrot|cenoura|cucumber|pepino/.test(name)) return [['unidade média', 100], ['porção', 50]];
  return [];
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
  // A TACO usa o nome oficial “Castanha-do-Brasil”; aceitar também o nome popular.
  const searchableQuery = normalize(query)
    .replace(/castanha[ -]+do[ -]+par[aá]/g, 'castanha do brasil')
    .replace(/\bpao de sal\b/g, 'pao frances')
    .replace(/\bpao cacetinho\b/g, 'pao frances')
    .replace(/\bbatata salsa\b/g, 'batata baroa')
    .replace(/\bmandioquinha\b/g, 'batata baroa')
    .replace(/\bfeijao de corda\b/g, 'feijao fradinho')
    .replace(/\bfeijao macassa\b/g, 'feijao fradinho')
    .replace(/\bjerimum\b/g, 'abobora')
    .replace(/\bbergamota\b/g, 'tangerina')
    .replace(/\bmexerica\b/g, 'tangerina');
  const terms = stemAll(searchableQuery)
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
  return hits.sort((a, b) => score(a) - score(b)).slice(0, limit).map((food) =>
    food.code === 'taco-589' ? { ...food, name: 'Castanha-do-Pará (Castanha-do-Brasil), crua' } : food,
  );
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
  'leite integral': 'whole milk', 'leite desnatado': 'skim milk', 'leite em po': 'powdered milk', leite: 'milk',
  'batata doce': 'sweet potato', batata: 'potato',
  'batata baroa': 'parsley root', mandioquinha: 'parsley root', 'batata salsa': 'parsley root',
  inhame: 'yam', cara: 'yam', chuchu: 'chayote', abobrinha: 'zucchini',
  'couve flor': 'cauliflower', repolho: 'cabbage', beterraba: 'beet', pimentao: 'bell pepper',
  salsinha: 'parsley', coentro: 'cilantro', manjericao: 'basil',
  'feijao preto': 'black beans', 'feijao fradinho': 'black-eyed peas',
  'feijao carioca': 'pinto beans', 'feijao vermelho': 'kidney beans',
  'feijao branco': 'white beans', feijao: 'beans',
  'farinha de mandioca': 'cassava flour', mandioca: 'cassava', macaxeira: 'cassava', aipim: 'cassava',
  'polvilho doce': 'tapioca starch', polvilho: 'tapioca starch', tapioca: 'tapioca',
  'fuba': 'cornmeal', 'farinha de milho': 'cornmeal',
  'couve manteiga': 'collard greens', couve: 'collard greens', quiabo: 'okra',
  ovo: 'egg', ovos: 'eggs', pao: 'bread', 'pao integral': 'whole wheat bread',
  maca: 'apple', banana: 'banana', mamao: 'papaya', melancia: 'watermelon', melao: 'melon',
  laranja: 'orange', limao: 'lemon', tomate: 'tomato', cebola: 'onion', cenoura: 'carrot',
  brocolis: 'broccoli', aveia: 'oats', macarrao: 'pasta', queijo: 'cheese', iogurte: 'yogurt',
  azeite: 'olive oil', cafe: 'coffee', acucar: 'sugar', mel: 'honey', milho: 'corn',
  morango: 'strawberry', abacate: 'avocado', manga: 'mango', salmao: 'salmon', atum: 'tuna',
  tilapia: 'tilapia', camarao: 'shrimp', sardinha: 'sardines', porco: 'pork',
  'carne suina': 'pork', 'acucar mascavo': 'brown sugar', 'farinha de trigo': 'wheat flour',
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
function optionalNutrient(value: unknown): number | undefined {
  const parsed = num(value);
  return parsed === null || parsed < 0 ? undefined : round1(parsed);
}

function nonNegativeNutrient(value: unknown): number {
  const parsed = num(value);
  // Catálogos colaborativos podem conter valores negativos inválidos; nunca os propagamos ao diário.
  return parsed === null || parsed < 0 ? 0 : round1(parsed);
}

function fromOff(p: any): FoodPer100 | null {
  const n = p?.nutriments;
  const name = String(p?.product_name ?? '').trim();
  if (!n || !name) return null;

  // Muitos rótulos de bebidas informam nutrientes por 100 ml, não por 100 g.
  // Aceitamos essa base somente quando a energia por 100 g não foi informada,
  // preservando a unidade original para não descartar refrigerantes, sucos e leites.
  const kcal100g = num(n['energy-kcal_100g']);
  const kj100g = num(n['energy_100g']);
  const kcal100ml = num(n['energy-kcal_100ml']);
  const kj100ml = num(n['energy_100ml']);
  const useMl = (kcal100g === null && kj100g === null) && (kcal100ml !== null || kj100ml !== null);
  const directKcal = useMl ? kcal100ml : kcal100g;
  const energyKj = useMl ? kj100ml : kj100g;
  const suffix = useMl ? '100ml' : '100g';
  const kcal = directKcal !== null ? directKcal : energyKj !== null ? energyKj / 4.184 : null;
  if (kcal === null || kcal < 0) return null;
  const nutrient = (key: string) => n[`${key}_${suffix}`];
  const protein = nutrient('proteins');
  const carbs = nutrient('carbohydrates');
  const fat = nutrient('fat');
  const fiber = nutrient('fiber');
  const sodium = num(nutrient('sodium'));
  return {
    name,
    brand: String(p.brands ?? '').split(',')[0]?.trim() || undefined,
    kcal: round1(kcal),
    ...(useMl ? { basis: '100ml' as const, units: [['copo', 200] as [string, number], ['lata', 350], ['garrafa', 500]] } : {}),
    protein: nonNegativeNutrient(protein),
    carbs: nonNegativeNutrient(carbs),
    fat: nonNegativeNutrient(fat),
    fiber: nonNegativeNutrient(fiber),
    saturatedFat: optionalNutrient(nutrient('saturated-fat')),
    sugars: optionalNutrient(nutrient('sugars')),
    sodiumMg: sodium === null || sodium < 0 ? undefined : round1(sodium * 1000),
    reportedNutrients: {
      protein: num(protein) !== null && num(protein)! >= 0,
      carbs: num(carbs) !== null && num(carbs)! >= 0,
      fat: num(fat) !== null && num(fat)! >= 0,
      fiber: num(fiber) !== null && num(fiber)! >= 0,
    },
    origin: 'off',
    code: p.code ? String(p.code) : undefined,
    sourceUrl: p.code ? `${OFF}/product/${encodeURIComponent(String(p.code))}` : OFF,
    sourceLicense: 'ODbL-1.0; Database Contents License',
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
/** Normaliza entrada de leitores/cópia antes de limitar o campo visual a 14 dígitos. */
export function normalizeBarcodeInput(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, 14);
}

export async function lookupBarcode(code: string, signal?: AbortSignal): Promise<FoodPer100 | null> {
  // Leitores e campos manuais podem inserir espaços ou hífens; não enviar caracteres inesperados à API.
  const normalizedCode = code.trim().replace(/[\s-]/g, '');
  if (!normalizedCode || !/^\d+$/.test(normalizedCode) || signal?.aborted) return null;
  const res = await fetch(`${OFF}/api/v2/product/${encodeURIComponent(normalizedCode)}.json?fields=${FIELDS}`, { signal });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('A consulta de código de barras está indisponível agora.');
  const json = await res.json();
  return json.status === 1 ? fromOff({ ...json.product, code: normalizedCode }) : null;
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
  const availableUnits = householdUnitsForFood(food);
  const first = availableUnits[0];
  const find = (u: string) => availableUnits.find(([k]) => stem(k) === stem(u) || stemAll(k) === stemAll(u));
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