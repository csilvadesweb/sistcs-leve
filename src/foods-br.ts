/**
 * Busca de alimentos: TACO 4ª edição, referência USDA SR Legacy licenciada e Open Food Facts para produtos embalados.
 * A origem/licença dos dados externos é preservada e os valores devem ser conferidos antes de registrar.
 */
import { TACO } from './foods-taco';
import { ESTIMATES_BATCH4 } from './foods-batch4';
import { USDA_SR_LEGACY_BATCH5 } from './foods-usda-batch5';
import { supabase } from './supabase';

export interface FoodPer100 {
  name: string;
  brand?: string;
  /** Nome original em outro idioma usado para busca, sem alterar o nome de exibição. */
  aliases?: string[];
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
  servingSize?: string;
  ingredients?: string;
  micronutrients?: Record<string, number | string>;
  reportedNutrients?: { protein: boolean; carbs: boolean; fat: boolean; fiber: boolean };
  origin: 'local' | 'off' | 'estimate' | 'usda' | 'supplement';
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

/**
 * Preparações brasileiras frequentes ausentes da referência genérica.
 * Valores são estimativas por 100 g, não rótulos nem análises laboratoriais.
 * Receitas, óleo, açúcar e acompanhamentos mudam bastante os nutrientes.
 */
const BRAZILIAN_ESTIMATES_MORE: FoodPer100[] = [
  { name: 'Açaí puro, polpa sem açúcar (estimativa)', kcal: 70, protein: 1.5, carbs: 4, fat: 5, fiber: 2, origin: 'estimate', code: 'estimate-br-acai-puro', units: [['tigela pequena', 200], ['porção', 100]] },
  { name: 'Açaí na tigela com banana e granola (estimativa)', kcal: 160, protein: 3, carbs: 29, fat: 4, fiber: 4, origin: 'estimate', code: 'estimate-br-acai-banana-granola', units: [['tigela média', 300], ['tigela pequena', 200]] },
  { name: 'Marmita caseira de arroz, feijão, frango e salada (estimativa)', kcal: 145, protein: 10, carbs: 18, fat: 3, fiber: 2, origin: 'estimate', code: 'estimate-br-marmita-caseira', units: [['marmita média', 450], ['marmita pequena', 350]] },
  { name: 'Marmita fitness de frango, batata-doce e legumes (estimativa)', kcal: 120, protein: 12, carbs: 12, fat: 2, fiber: 2.5, origin: 'estimate', code: 'estimate-br-marmita-fitness', units: [['marmita média', 350], ['marmita grande', 450]] },
  { name: 'Cuscuz nordestino de milho cozido (estimativa)', kcal: 112, protein: 2.5, carbs: 25, fat: 0.5, fiber: 2, origin: 'estimate', code: 'estimate-br-cuscuz-nordestino', units: [['fatia média', 100], ['xícara', 160]] },
  { name: 'Baião de dois (estimativa caseira)', kcal: 150, protein: 6, carbs: 23, fat: 4, fiber: 3, origin: 'estimate', code: 'estimate-br-baiao-dois', units: [['concha média', 160], ['porção', 200]] },
  { name: 'Acarajé sem recheio (estimativa)', kcal: 300, protein: 7, carbs: 30, fat: 17, fiber: 5, origin: 'estimate', code: 'estimate-br-acaraje', units: [['unidade média', 100]] },
  { name: 'Vatapá (estimativa caseira)', kcal: 220, protein: 8, carbs: 18, fat: 13, fiber: 2, origin: 'estimate', code: 'estimate-br-vatapa', units: [['concha média', 150], ['porção', 100]] },
  { name: 'Tacacá (estimativa caseira)', kcal: 55, protein: 3, carbs: 8, fat: 1, fiber: 1, origin: 'estimate', code: 'estimate-br-tacaca', units: [['cuia média', 400]] },
  { name: 'Galinhada (estimativa caseira)', kcal: 155, protein: 11, carbs: 19, fat: 4, fiber: 1, origin: 'estimate', code: 'estimate-br-galinhada', units: [['concha grande', 180], ['porção', 250]] },
  { name: 'Arroz carreteiro (estimativa caseira)', kcal: 175, protein: 8, carbs: 23, fat: 6, fiber: 1, origin: 'estimate', code: 'estimate-br-arroz-carreteiro', units: [['concha grande', 180], ['porção', 250]] },
  { name: 'Barreado (estimativa caseira)', kcal: 160, protein: 17, carbs: 5, fat: 8, fiber: 0.5, origin: 'estimate', code: 'estimate-br-barreado', units: [['concha média', 150], ['porção', 200]] },
  { name: 'Mandioca cozida (estimativa de referência)', kcal: 125, protein: 1, carbs: 30, fat: 0.3, fiber: 1.5, origin: 'estimate', code: 'estimate-br-mandioca-cozida', units: [['pedaço médio', 80], ['porção', 100]] },
  { name: 'Tapioca com queijo coalho (estimativa)', kcal: 285, protein: 7, carbs: 45, fat: 8, fiber: 0.5, origin: 'estimate', code: 'estimate-br-tapioca-queijo-coalho', units: [['unidade média', 120]] },
  { name: 'Omelete com queijo (estimativa caseira)', kcal: 190, protein: 13, carbs: 2, fat: 14, fiber: 0, origin: 'estimate', code: 'estimate-br-omelete-queijo', units: [['omelete de 2 ovos', 130]] },
  { name: 'Iogurte proteico genérico (estimativa; conferir rótulo)', kcal: 70, protein: 10, carbs: 5, fat: 1, fiber: 0, origin: 'estimate', code: 'estimate-br-iogurte-proteico', units: [['pote', 160]] },
];


/**
 * Alimentos brasileiros comuns de lanchonete, padaria, marmita e bebidas ausentes da referência genérica.
 * ESTIMATIVAS aproximadas por 100 g (ou 100 ml), baseadas em composições típicas; NÃO são análises nem rótulos.
 * Marcas e receitas variam: confira o rótulo ou a receita. Todas aparecem como "(estimativa)" no app.
 */
const BRAZILIAN_ESTIMATES_COMMON: FoodPer100[] = [
  { name: 'Pizza de mussarela, fatia (estimativa)', kcal: 270, protein: 11, carbs: 31, fat: 11, fiber: 2, origin: 'estimate', code: 'estimate-br2-pizza-de-mussarela-fatia', units: [['fatia média', 110]] },
  { name: 'Pizza de calabresa, fatia (estimativa)', kcal: 285, protein: 12, carbs: 30, fat: 13, fiber: 2, origin: 'estimate', code: 'estimate-br2-pizza-de-calabresa-fatia', units: [['fatia média', 110]] },
  { name: 'Hambúrguer simples com pão (estimativa)', kcal: 250, protein: 13, carbs: 25, fat: 11, fiber: 1, origin: 'estimate', code: 'estimate-br2-hamburguer-simples-com-pao', units: [['unidade', 150]] },
  { name: 'X-burger (cheeseburger) com pão (estimativa)', kcal: 270, protein: 14, carbs: 24, fat: 13, fiber: 1, origin: 'estimate', code: 'estimate-br2-x-burger-cheeseburger-com-pao', units: [['unidade', 180]] },
  { name: 'Cachorro-quente completo (estimativa)', kcal: 250, protein: 10, carbs: 22, fat: 13, fiber: 1, origin: 'estimate', code: 'estimate-br2-cachorro-quente-completo', units: [['unidade', 180]] },
  { name: 'Empada de frango (estimativa)', kcal: 360, protein: 8, carbs: 32, fat: 22, fiber: 1, origin: 'estimate', code: 'estimate-br2-empada-de-frango', units: [['unidade', 60]] },
  { name: 'Kibe frito (estimativa)', kcal: 250, protein: 12, carbs: 20, fat: 13, fiber: 2, origin: 'estimate', code: 'estimate-br2-kibe-frito', units: [['unidade', 80]] },
  { name: 'Enroladinho de salsicha assado (estimativa)', kcal: 300, protein: 9, carbs: 30, fat: 16, fiber: 1, origin: 'estimate', code: 'estimate-br2-enroladinho-de-salsicha-assado', units: [['unidade', 60]] },
  { name: 'Risole de carne frito (estimativa)', kcal: 280, protein: 9, carbs: 28, fat: 15, fiber: 1, origin: 'estimate', code: 'estimate-br2-risole-de-carne-frito', units: [['unidade', 50]] },
  { name: 'Misto quente (estimativa)', kcal: 290, protein: 13, carbs: 28, fat: 14, fiber: 1.5, origin: 'estimate', code: 'estimate-br2-misto-quente', units: [['unidade', 130]] },
  { name: 'Pão na chapa com manteiga (estimativa)', kcal: 330, protein: 8, carbs: 50, fat: 11, fiber: 2, origin: 'estimate', code: 'estimate-br2-pao-na-chapa-com-manteiga', units: [['unidade', 50]] },
  { name: 'Sanduíche natural de frango (estimativa)', kcal: 190, protein: 12, carbs: 24, fat: 5, fiber: 2, origin: 'estimate', code: 'estimate-br2-sanduiche-natural-de-frango', units: [['unidade', 160]] },
  { name: 'Batata frita de lanchonete (estimativa)', kcal: 310, protein: 3.5, carbs: 41, fat: 15, fiber: 3.5, origin: 'estimate', code: 'estimate-br2-batata-frita-de-lanchonete', units: [['porção pequena', 75], ['porção média', 110]] },
  { name: 'Pão com ovo (estimativa)', kcal: 260, protein: 11, carbs: 30, fat: 10, fiber: 1.5, origin: 'estimate', code: 'estimate-br2-pao-com-ovo', units: [['unidade', 130]] },
  { name: 'Pão francês com manteiga (estimativa)', kcal: 320, protein: 8, carbs: 50, fat: 10, fiber: 2, origin: 'estimate', code: 'estimate-br2-pao-frances-com-manteiga', units: [['unidade', 60]] },
  { name: 'Maionese de batata e legumes (salada de maionese) (estimativa)', kcal: 160, protein: 2, carbs: 12, fat: 12, fiber: 1.5, origin: 'estimate', code: 'estimate-br2-maionese-de-batata-e-legumes-salada-de-maionese', units: [['colher de servir', 50]] },
  { name: 'Strogonoff de frango (estimativa)', kcal: 150, protein: 12, carbs: 5, fat: 9, fiber: 0.5, origin: 'estimate', code: 'estimate-br2-strogonoff-de-frango', units: [['porção', 150]] },
  { name: 'Arroz à grega (estimativa)', kcal: 140, protein: 3, carbs: 24, fat: 3, fiber: 1.5, origin: 'estimate', code: 'estimate-br2-arroz-a-grega', units: [['porção', 120]] },
  { name: 'Farofa de manteiga (estimativa)', kcal: 420, protein: 3, carbs: 65, fat: 16, fiber: 4, origin: 'estimate', code: 'estimate-br2-farofa-de-manteiga', units: [['colher de sopa', 15]] },
  { name: 'Escondidinho de carne com purê (estimativa)', kcal: 150, protein: 9, carbs: 14, fat: 6, fiber: 1, origin: 'estimate', code: 'estimate-br2-escondidinho-de-carne-com-pure', units: [['porção', 200]] },
  { name: 'Lasanha à bolonhesa (estimativa)', kcal: 160, protein: 9, carbs: 15, fat: 7, fiber: 1, origin: 'estimate', code: 'estimate-br2-lasanha-a-bolonhesa', units: [['pedaço', 200]] },
  { name: 'Macarrão à bolonhesa (estimativa)', kcal: 140, protein: 7, carbs: 20, fat: 3.5, fiber: 1.5, origin: 'estimate', code: 'estimate-br2-macarrao-a-bolonhesa', units: [['prato', 250]] },
  { name: 'Nuggets de frango (estimativa)', kcal: 270, protein: 15, carbs: 17, fat: 16, fiber: 1, origin: 'estimate', code: 'estimate-br2-nuggets-de-frango', units: [['unidade', 20], ['porção (6 unidades)', 120]] },
  { name: 'Panqueca de carne (estimativa)', kcal: 190, protein: 9, carbs: 20, fat: 8, fiber: 1, origin: 'estimate', code: 'estimate-br2-panqueca-de-carne', units: [['unidade', 100]] },
  { name: 'Pudim de leite (estimativa)', kcal: 170, protein: 4.5, carbs: 27, fat: 5, fiber: 0, origin: 'estimate', code: 'estimate-br2-pudim-de-leite', units: [['fatia', 120]] },
  { name: 'Mousse de maracujá (estimativa)', kcal: 190, protein: 3, carbs: 25, fat: 9, fiber: 0.5, origin: 'estimate', code: 'estimate-br2-mousse-de-maracuja', units: [['porção', 100]] },
  { name: 'Beijinho de coco (estimativa)', kcal: 400, protein: 3, carbs: 60, fat: 17, fiber: 2, origin: 'estimate', code: 'estimate-br2-beijinho-de-coco', units: [['unidade', 20]] },
  { name: 'Paçoca de amendoim (estimativa)', kcal: 520, protein: 17, carbs: 53, fat: 27, fiber: 5, origin: 'estimate', code: 'estimate-br2-pacoca-de-amendoim', units: [['unidade', 20]] },
  { name: 'Doce de leite (estimativa)', kcal: 320, protein: 6, carbs: 55, fat: 8, fiber: 0, origin: 'estimate', code: 'estimate-br2-doce-de-leite', units: [['colher de sopa', 20]] },
  { name: 'Sorvete de creme (estimativa)', kcal: 210, protein: 3.5, carbs: 24, fat: 11, fiber: 0.5, origin: 'estimate', code: 'estimate-br2-sorvete-de-creme', units: [['bola', 60]] },
  { name: 'Barra de cereal (estimativa)', kcal: 390, protein: 5, carbs: 70, fat: 10, fiber: 4, origin: 'estimate', code: 'estimate-br2-barra-de-cereal', units: [['unidade', 25]] },
  { name: 'Chocolate ao leite em barra (estimativa)', kcal: 540, protein: 7, carbs: 58, fat: 30, fiber: 2, origin: 'estimate', code: 'estimate-br2-chocolate-ao-leite-em-barra', units: [['quadrado', 5], ['barra pequena', 25]] },
  { name: 'Biscoito recheado (estimativa)', kcal: 480, protein: 6, carbs: 70, fat: 20, fiber: 2, origin: 'estimate', code: 'estimate-br2-biscoito-recheado', units: [['unidade', 15]] },
  { name: 'Biscoito cream cracker (estimativa)', kcal: 430, protein: 10, carbs: 68, fat: 13, fiber: 2.5, origin: 'estimate', code: 'estimate-br2-biscoito-cream-cracker', units: [['unidade', 6]] },
  { name: 'Bolo de chocolate simples (estimativa)', kcal: 370, protein: 5, carbs: 55, fat: 15, fiber: 2, origin: 'estimate', code: 'estimate-br2-bolo-de-chocolate-simples', units: [['fatia média', 60]] },
  { name: 'Refrigerante de cola (estimativa)', kcal: 42, protein: 0, carbs: 10.6, fat: 0, fiber: 0, basis: '100ml', origin: 'estimate', code: 'estimate-br2-refrigerante-de-cola', units: [['lata', 350], ['copo', 200]] },
  { name: 'Refrigerante de guaraná (estimativa)', kcal: 38, protein: 0, carbs: 9.5, fat: 0, fiber: 0, basis: '100ml', origin: 'estimate', code: 'estimate-br2-refrigerante-de-guarana', units: [['lata', 350], ['copo', 200]] },
  { name: 'Suco de laranja natural (estimativa)', kcal: 45, protein: 0.7, carbs: 10, fat: 0.2, fiber: 0.2, basis: '100ml', origin: 'estimate', code: 'estimate-br2-suco-de-laranja-natural', units: [['copo', 200]] },
  { name: 'Café com açúcar (estimativa)', kcal: 30, protein: 0.1, carbs: 7.5, fat: 0, fiber: 0, basis: '100ml', origin: 'estimate', code: 'estimate-br2-cafe-com-acucar', units: [['xícara pequena', 50], ['xícara', 150]] },
  { name: 'Achocolatado pronto (leite com chocolate) (estimativa)', kcal: 70, protein: 3, carbs: 11, fat: 1.8, fiber: 0.5, basis: '100ml', origin: 'estimate', code: 'estimate-br2-achocolatado-pronto-leite-com-chocolate', units: [['copo', 200]] },
  { name: 'Vitamina de banana com leite (estimativa)', kcal: 80, protein: 3, carbs: 14, fat: 1.5, fiber: 0.8, basis: '100ml', origin: 'estimate', code: 'estimate-br2-vitamina-de-banana-com-leite', units: [['copo', 300]] },
  { name: 'Água de coco (estimativa)', kcal: 22, protein: 0, carbs: 5.3, fat: 0, fiber: 0, basis: '100ml', origin: 'estimate', code: 'estimate-br2-agua-de-coco', units: [['copo', 200]] },
  { name: 'Caldo de cana (estimativa)', kcal: 66, protein: 0, carbs: 17, fat: 0, fiber: 0, basis: '100ml', origin: 'estimate', code: 'estimate-br2-caldo-de-cana', units: [['copo', 300]] },
];

/**
 * Lote 3: pratos, padaria, churrasco, doces e bebidas do Brasil.
 * ESTIMATIVAS aproximadas por 100 g (ou 100 ml) com base em composições típicas; NÃO são análises nem rótulos.
 */
const BRAZILIAN_ESTIMATES_BATCH3: FoodPer100[] = [
  { name: 'Tutu de feijão (estimativa)', kcal: 130, protein: 6, carbs: 15, fat: 5, fiber: 4, origin: 'estimate', code: 'estimate-br3-tutu-de-feijao', units: [['concha', 100]] },
  { name: 'Feijão tropeiro (estimativa)', kcal: 190, protein: 9, carbs: 17, fat: 9, fiber: 5, origin: 'estimate', code: 'estimate-br3-feijao-tropeiro', units: [['porção', 150]] },
  { name: 'Couve refogada (estimativa)', kcal: 70, protein: 2.5, carbs: 5, fat: 5, fiber: 3, origin: 'estimate', code: 'estimate-br3-couve-refogada', units: [['colher de sopa', 30]] },
  { name: 'Bobó de camarão (estimativa)', kcal: 140, protein: 9, carbs: 8, fat: 8, fiber: 1.5, origin: 'estimate', code: 'estimate-br3-bobo-de-camarao', units: [['porção', 200]] },
  { name: 'Carne de panela com batata (estimativa)', kcal: 130, protein: 12, carbs: 7, fat: 6, fiber: 1, origin: 'estimate', code: 'estimate-br3-carne-de-panela-com-batata', units: [['porção', 180]] },
  { name: 'Frango assado com pele (estimativa)', kcal: 215, protein: 25, carbs: 0, fat: 12, fiber: 0, origin: 'estimate', code: 'estimate-br3-frango-assado-com-pele', units: [['coxa com sobrecoxa', 110]] },
  { name: 'Frango ensopado com legumes (estimativa)', kcal: 120, protein: 12, carbs: 5, fat: 6, fiber: 1, origin: 'estimate', code: 'estimate-br3-frango-ensopado-com-legumes', units: [['porção', 150]] },
  { name: 'Costela de porco assada (estimativa)', kcal: 290, protein: 20, carbs: 0, fat: 23, fiber: 0, origin: 'estimate', code: 'estimate-br3-costela-de-porco-assada', units: [['porção', 100]] },
  { name: 'Linguiça toscana assada (estimativa)', kcal: 290, protein: 16, carbs: 1, fat: 24, fiber: 0, origin: 'estimate', code: 'estimate-br3-linguica-toscana-assada', units: [['unidade', 80]] },
  { name: 'Picanha grelhada (estimativa)', kcal: 260, protein: 26, carbs: 0, fat: 17, fiber: 0, origin: 'estimate', code: 'estimate-br3-picanha-grelhada', units: [['porção', 120]] },
  { name: 'Almôndega ao molho (estimativa)', kcal: 150, protein: 10, carbs: 7, fat: 9, fiber: 1, origin: 'estimate', code: 'estimate-br3-almondega-ao-molho', units: [['unidade', 40]] },
  { name: 'Carne moída refogada (estimativa)', kcal: 190, protein: 20, carbs: 2, fat: 11, fiber: 0.5, origin: 'estimate', code: 'estimate-br3-carne-moida-refogada', units: [['colher de sopa', 25], ['porção', 100]] },
  { name: 'Bife à parmegiana (estimativa)', kcal: 220, protein: 17, carbs: 10, fat: 12, fiber: 0.5, origin: 'estimate', code: 'estimate-br3-bife-a-parmegiana', units: [['unidade', 150]] },
  { name: 'Filé de peixe empanado frito (estimativa)', kcal: 230, protein: 14, carbs: 16, fat: 12, fiber: 0.5, origin: 'estimate', code: 'estimate-br3-file-de-peixe-empanado-frito', units: [['filé', 100]] },
  { name: 'Peixe assado com ervas (estimativa)', kcal: 130, protein: 22, carbs: 0, fat: 4, fiber: 0, origin: 'estimate', code: 'estimate-br3-peixe-assado-com-ervas', units: [['posta', 150]] },
  { name: 'Camarão empanado frito (estimativa)', kcal: 250, protein: 14, carbs: 20, fat: 13, fiber: 0.5, origin: 'estimate', code: 'estimate-br3-camarao-empanado-frito', units: [['porção', 100]] },
  { name: 'Bacalhau à Gomes de Sá (estimativa)', kcal: 150, protein: 11, carbs: 12, fat: 7, fiber: 1, origin: 'estimate', code: 'estimate-br3-bacalhau-a-gomes-de-sa', units: [['porção', 200]] },
  { name: 'Rabada (estimativa)', kcal: 190, protein: 17, carbs: 2, fat: 13, fiber: 0.3, origin: 'estimate', code: 'estimate-br3-rabada', units: [['porção', 150]] },
  { name: 'Espetinho de carne (estimativa)', kcal: 230, protein: 22, carbs: 2, fat: 15, fiber: 0, origin: 'estimate', code: 'estimate-br3-espetinho-de-carne', units: [['espetinho', 80]] },
  { name: 'Espetinho de frango (estimativa)', kcal: 180, protein: 24, carbs: 1, fat: 9, fiber: 0, origin: 'estimate', code: 'estimate-br3-espetinho-de-frango', units: [['espetinho', 80]] },
  { name: 'Coração de frango grelhado (estimativa)', kcal: 185, protein: 26, carbs: 0.5, fat: 8.5, fiber: 0, origin: 'estimate', code: 'estimate-br3-coracao-de-frango-grelhado', units: [['espetinho', 70]] },
  { name: 'Pão de alho (estimativa)', kcal: 340, protein: 7, carbs: 40, fat: 16, fiber: 2, origin: 'estimate', code: 'estimate-br3-pao-de-alho', units: [['unidade', 50]] },
  { name: 'Queijo coalho grelhado (estimativa)', kcal: 310, protein: 22, carbs: 2, fat: 24, fiber: 0, origin: 'estimate', code: 'estimate-br3-queijo-coalho-grelhado', units: [['espetinho', 80]] },
  { name: 'Vinagrete (estimativa)', kcal: 45, protein: 1, carbs: 6, fat: 2, fiber: 1.5, origin: 'estimate', code: 'estimate-br3-vinagrete', units: [['colher de sopa', 20]] },
  { name: 'Purê de batata (estimativa)', kcal: 110, protein: 2, carbs: 16, fat: 4.5, fiber: 1.5, origin: 'estimate', code: 'estimate-br3-pure-de-batata', units: [['colher de servir', 60]] },
  { name: 'Batata palha (estimativa)', kcal: 520, protein: 6, carbs: 50, fat: 33, fiber: 4, origin: 'estimate', code: 'estimate-br3-batata-palha', units: [['colher de sopa', 10]] },
  { name: 'Polenta frita (estimativa)', kcal: 190, protein: 3, carbs: 25, fat: 8, fiber: 2, origin: 'estimate', code: 'estimate-br3-polenta-frita', units: [['pedaço', 60]] },
  { name: 'Macarrão alho e óleo (estimativa)', kcal: 170, protein: 5, carbs: 25, fat: 5, fiber: 1.5, origin: 'estimate', code: 'estimate-br3-macarrao-alho-e-oleo', units: [['prato', 200]] },
  { name: 'Macarrão com molho de tomate (estimativa)', kcal: 130, protein: 4, carbs: 24, fat: 2, fiber: 2, origin: 'estimate', code: 'estimate-br3-macarrao-com-molho-de-tomate', units: [['prato', 250]] },
  { name: 'Nhoque ao sugo (estimativa)', kcal: 140, protein: 4, carbs: 27, fat: 2, fiber: 1.5, origin: 'estimate', code: 'estimate-br3-nhoque-ao-sugo', units: [['prato', 250]] },
  { name: 'Arroz de forno (estimativa)', kcal: 180, protein: 9, carbs: 20, fat: 7, fiber: 1, origin: 'estimate', code: 'estimate-br3-arroz-de-forno', units: [['porção', 200]] },
  { name: 'Arroz com brócolis (estimativa)', kcal: 130, protein: 3, carbs: 22, fat: 3, fiber: 1.5, origin: 'estimate', code: 'estimate-br3-arroz-com-brocolis', units: [['porção', 120]] },
  { name: 'Arroz-doce (estimativa)', kcal: 150, protein: 3, carbs: 27, fat: 3.5, fiber: 0.3, origin: 'estimate', code: 'estimate-br3-arroz-doce', units: [['porção', 120]] },
  { name: 'Canjica (mungunzá) (estimativa)', kcal: 140, protein: 3, carbs: 25, fat: 3, fiber: 1.5, origin: 'estimate', code: 'estimate-br3-canjica-mungunza', units: [['tigela', 150]] },
  { name: 'Curau de milho (estimativa)', kcal: 120, protein: 3, carbs: 20, fat: 3, fiber: 1, origin: 'estimate', code: 'estimate-br3-curau-de-milho', units: [['porção', 120]] },
  { name: 'Cocada (estimativa)', kcal: 390, protein: 2, carbs: 65, fat: 14, fiber: 4, origin: 'estimate', code: 'estimate-br3-cocada', units: [['unidade', 30]] },
  { name: 'Pé de moleque (estimativa)', kcal: 500, protein: 12, carbs: 55, fat: 26, fiber: 4, origin: 'estimate', code: 'estimate-br3-pe-de-moleque', units: [['unidade', 25]] },
  { name: 'Bem-casado (estimativa)', kcal: 430, protein: 5, carbs: 70, fat: 14, fiber: 1, origin: 'estimate', code: 'estimate-br3-bem-casado', units: [['unidade', 25]] },
  { name: 'Churros recheado (estimativa)', kcal: 330, protein: 5, carbs: 42, fat: 16, fiber: 1, origin: 'estimate', code: 'estimate-br3-churros-recheado', units: [['unidade', 60]] },
  { name: 'Sonho de padaria (estimativa)', kcal: 350, protein: 6, carbs: 45, fat: 16, fiber: 1, origin: 'estimate', code: 'estimate-br3-sonho-de-padaria', units: [['unidade', 100]] },
  { name: 'Torta de limão (estimativa)', kcal: 320, protein: 4, carbs: 42, fat: 15, fiber: 0.5, origin: 'estimate', code: 'estimate-br3-torta-de-limao', units: [['fatia', 100]] },
  { name: 'Pavê (estimativa)', kcal: 230, protein: 3, carbs: 30, fat: 11, fiber: 0.5, origin: 'estimate', code: 'estimate-br3-pave', units: [['porção', 100]] },
  { name: 'Torta de frango (estimativa)', kcal: 220, protein: 9, carbs: 22, fat: 11, fiber: 1, origin: 'estimate', code: 'estimate-br3-torta-de-frango', units: [['fatia', 120]] },
  { name: 'Pão de mel (estimativa)', kcal: 380, protein: 5, carbs: 65, fat: 11, fiber: 1.5, origin: 'estimate', code: 'estimate-br3-pao-de-mel', units: [['unidade', 40]] },
  { name: 'Bolo de fubá (estimativa)', kcal: 350, protein: 5, carbs: 52, fat: 13, fiber: 1.5, origin: 'estimate', code: 'estimate-br3-bolo-de-fuba', units: [['fatia', 50]] },
  { name: 'Bolo de laranja (estimativa)', kcal: 340, protein: 5, carbs: 52, fat: 12, fiber: 1, origin: 'estimate', code: 'estimate-br3-bolo-de-laranja', units: [['fatia', 50]] },
  { name: 'Goiabada (estimativa)', kcal: 270, protein: 0.5, carbs: 70, fat: 0, fiber: 1.5, origin: 'estimate', code: 'estimate-br3-goiabada', units: [['fatia', 30]] },
  { name: 'Bananada (estimativa)', kcal: 280, protein: 1, carbs: 70, fat: 0.3, fiber: 1.5, origin: 'estimate', code: 'estimate-br3-bananada', units: [['unidade', 30]] },
  { name: 'Pipoca com sal e óleo (estimativa)', kcal: 450, protein: 10, carbs: 60, fat: 18, fiber: 10, origin: 'estimate', code: 'estimate-br3-pipoca-com-sal-e-oleo', units: [['xícara', 10]] },
  { name: 'Bisnaguinha (estimativa)', kcal: 290, protein: 8, carbs: 52, fat: 5, fiber: 2, origin: 'estimate', code: 'estimate-br3-bisnaguinha', units: [['unidade', 25]] },
  { name: 'Croissant simples (estimativa)', kcal: 410, protein: 8, carbs: 45, fat: 22, fiber: 2, origin: 'estimate', code: 'estimate-br3-croissant-simples', units: [['unidade', 60]] },
  { name: 'Torrada tradicional (estimativa)', kcal: 400, protein: 10, carbs: 72, fat: 7, fiber: 4, origin: 'estimate', code: 'estimate-br3-torrada-tradicional', units: [['unidade', 8]] },
  { name: 'Tapioca com carne seca (estimativa)', kcal: 250, protein: 10, carbs: 35, fat: 8, fiber: 0.5, origin: 'estimate', code: 'estimate-br3-tapioca-com-carne-seca', units: [['unidade', 100]] },
  { name: 'Cuscuz com ovo (estimativa)', kcal: 150, protein: 6, carbs: 22, fat: 4, fiber: 1.5, origin: 'estimate', code: 'estimate-br3-cuscuz-com-ovo', units: [['porção', 150]] },
  { name: 'Mingau de aveia com leite (estimativa)', kcal: 85, protein: 3, carbs: 12, fat: 2.5, fiber: 1, origin: 'estimate', code: 'estimate-br3-mingau-de-aveia-com-leite', units: [['tigela', 250]] },
  { name: 'Panqueca de frango (estimativa)', kcal: 185, protein: 10, carbs: 20, fat: 7, fiber: 1, origin: 'estimate', code: 'estimate-br3-panqueca-de-frango', units: [['unidade', 100]] },
  { name: 'Torta salgada de liquidificador (estimativa)', kcal: 200, protein: 8, carbs: 18, fat: 11, fiber: 1, origin: 'estimate', code: 'estimate-br3-torta-salgada-de-liquidificador', units: [['fatia', 120]] },
  { name: 'Quiche de queijo (estimativa)', kcal: 280, protein: 10, carbs: 18, fat: 19, fiber: 0.5, origin: 'estimate', code: 'estimate-br3-quiche-de-queijo', units: [['fatia', 100]] },
  { name: 'Ovo mexido (estimativa)', kcal: 160, protein: 10, carbs: 1, fat: 12, fiber: 0, origin: 'estimate', code: 'estimate-br3-ovo-mexido', units: [['ovo', 50]] },
  { name: 'Café com leite (estimativa)', kcal: 45, protein: 2, carbs: 5, fat: 1.8, fiber: 0, basis: '100ml', origin: 'estimate', code: 'estimate-br3-cafe-com-leite', units: [['xícara', 150]] },
  { name: 'Cappuccino (estimativa)', kcal: 60, protein: 2, carbs: 8, fat: 2.5, fiber: 0, basis: '100ml', origin: 'estimate', code: 'estimate-br3-cappuccino', units: [['xícara', 180]] },
  { name: 'Suco de uva integral (estimativa)', kcal: 65, protein: 0.4, carbs: 16, fat: 0, fiber: 0, basis: '100ml', origin: 'estimate', code: 'estimate-br3-suco-de-uva-integral', units: [['copo', 200]] },
  { name: 'Suco de abacaxi (estimativa)', kcal: 45, protein: 0.4, carbs: 11, fat: 0.1, fiber: 0.3, basis: '100ml', origin: 'estimate', code: 'estimate-br3-suco-de-abacaxi', units: [['copo', 200]] },
  { name: 'Suco de maracujá com açúcar (estimativa)', kcal: 55, protein: 0.5, carbs: 13.5, fat: 0.1, fiber: 0.3, basis: '100ml', origin: 'estimate', code: 'estimate-br3-suco-de-maracuja-com-acucar', units: [['copo', 200]] },
  { name: 'Limonada com açúcar (estimativa)', kcal: 40, protein: 0.1, carbs: 10, fat: 0, fiber: 0, basis: '100ml', origin: 'estimate', code: 'estimate-br3-limonada-com-acucar', units: [['copo', 200]] },
  { name: 'Chá mate gelado com açúcar (estimativa)', kcal: 30, protein: 0, carbs: 7.5, fat: 0, fiber: 0, basis: '100ml', origin: 'estimate', code: 'estimate-br3-cha-mate-gelado-com-acucar', units: [['copo', 200]] },
  { name: 'Isotônico (estimativa)', kcal: 24, protein: 0, carbs: 6, fat: 0, fiber: 0, basis: '100ml', origin: 'estimate', code: 'estimate-br3-isotonico', units: [['garrafa', 500]] },
  { name: 'Energético (estimativa)', kcal: 45, protein: 0, carbs: 11, fat: 0, fiber: 0, basis: '100ml', origin: 'estimate', code: 'estimate-br3-energetico', units: [['lata', 250]] },
];

/**
 * Pratos e alimentos populares de outras cozinhas (asiática, árabe, mexicana, italiana, americana, europeia).
 * ESTIMATIVAS aproximadas por 100 g (ou 100 ml); receitas e porções variam muito. Confira rótulo/receita.
 */
const INTERNATIONAL_ESTIMATES: FoodPer100[] = [
  { name: 'Sushi nigiri de salmão (estimativa)', kcal: 150, protein: 7, carbs: 25, fat: 2.5, fiber: 0.5, origin: 'estimate', code: 'estimate-intl-sushi-nigiri-de-salmao', units: [['unidade', 35]] },
  { name: 'Hossomaki de pepino (estimativa)', kcal: 140, protein: 5, carbs: 27, fat: 1.5, fiber: 1, origin: 'estimate', code: 'estimate-intl-hossomaki-de-pepino', units: [['unidade', 25]] },
  { name: 'Uramaki Philadelphia (estimativa)', kcal: 180, protein: 6, carbs: 26, fat: 6, fiber: 1, origin: 'estimate', code: 'estimate-intl-uramaki-philadelphia', units: [['unidade', 35]] },
  { name: 'Sashimi de salmão (estimativa)', kcal: 140, protein: 22, carbs: 0, fat: 5.5, fiber: 0, origin: 'estimate', code: 'estimate-intl-sashimi-de-salmao', units: [['fatia', 20]] },
  { name: 'Temaki de salmão (estimativa)', kcal: 170, protein: 7, carbs: 24, fat: 5, fiber: 1, origin: 'estimate', code: 'estimate-intl-temaki-de-salmao', units: [['unidade', 130]] },
  { name: 'Yakisoba de legumes e frango (estimativa)', kcal: 140, protein: 6, carbs: 18, fat: 5, fiber: 1.5, origin: 'estimate', code: 'estimate-intl-yakisoba-de-legumes-e-frango', units: [['prato', 300]] },
  { name: 'Lámen (ramen) com caldo (estimativa)', kcal: 70, protein: 4, carbs: 9, fat: 2, fiber: 0.5, origin: 'estimate', code: 'estimate-intl-lamen-ramen-com-caldo', units: [['tigela', 450]] },
  { name: 'Pad thai (estimativa)', kcal: 170, protein: 7, carbs: 22, fat: 6, fiber: 1.5, origin: 'estimate', code: 'estimate-intl-pad-thai', units: [['prato', 300]] },
  { name: 'Arroz frito chinês (estimativa)', kcal: 180, protein: 5, carbs: 26, fat: 6, fiber: 1, origin: 'estimate', code: 'estimate-intl-arroz-frito-chines', units: [['prato', 250]] },
  { name: 'Frango xadrez (estimativa)', kcal: 120, protein: 11, carbs: 7, fat: 5, fiber: 1, origin: 'estimate', code: 'estimate-intl-frango-xadrez', units: [['porção', 200]] },
  { name: 'Rolinho primavera frito (estimativa)', kcal: 220, protein: 5, carbs: 25, fat: 11, fiber: 1.5, origin: 'estimate', code: 'estimate-intl-rolinho-primavera-frito', units: [['unidade', 80]] },
  { name: 'Guioza (gyoza) cozido na frigideira (estimativa)', kcal: 200, protein: 8, carbs: 25, fat: 7, fiber: 1, origin: 'estimate', code: 'estimate-intl-guioza-gyoza-cozido-na-frigideira', units: [['unidade', 25]] },
  { name: 'Curry de frango indiano (estimativa)', kcal: 130, protein: 10, carbs: 6, fat: 7, fiber: 1, origin: 'estimate', code: 'estimate-intl-curry-de-frango-indiano', units: [['porção', 200]] },
  { name: 'Naan (estimativa)', kcal: 290, protein: 9, carbs: 50, fat: 5, fiber: 2, origin: 'estimate', code: 'estimate-intl-naan', units: [['unidade', 90]] },
  { name: 'Frango tikka masala (estimativa)', kcal: 150, protein: 13, carbs: 6, fat: 8, fiber: 1, origin: 'estimate', code: 'estimate-intl-frango-tikka-masala', units: [['porção', 200]] },
  { name: 'Falafel (estimativa)', kcal: 330, protein: 13, carbs: 32, fat: 17, fiber: 5, origin: 'estimate', code: 'estimate-intl-falafel', units: [['unidade', 17]] },
  { name: 'Homus (pasta de grão-de-bico) (estimativa)', kcal: 170, protein: 8, carbs: 14, fat: 9, fiber: 6, origin: 'estimate', code: 'estimate-intl-homus-pasta-de-grao-de-bico', units: [['colher de sopa', 15]] },
  { name: 'Shawarma de frango no pão (estimativa)', kcal: 220, protein: 14, carbs: 20, fat: 9, fiber: 1.5, origin: 'estimate', code: 'estimate-intl-shawarma-de-frango-no-pao', units: [['unidade', 200]] },
  { name: 'Babaganuche (estimativa)', kcal: 120, protein: 2, carbs: 6, fat: 10, fiber: 3, origin: 'estimate', code: 'estimate-intl-babaganuche', units: [['colher de sopa', 15]] },
  { name: 'Taco mexicano de carne (estimativa)', kcal: 230, protein: 11, carbs: 20, fat: 12, fiber: 2.5, origin: 'estimate', code: 'estimate-intl-taco-mexicano-de-carne', units: [['unidade', 80]] },
  { name: 'Burrito de carne e feijão (estimativa)', kcal: 210, protein: 9, carbs: 28, fat: 7, fiber: 3, origin: 'estimate', code: 'estimate-intl-burrito-de-carne-e-feijao', units: [['unidade', 250]] },
  { name: 'Guacamole (estimativa)', kcal: 150, protein: 2, carbs: 8, fat: 13, fiber: 6, origin: 'estimate', code: 'estimate-intl-guacamole', units: [['colher de sopa', 20]] },
  { name: 'Nachos com queijo (estimativa)', kcal: 350, protein: 8, carbs: 38, fat: 18, fiber: 3, origin: 'estimate', code: 'estimate-intl-nachos-com-queijo', units: [['porção', 50]] },
  { name: 'Quesadilla de queijo (estimativa)', kcal: 300, protein: 13, carbs: 27, fat: 16, fiber: 1.5, origin: 'estimate', code: 'estimate-intl-quesadilla-de-queijo', units: [['unidade', 150]] },
  { name: 'Enchilada de frango (estimativa)', kcal: 160, protein: 8, carbs: 16, fat: 7, fiber: 2, origin: 'estimate', code: 'estimate-intl-enchilada-de-frango', units: [['unidade', 150]] },
  { name: 'Chili com carne (estimativa)', kcal: 120, protein: 9, carbs: 11, fat: 5, fiber: 4, origin: 'estimate', code: 'estimate-intl-chili-com-carne', units: [['porção', 250]] },
  { name: 'Paella (estimativa)', kcal: 150, protein: 8, carbs: 20, fat: 4, fiber: 1, origin: 'estimate', code: 'estimate-intl-paella', units: [['porção', 250]] },
  { name: 'Risoto de cogumelos (estimativa)', kcal: 150, protein: 4, carbs: 22, fat: 5, fiber: 0.7, origin: 'estimate', code: 'estimate-intl-risoto-de-cogumelos', units: [['prato', 250]] },
  { name: 'Ravióli de queijo (estimativa)', kcal: 190, protein: 8, carbs: 27, fat: 5, fiber: 1.5, origin: 'estimate', code: 'estimate-intl-ravioli-de-queijo', units: [['prato', 250]] },
  { name: 'Espaguete carbonara (estimativa)', kcal: 190, protein: 8, carbs: 22, fat: 8, fiber: 1, origin: 'estimate', code: 'estimate-intl-espaguete-carbonara', units: [['prato', 250]] },
  { name: 'Fettuccine alfredo (estimativa)', kcal: 210, protein: 7, carbs: 24, fat: 9, fiber: 1, origin: 'estimate', code: 'estimate-intl-fettuccine-alfredo', units: [['prato', 250]] },
  { name: 'Molho pesto (estimativa)', kcal: 450, protein: 5, carbs: 4, fat: 46, fiber: 2, origin: 'estimate', code: 'estimate-intl-molho-pesto', units: [['colher de sopa', 15]] },
  { name: 'Bruschetta de tomate (estimativa)', kcal: 160, protein: 4, carbs: 22, fat: 6, fiber: 1.5, origin: 'estimate', code: 'estimate-intl-bruschetta-de-tomate', units: [['unidade', 50]] },
  { name: 'Salada caprese (estimativa)', kcal: 190, protein: 11, carbs: 3, fat: 15, fiber: 0.5, origin: 'estimate', code: 'estimate-intl-salada-caprese', units: [['porção', 100]] },
  { name: 'Tiramisù (estimativa)', kcal: 280, protein: 5, carbs: 28, fat: 17, fiber: 0.5, origin: 'estimate', code: 'estimate-intl-tiramisu', units: [['porção', 100]] },
  { name: 'Panna cotta (estimativa)', kcal: 200, protein: 3, carbs: 22, fat: 11, fiber: 0, origin: 'estimate', code: 'estimate-intl-panna-cotta', units: [['porção', 100]] },
  { name: 'Baguete (estimativa)', kcal: 270, protein: 9, carbs: 54, fat: 1.5, fiber: 2.5, origin: 'estimate', code: 'estimate-intl-baguete', units: [['fatia', 25]] },
  { name: 'Panqueca americana (pancake) (estimativa)', kcal: 230, protein: 6, carbs: 38, fat: 6, fiber: 1.5, origin: 'estimate', code: 'estimate-intl-panqueca-americana-pancake', units: [['unidade', 60]] },
  { name: 'Waffle (estimativa)', kcal: 290, protein: 7, carbs: 37, fat: 12, fiber: 1, origin: 'estimate', code: 'estimate-intl-waffle', units: [['unidade', 75]] },
  { name: 'Bagel (estimativa)', kcal: 270, protein: 10, carbs: 53, fat: 1.5, fiber: 2.5, origin: 'estimate', code: 'estimate-intl-bagel', units: [['unidade', 100]] },
  { name: 'Muffin (estimativa)', kcal: 370, protein: 5, carbs: 50, fat: 17, fiber: 1.5, origin: 'estimate', code: 'estimate-intl-muffin', units: [['unidade', 100]] },
  { name: 'Donut açucarado (estimativa)', kcal: 410, protein: 5, carbs: 48, fat: 22, fiber: 1.5, origin: 'estimate', code: 'estimate-intl-donut-acucarado', units: [['unidade', 60]] },
  { name: 'Brownie de chocolate (estimativa)', kcal: 400, protein: 5, carbs: 52, fat: 20, fiber: 2, origin: 'estimate', code: 'estimate-intl-brownie-de-chocolate', units: [['unidade', 60]] },
  { name: 'Cookie de chocolate (estimativa)', kcal: 480, protein: 5, carbs: 65, fat: 22, fiber: 2, origin: 'estimate', code: 'estimate-intl-cookie-de-chocolate', units: [['unidade', 30]] },
  { name: 'Cheesecake (estimativa)', kcal: 320, protein: 6, carbs: 26, fat: 22, fiber: 0.5, origin: 'estimate', code: 'estimate-intl-cheesecake', units: [['fatia', 120]] },
  { name: 'Torta de maçã (estimativa)', kcal: 260, protein: 2, carbs: 38, fat: 11, fiber: 1.5, origin: 'estimate', code: 'estimate-intl-torta-de-maca', units: [['fatia', 120]] },
  { name: 'Batata assada com casca (estimativa)', kcal: 95, protein: 2.5, carbs: 21, fat: 0.2, fiber: 2, origin: 'estimate', code: 'estimate-intl-batata-assada-com-casca', units: [['unidade', 200]] },
  { name: 'Batata rústica assada com azeite (estimativa)', kcal: 150, protein: 2.5, carbs: 22, fat: 6, fiber: 2.5, origin: 'estimate', code: 'estimate-intl-batata-rustica-assada-com-azeite', units: [['porção', 150]] },
  { name: 'Coleslaw (estimativa)', kcal: 140, protein: 1, carbs: 12, fat: 10, fiber: 1.5, origin: 'estimate', code: 'estimate-intl-coleslaw', units: [['colher de sopa', 50]] },
  { name: 'Macarrão com queijo (mac and cheese) (estimativa)', kcal: 190, protein: 8, carbs: 22, fat: 8, fiber: 1, origin: 'estimate', code: 'estimate-intl-macarrao-com-queijo-mac-and-cheese', units: [['prato', 250]] },
  { name: 'Asinha de frango frita (buffalo) (estimativa)', kcal: 280, protein: 22, carbs: 8, fat: 17, fiber: 0.5, origin: 'estimate', code: 'estimate-intl-asinha-de-frango-frita-buffalo', units: [['unidade', 40]] },
  { name: 'Fish and chips (estimativa)', kcal: 250, protein: 13, carbs: 24, fat: 11, fiber: 2, origin: 'estimate', code: 'estimate-intl-fish-and-chips', units: [['porção', 300]] },
  { name: 'Salada Caesar com frango (estimativa)', kcal: 130, protein: 9, carbs: 6, fat: 8, fiber: 1.5, origin: 'estimate', code: 'estimate-intl-salada-caesar-com-frango', units: [['prato', 250]] },
  { name: 'Sopa de legumes (estimativa)', kcal: 40, protein: 1.5, carbs: 7, fat: 0.8, fiber: 1.5, origin: 'estimate', code: 'estimate-intl-sopa-de-legumes', units: [['prato fundo', 300]] },
  { name: 'Canja de galinha (estimativa)', kcal: 55, protein: 4, carbs: 6, fat: 1.5, fiber: 0.5, origin: 'estimate', code: 'estimate-intl-canja-de-galinha', units: [['prato fundo', 300]] },
  { name: 'Caldo verde (estimativa)', kcal: 70, protein: 2.5, carbs: 8, fat: 3, fiber: 1.5, origin: 'estimate', code: 'estimate-intl-caldo-verde', units: [['prato fundo', 300]] },
  { name: 'Iogurte grego natural integral (estimativa)', kcal: 100, protein: 5, carbs: 4, fat: 7, fiber: 0, origin: 'estimate', code: 'estimate-intl-iogurte-grego-natural-integral', units: [['pote', 170]] },
  { name: 'Granola (estimativa)', kcal: 430, protein: 10, carbs: 64, fat: 15, fiber: 7, origin: 'estimate', code: 'estimate-intl-granola', units: [['colher de sopa', 15]] },
  { name: 'Whey protein em pó (estimativa)', kcal: 390, protein: 75, carbs: 8, fat: 6, fiber: 0, origin: 'estimate', code: 'estimate-intl-whey-protein-em-po', units: [['medida (scoop)', 30]] },
  { name: 'Pão sírio (estimativa)', kcal: 275, protein: 9, carbs: 55, fat: 1.2, fiber: 2, origin: 'estimate', code: 'estimate-intl-pao-sirio', units: [['unidade', 60]] },
  { name: 'Tortilla de trigo (estimativa)', kcal: 310, protein: 8, carbs: 50, fat: 8, fiber: 2.5, origin: 'estimate', code: 'estimate-intl-tortilla-de-trigo', units: [['unidade', 45]] },
  { name: 'Sopa de missô (estimativa)', kcal: 30, protein: 2, carbs: 3, fat: 1, fiber: 0.5, origin: 'estimate', code: 'estimate-intl-sopa-de-misso', units: [['tigela', 200]] },
  { name: 'Edamame (estimativa)', kcal: 120, protein: 11, carbs: 9, fat: 5, fiber: 5, origin: 'estimate', code: 'estimate-intl-edamame', units: [['porção', 100]] },
  { name: 'Kimchi (estimativa)', kcal: 20, protein: 1.5, carbs: 3, fat: 0.3, fiber: 2, origin: 'estimate', code: 'estimate-intl-kimchi', units: [['colher de sopa', 30]] },
  { name: 'Bibimbap (estimativa)', kcal: 130, protein: 6, carbs: 20, fat: 3, fiber: 2, origin: 'estimate', code: 'estimate-intl-bibimbap', units: [['tigela', 400]] },
  { name: 'Tempurá de legumes (estimativa)', kcal: 230, protein: 3, carbs: 22, fat: 14, fiber: 1.5, origin: 'estimate', code: 'estimate-intl-tempura-de-legumes', units: [['unidade', 30]] },
  { name: 'Salada grega (estimativa)', kcal: 100, protein: 3, carbs: 5, fat: 8, fiber: 1.5, origin: 'estimate', code: 'estimate-intl-salada-grega', units: [['prato', 200]] },
  { name: 'Moussaka (estimativa)', kcal: 150, protein: 8, carbs: 9, fat: 9, fiber: 1.5, origin: 'estimate', code: 'estimate-intl-moussaka', units: [['porção', 250]] },
  { name: 'Ratatouille (estimativa)', kcal: 60, protein: 1.5, carbs: 7, fat: 3, fiber: 2, origin: 'estimate', code: 'estimate-intl-ratatouille', units: [['porção', 200]] },
  { name: 'Crepe de queijo e presunto (estimativa)', kcal: 200, protein: 9, carbs: 22, fat: 8, fiber: 0.5, origin: 'estimate', code: 'estimate-intl-crepe-de-queijo-e-presunto', units: [['unidade', 120]] },
];

export const FOODS_BR: FoodPer100[] = [
  ...BRAZILIAN_ESTIMATES,
  ...BRAZILIAN_ESTIMATES_MORE,
  ...BRAZILIAN_ESTIMATES_COMMON,
  ...BRAZILIAN_ESTIMATES_BATCH3,
  ...INTERNATIONAL_ESTIMATES,
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
    // Referência USDA FoodData Central SR Legacy; valores por 100 g de ameixa seca não cozida.
    name: 'Ameixa seca, desidratada (referência USDA)',
    kcal: 240,
    protein: 2.18,
    carbs: 63.88,
    fat: 0.38,
    fiber: 7.1,
    origin: 'usda',
    code: 'usda-sr-legacy-prunes-uncooked',
    sourceUrl: 'https://fdc.nal.usda.gov/food-details/168162/nutrients',
    sourceLicense: 'CC0 1.0',
    units: [['unidade média', 9.5], ['porção (5 unidades)', 47.5]],
  },
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
},
  {
    // Valores de referência por 100 g; conferir o rótulo da embalagem específica.
    name: 'Vigor Grego Protein (estimativa)',
    brand: 'Vigor',
    kcal: 76,
    protein: 10,
    carbs: 5.7,
    fat: 0,
    fiber: 0,
    origin: 'estimate',
    code: '996025214174',
    sourceUrl: 'https://www.fatsecret.com.br/',
    units: [['pote', 100]],
  },
  {
    // Valores de referência para a versão morango de 160 g; conferir a embalagem.
    name: 'Danone Mais Proteínas Morango (estimativa)',
    brand: 'Danone',
    kcal: 56.875,
    protein: 6.25,
    carbs: 5.6875,
    fat: 1,
    fiber: 0,
    origin: 'estimate',
    code: '7891025124573',
    sourceUrl: 'https://www.fatsecret.com.br/calorias-nutri%C3%A7%C3%A3o/danone/mais-prote%C3%ADnas-morango/1-unidade',
    units: [['pote', 160]],
  },
  // Lotes adicionais no fim: preserva a prioridade dos resultados já existentes.
  ...ESTIMATES_BATCH4,
  ...USDA_SR_LEGACY_BATCH5,
];

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
  // Grafias correntes no Brasil para a mesma preparação; normalização já remove acentos.
  strogonofe: 'strogonoff', estrogonofe: 'strogonoff', estrogonoff: 'strogonoff',
  bovino: 'carne', bovina: 'carne',
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
    const words = stemAll([f.name, ...(f.aliases ?? [])].join(' ')).split(' ');
    return terms.every((t, i) =>
      words.some((w) => w === t || (w.startsWith(t) && ((i === terms.length - 1 && t.length >= 3) || w.length - t.length <= 2))),
    );
  });
  const score = (f: FoodPer100) => {
    const rank = RANK.get(f.code ?? '') ?? 5000;
    const words = f.name.split(',').length;
    const raw = /\b(cru|crua|crus|cruas)\b/i.test(f.name) ? 3 : 0;
    // Lote 4 (estimativas amplas) só preenche as vagas restantes: nunca passa à frente de TACO/itens anteriores.
    const lateBatch = f.code?.startsWith('estimate-br4-') ? 100 : f.code?.startsWith('usda-sr28-') ? 200 : 0;
    return rank < 0 ? rank : words + raw + lateBatch + rank / 10000;
  };
  return hits.sort((a, b) => score(a) - score(b)).slice(0, limit).map((food) =>
    food.code === 'taco-589' ? { ...food, name: 'Castanha-do-Pará (Castanha-do-Brasil), crua' } : food,
  );
}


/* ---------- Catálogo USDA carregado no Supabase ---------- */
type FoodCatalogRow = {
  fdc_id: number;
  name_en: string;
  name_pt: string | null;
  category_en: string | null;
  kcal: number | string;
  protein_g: number | string;
  fat_g: number | string;
  carbs_g: number | string;
  fiber_g: number | string | null;
};

const CATALOG_SOURCE_URL = 'https://fdc.nal.usda.gov/food-details/';
const CATALOG_LICENSE = 'CC0 1.0';

const CATALOG_ACCENTS: Record<string, string[]> = {
  a: ['á', 'à', 'ã', 'â'], e: ['é', 'ê'], i: ['í'], o: ['ó', 'õ', 'ô'], u: ['ú'], c: ['ç'],
};

function catalogSearchVariants(term: string): string[] {
  const variants = new Set([term]);
  for (let index = 0; index < term.length && variants.size < 12; index += 1) {
    const accents = CATALOG_ACCENTS[term[index]!.toLowerCase()];
    if (!accents) continue;
    for (const current of [...variants]) {
      for (const accent of accents) {
        variants.add(current.slice(0, index) + accent + current.slice(index + 1));
        if (variants.size >= 12) break;
      }
      if (variants.size >= 12) break;
    }
  }
  return [...variants];
}

function catalogNumber(value: number | string | null): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? round1(parsed) : null;
}

/**
 * Pesquisa o catálogo completo do banco. O RLS da tabela exige autenticação;
 * a função não tenta contornar a política nem retorna linhas sem nutrientes essenciais.
 */
export async function searchFoodCatalog(query: string, limit = 20): Promise<FoodPer100[]> {
  const raw = query.trim().replace(/[^\p{L}\p{N}\s-]/gu, ' ').replace(/\s+/g, ' ').slice(0, 100).trim();
  const terms = normalize(raw).split(/\s+/).filter((term) => term.length >= 2 && !['de', 'da', 'do', 'das', 'dos', 'e', 'com', 'em'].includes(term));
  if (!raw || !terms.length) return [];

  const safeLimit = Math.max(1, Math.min(30, Math.floor(limit)));
  const searchableTerms = [...new Set([raw, ...raw.split(/\s+/).filter((term) => term.length >= 3)])];
  const batches = await Promise.all(searchableTerms.slice(0, 4).map(async (term) => {
    const safeTerm = term.replace(/[%_(),]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!safeTerm) return [] as FoodCatalogRow[];
    const variants = catalogSearchVariants(safeTerm);
    const filters = variants.flatMap((variant) => [
      `name_pt.ilike.%${variant}%`,
      `name_en.ilike.%${variant}%`,
    ]);
    const { data, error } = await supabase
      .from('food_catalog')
      .select('fdc_id,name_en,name_pt,kcal,protein_g,fat_g,carbs_g,fiber_g')
      .or(filters.join(','))
      .limit(40);
    if (error) throw new Error('Não foi possível consultar o catálogo de alimentos.');
    return (data ?? []) as FoodCatalogRow[];
  }));

  const unique = new Map<number, FoodCatalogRow>();
  for (const row of batches.flat()) unique.set(row.fdc_id, row);
  const normalizedTerms = terms.map((term) => term.replace(/[^a-z0-9]/g, '')).filter(Boolean);
  return [...unique.values()]
    .filter((row) => {
      const searchable = normalize(`${row.name_pt ?? ''} ${row.name_en ?? ''}`).replace(/[^a-z0-9\s]/g, ' ');
      const words = searchable.split(/\s+/).filter(Boolean);
      return normalizedTerms.every((term) => words.some((word) => word === term || word.startsWith(term)));
    })
    .map((row): FoodPer100 | null => {
      const name = row.name_pt?.trim() || row.name_en?.trim();
      const kcal = catalogNumber(row.kcal);
      const protein = catalogNumber(row.protein_g);
      const carbs = catalogNumber(row.carbs_g);
      const fat = catalogNumber(row.fat_g);
      const fiber = catalogNumber(row.fiber_g);
      if (!name || kcal === null || protein === null || carbs === null || fat === null) return null;
      return {
        name,
        aliases: row.name_en ? [row.name_en] : undefined,
        kcal,
        protein,
        carbs,
        fat,
        fiber: fiber ?? 0,
        reportedNutrients: { protein: true, carbs: true, fat: true, fiber: fiber !== null },
        origin: 'usda',
        code: `usda-fdc-${row.fdc_id}`,
        sourceUrl: `${CATALOG_SOURCE_URL}${row.fdc_id}/nutrients`,
        sourceLicense: CATALOG_LICENSE,
      };
    })
    .filter((food): food is FoodPer100 => food !== null)
    .slice(0, safeLimit);
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
/** Origem exibível e grau de confiança para transparência nutricional. */
export function foodSourceLabel(food: FoodPer100): string {
  if (food.origin === 'local') return 'TACO · NEPA/UNICAMP';
  if (food.origin === 'usda') return 'USDA FoodData Central / SR Legacy via TempoLife';
  if (food.origin === 'off') return 'Open Food Facts · base colaborativa';
  if (food.origin === 'supplement') return 'Catálogo de suplementos SISTCS Leve';
  return food.sourceUrl ? 'Estimativa com referência externa a conferir' : 'Estimativa nutricional caseira';
}

export function foodSourceUrl(food: FoodPer100): string | undefined {
  if (food.sourceUrl) return food.sourceUrl;
  if (food.origin === 'local') return 'https://www.nepa.unicamp.br/taco/';
  if (food.origin === 'usda') return 'https://fdc.nal.usda.gov/';
  if (food.origin === 'off') return 'https://world.openfoodfacts.org/';
  if (food.origin === 'supplement') return undefined;
  return undefined;
}

export function foodConfidence(food: FoodPer100): { level: 'alta' | 'média' | 'baixa'; explanation: string } {
  if (food.origin === 'local') return { level: 'média', explanation: 'Fonte publicada identificada; a cópia do catálogo ainda deve ser conferida com a tabela original, e o preparo real pode diferir.' };
  if (food.origin === 'usda') return { level: 'média', explanation: 'Referência internacional genérica; confira se o alimento e o preparo correspondem.' };
  if (food.origin === 'off') return { level: 'baixa', explanation: 'Registro colaborativo que pode estar incompleto ou desatualizado; confirme marca, variante e nutrientes no rótulo antes de confiar nos valores.' };
  if (food.origin === 'supplement') return { level: 'média', explanation: 'Registro do catálogo do SISTCS Leve; confira a embalagem e a base de porção antes de registrar.' };
  return { level: 'baixa', explanation: 'Valor aproximado; receita, porção e ingredientes podem alterar os nutrientes.' };
}

function canonicalBarcode(value: string): string {
  return value.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
}
function barcodeMatches(expected: string, returned: string): boolean {
  const a = canonicalBarcode(expected);
  const b = canonicalBarcode(returned);
  return Boolean(a && b && a === b);
}

/** Normaliza entrada de leitores/cópia antes de limitar o campo visual a 14 dígitos. */
export function normalizeBarcodeInput(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, 14);
}

/** Pesquisa produtos de suplemento com dados nutricionais efetivamente preenchidos no banco. */
export async function searchSupplementCatalog(query: string, limit = 20): Promise<FoodPer100[]> {
  const raw = query.trim().replace(/[^\p{L}\p{N}\s-]/gu, ' ').replace(/\s+/g, ' ').slice(0, 100).trim();
  if (raw.length < 2) return [];
  const safeLimit = Math.max(1, Math.min(30, Math.floor(limit)));
  const safeTerm = raw.replace(/[%_(),]/g, ' ').replace(/\s+/g, ' ').trim();
  const tokens = safeTerm.split(' ').filter(Boolean).slice(0, 6);
  const filters = tokens.flatMap((token) => [`name.ilike.%${token}%`, `brand.ilike.%${token}%`]);
  const barcode = raw.replace(/\D/g, '');
  if (barcode.length >= 8 && barcode.length <= 14) filters.push(`barcode.eq.${barcode}`);
  const { data, error } = await supabase
    .from('supplement_catalog')
    .select('id,name,brand,barcode,serving_size,nutrition_basis,calories_kcal,protein_g,carbohydrates_g,total_fat_g,saturated_fat_g,fiber_g,sugars_g,sodium_mg,micronutrients,ingredients,source_url,data_status')
    .or(filters.join(','))
    // Não exibe termos de busca nem produtos ainda sem rótulo nutricional verificado.
    .eq('data_status', 'label_transcribed')
    .not('calories_kcal', 'is', null)
    .not('protein_g', 'is', null)
    .not('carbohydrates_g', 'is', null)
    .not('total_fat_g', 'is', null)
    .limit(safeLimit);
  if (error) {
    // Não quebra a busca principal caso a tabela esteja temporariamente indisponível.
    return [];
  }
  return (data ?? []).flatMap((row: any): FoodPer100[] => {
    const name = typeof row.name === 'string' ? row.name.trim() : '';
    const kcal = catalogNumber(row.calories_kcal);
    const protein = catalogNumber(row.protein_g);
    const carbs = catalogNumber(row.carbohydrates_g);
    const fat = catalogNumber(row.total_fat_g);
    const fiber = catalogNumber(row.fiber_g);
    if (!name || kcal === null || protein === null || carbs === null || fat === null) return [];
    return [{
      name, brand: typeof row.brand === 'string' ? row.brand : undefined,
      kcal, protein, carbs, fat, fiber: fiber ?? 0,
      saturatedFat: catalogNumber(row.saturated_fat_g) ?? undefined,
      sugars: catalogNumber(row.sugars_g) ?? undefined,
      sodiumMg: catalogNumber(row.sodium_mg) ?? undefined,
      servingSize: typeof row.serving_size === 'string' ? row.serving_size : undefined,
      ingredients: typeof row.ingredients === 'string' ? row.ingredients : undefined,
      micronutrients: row.micronutrients && typeof row.micronutrients === 'object' && !Array.isArray(row.micronutrients) ? row.micronutrients as Record<string, number | string> : undefined,
      basis: row.nutrition_basis === '100ml' ? '100ml' : '100g',
      reportedNutrients: { protein: true, carbs: true, fat: true, fiber: fiber !== null },
      origin: 'supplement', code: typeof row.barcode === 'string' ? row.barcode : `supplement-${row.id}`,
      sourceUrl: typeof row.source_url === 'string' ? row.source_url : undefined,
      sourceLicense: 'Dados transcritos do rótulo/ficha do fabricante; confira a embalagem',
    }];
  });
}

export async function lookupBarcode(code: string, signal?: AbortSignal): Promise<FoodPer100 | null> {
  // Leitores e campos manuais podem inserir espaços ou hífens; não enviar caracteres inesperados à API.
  const normalizedCode = code.trim().replace(/[\s-]/g, '');
  if (!normalizedCode || !/^\d+$/.test(normalizedCode) || signal?.aborted) return null;
  // Prioriza produtos de suplementos cadastrados no banco, quando o rótulo já foi conferido.
  const { data: supplementRows } = await supabase
    .from('supplement_catalog')
    .select('id,name,brand,barcode,serving_size,nutrition_basis,calories_kcal,protein_g,carbohydrates_g,total_fat_g,saturated_fat_g,fiber_g,sugars_g,sodium_mg,micronutrients,ingredients,source_url')
    .eq('barcode', normalizedCode)
    .not('calories_kcal', 'is', null)
    .not('protein_g', 'is', null)
    .not('carbohydrates_g', 'is', null)
    .not('total_fat_g', 'is', null)
    .limit(1);
  const supplement = supplementRows?.[0] as any;
  if (supplement) {
    const kcal = catalogNumber(supplement.calories_kcal);
    const protein = catalogNumber(supplement.protein_g);
    const carbs = catalogNumber(supplement.carbohydrates_g);
    const fat = catalogNumber(supplement.total_fat_g);
    if (kcal !== null && protein !== null && carbs !== null && fat !== null) {
      return {
        name: supplement.name, brand: supplement.brand ?? undefined, kcal, protein, carbs, fat,
        fiber: catalogNumber(supplement.fiber_g) ?? 0,
        saturatedFat: catalogNumber(supplement.saturated_fat_g) ?? undefined,
        sugars: catalogNumber(supplement.sugars_g) ?? undefined,
        sodiumMg: catalogNumber(supplement.sodium_mg) ?? undefined,
        servingSize: typeof supplement.serving_size === 'string' ? supplement.serving_size : undefined,
        ingredients: typeof supplement.ingredients === 'string' ? supplement.ingredients : undefined,
        micronutrients: supplement.micronutrients && typeof supplement.micronutrients === 'object' && !Array.isArray(supplement.micronutrients) ? supplement.micronutrients as Record<string, number | string> : undefined,
        basis: supplement.nutrition_basis === '100ml' ? '100ml' : '100g',
        origin: 'supplement', code: normalizedCode, sourceUrl: supplement.source_url ?? undefined,
        sourceLicense: 'Dados de rótulo/cadastro do produto; conferir embalagem',
      };
    }
  }
  // Produtos genéricos locais continuam disponíveis antes da consulta externa.
  const localMatch = FOODS_BR.find((food) => food.code === normalizedCode);
  if (localMatch) return { ...localMatch };
  const res = await fetch(`${OFF}/api/v2/product/${encodeURIComponent(normalizedCode)}.json?fields=${FIELDS}`, { signal });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('A consulta de código de barras está indisponível agora.');
  const json = await res.json();
  if (json.status !== 1 || !json.product) return null;
  const returnedCode = String(json.product.code ?? '');
  // Nunca associar os nutrientes de um produto a outro código por resposta inesperada da API.
  if (!barcodeMatches(normalizedCode, returnedCode)) return null;
  return fromOff(json.product);
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
const HOME_UNITS: Record<string, number> = { 'colher de sopa': 15, 'colher de sobremesa': 10, 'colher de cha': 5, xicara: 240, copo: 200, concha: 100, fatia: 30, pote: 170, lata: 350, unidade: 0, un: 0 };

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
      if (kind === 'sopa' || kind === 'sobremesa' || kind === 'cha') return [`colher de ${kind}`, 3];
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

const SHOW: Record<string, string> = { porcao: 'porção', pao: 'pão', maca: 'maçã', file: 'filé', xicara: 'xícara', 'colher de cha': 'colher de chá', 'colher de sobremesa': 'colher de sobremesa' };
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