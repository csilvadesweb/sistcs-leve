export type RecipeCategory = 'Café da manhã' | 'Almoço e jantar' | 'Lanches' | 'Vegetariana';
export type RecipeTag = 'Brasileira' | 'Fitness';
export type RecipeFilter = RecipeCategory | RecipeTag | 'Todas';

export interface RecipeNutrients {
  calories: number;
  proteins: number;
  carbohydrates: number;
  fats: number;
  fiber: number;
}

export interface Recipe {
  id: string;
  name: string;
  category: RecipeCategory;
  tags?: RecipeTag[];
  description: string;
  minutes: number;
  servings: number;
  ingredients: string[];
  steps: string[];
  nutrientsPerServing: RecipeNutrients;
  nutritionNote: string;
}

/**
 * Catálogo inicial editorial do SISTCS Leve.
 * Valores nutricionais são estimativas por porção, não substituem rótulos ou avaliação profissional.
 * As receitas e os textos são próprios; o catálogo não copia conteúdo dos concorrentes.
 */
export const RECIPES: Recipe[] = [
  {
    id: 'overnight-aveia-banana',
    name: 'Aveia com banana e iogurte',
    category: 'Café da manhã',
    tags: ['Fitness'],
    description: 'Preparação simples para deixar pronta na geladeira.',
    minutes: 5, servings: 1,
    ingredients: ['40 g de aveia em flocos', '1 banana média (80 g comestíveis)', '170 g de iogurte natural', 'Canela a gosto'],
    steps: ['Misture a aveia e o iogurte em um pote.', 'Adicione a banana fatiada e a canela.', 'Consuma na hora ou mantenha refrigerado até o dia seguinte.'],
    nutrientsPerServing: { calories: 330, proteins: 13, carbohydrates: 57, fats: 6, fiber: 7 },
    nutritionNote: 'Estimativa por porção; varia conforme o iogurte e o tamanho da banana.',
  },
  {
    id: 'omelete-tomate',
    name: 'Omelete de tomate',
    category: 'Café da manhã',
    tags: ['Fitness'],
    description: 'Ovos com tomate e temperos, feitos em poucos minutos.',
    minutes: 10, servings: 1,
    ingredients: ['2 ovos', '1/2 tomate médio', '1 colher de chá de azeite', 'Sal e cheiro-verde a gosto'],
    steps: ['Bata os ovos e misture o tomate picado.', 'Aqueça o azeite em frigideira antiaderente.', 'Cozinhe em fogo baixo até firmar, virando se necessário.'],
    nutrientsPerServing: { calories: 225, proteins: 14, carbohydrates: 4, fats: 17, fiber: 1 },
    nutritionNote: 'Estimativa por porção; o óleo e o tamanho dos ovos alteram os valores.',
  },
  {
    id: 'tapioca-queijo',
    name: 'Tapioca com queijo',
    category: 'Café da manhã',
    tags: ['Brasileira'],
    description: 'Clássico rápido com recheio simples.',
    minutes: 8, servings: 1,
    ingredients: ['60 g de goma de tapioca hidratada', '30 g de queijo minas', 'Orégano a gosto'],
    steps: ['Espalhe a goma em frigideira antiaderente aquecida.', 'Quando unir, acrescente o queijo e o orégano.', 'Dobre e aqueça até o recheio amolecer.'],
    nutrientsPerServing: { calories: 250, proteins: 7, carbohydrates: 43, fats: 6, fiber: 1 },
    nutritionNote: 'Estimativa por porção; confira o rótulo da goma e do queijo utilizados.',
  },
  {
    id: 'arroz-feijao-frango',
    name: 'Prato brasileiro: arroz, feijão e frango',
    category: 'Almoço e jantar',
    tags: ['Brasileira', 'Fitness'],
    description: 'Combinação caseira com proteína e acompanhamentos.',
    minutes: 25, servings: 1,
    ingredients: ['100 g de arroz cozido', '100 g de feijão cozido', '120 g de peito de frango grelhado', 'Salada de folhas e tomate a gosto'],
    steps: ['Prepare ou aqueça o arroz e o feijão.', 'Grelhe o frango até cozinhar por completo.', 'Sirva com salada higienizada.'],
    nutrientsPerServing: { calories: 480, proteins: 45, carbohydrates: 53, fats: 8, fiber: 10 },
    nutritionNote: 'Estimativa por porção; cortes, óleo e receitas de preparo modificam os valores.',
  },
  {
    id: 'salada-grao-de-bico',
    name: 'Salada de grão-de-bico',
    category: 'Vegetariana',
    tags: ['Fitness'],
    description: 'Salada fria com leguminosa, tomate e limão.',
    minutes: 15, servings: 1,
    ingredients: ['150 g de grão-de-bico cozido', '1 tomate médio', '1/4 de cebola', '1 colher de chá de azeite', 'Limão e cheiro-verde a gosto'],
    steps: ['Escorra o grão-de-bico cozido.', 'Pique o tomate e a cebola.', 'Misture tudo e tempere com azeite, limão e cheiro-verde.'],
    nutrientsPerServing: { calories: 310, proteins: 14, carbohydrates: 45, fats: 9, fiber: 12 },
    nutritionNote: 'Estimativa por porção; considera grão-de-bico cozido e escorrido.',
  },
  {
    id: 'sanduiche-frango',
    name: 'Sanduíche de frango e salada',
    category: 'Lanches',
    tags: ['Fitness'],
    description: 'Lanche prático com pão, frango e vegetais.',
    minutes: 10, servings: 1,
    ingredients: ['2 fatias de pão integral', '80 g de frango cozido desfiado', '2 folhas de alface', '2 rodelas de tomate', '1 colher de sopa de iogurte natural'],
    steps: ['Misture o frango com o iogurte.', 'Recheie o pão com o frango, a alface e o tomate.', 'Sirva imediatamente.'],
    nutrientsPerServing: { calories: 300, proteins: 27, carbohydrates: 34, fats: 6, fiber: 6 },
    nutritionNote: 'Estimativa por porção; marcas e tamanho do pão podem alterar os valores.',
  },
  {
    id: 'iogurte-fruta-castanhas',
    name: 'Iogurte com fruta e castanhas',
    category: 'Lanches',
    tags: ['Fitness'],
    description: 'Combinação rápida para um lanche.',
    minutes: 3, servings: 1,
    ingredients: ['170 g de iogurte natural', '1 maçã pequena picada', '10 g de castanhas sem sal'],
    steps: ['Pique a maçã.', 'Coloque o iogurte em uma tigela.', 'Adicione a maçã e as castanhas picadas.'],
    nutrientsPerServing: { calories: 250, proteins: 9, carbohydrates: 30, fats: 11, fiber: 4 },
    nutritionNote: 'Estimativa por porção; o tipo de castanha e o iogurte mudam os valores.',
  },
  {
    id: 'mingau-aveia',
    name: 'Mingau de aveia com canela',
    category: 'Café da manhã',
    tags: ['Fitness'],
    description: 'Mingau quente com poucos ingredientes.',
    minutes: 7, servings: 1,
    ingredients: ['30 g de aveia em flocos', '200 ml de leite', 'Canela a gosto'],
    steps: ['Misture a aveia e o leite em uma panela.', 'Mexa em fogo baixo até engrossar.', 'Finalize com canela.'],
    nutrientsPerServing: { calories: 235, proteins: 11, carbohydrates: 32, fats: 7, fiber: 4 },
    nutritionNote: 'Estimativa por porção; calculada com leite de vaca sem açúcar adicionado.',
  },
  {
    id: 'legumes-ovo',
    name: 'Legumes salteados com ovo',
    category: 'Vegetariana',
    tags: ['Fitness'],
    description: 'Uma opção colorida para almoço leve ou jantar.',
    minutes: 15, servings: 1,
    ingredients: ['1 ovo', '100 g de abobrinha', '80 g de cenoura', '1 colher de chá de azeite', 'Alho e ervas a gosto'],
    steps: ['Corte os legumes em pedaços pequenos.', 'Salteie no azeite até ficarem macios.', 'Adicione o ovo batido e mexa até cozinhar por completo.'],
    nutrientsPerServing: { calories: 190, proteins: 9, carbohydrates: 17, fats: 10, fiber: 5 },
    nutritionNote: 'Estimativa por porção; depende da quantidade de azeite utilizada.',
  },
  {
    id: 'vitamina-banana',
    name: 'Vitamina de banana',
    category: 'Lanches',
    tags: ['Fitness'],
    description: 'Bebida cremosa sem açúcar adicionado.',
    minutes: 4, servings: 1,
    ingredients: ['1 banana média', '200 ml de leite', 'Canela a gosto'],
    steps: ['Coloque a banana e o leite no liquidificador.', 'Bata até ficar homogêneo.', 'Adicione canela e sirva.'],
    nutrientsPerServing: { calories: 205, proteins: 8, carbohydrates: 35, fats: 5, fiber: 3 },
    nutritionNote: 'Estimativa por porção; o leite e o tamanho da banana alteram os valores.',
  },
  {
    id: 'macarrao-tomate',
    name: 'Macarrão com molho de tomate',
    category: 'Almoço e jantar',
    tags: ['Brasileira'],
    description: 'Massa com molho simples de tomate e ervas.',
    minutes: 20, servings: 1,
    ingredients: ['150 g de macarrão cozido', '120 g de tomate triturado', '1 colher de chá de azeite', 'Alho e manjericão a gosto'],
    steps: ['Cozinhe a massa conforme a embalagem.', 'Refogue o alho no azeite e adicione o tomate.', 'Cozinhe o molho por alguns minutos, junte a massa e finalize com manjericão.'],
    nutrientsPerServing: { calories: 340, proteins: 11, carbohydrates: 62, fats: 6, fiber: 5 },
    nutritionNote: 'Estimativa por porção; não inclui queijo ou outros acompanhamentos.',
  },
  {
    id: 'creme-abacate-cacau',
    name: 'Creme de abacate com cacau',
    category: 'Lanches',
    tags: ['Fitness'],
    description: 'Sobremesa cremosa com cacau sem açúcar.',
    minutes: 5, servings: 1,
    ingredients: ['100 g de abacate', '1 colher de chá de cacau em pó sem açúcar', 'Canela a gosto'],
    steps: ['Amasse o abacate até ficar cremoso.', 'Misture o cacau e a canela.', 'Sirva na hora.'],
    nutrientsPerServing: { calories: 175, proteins: 3, carbohydrates: 10, fats: 15, fiber: 7 },
    nutritionNote: 'Estimativa por porção; não inclui açúcar, mel ou outros adoçantes.',
  },
];

export function filterRecipes(recipes: Recipe[], query: string, category: RecipeFilter = 'Todas'): Recipe[] {
  const normalized = query.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
  const filtered = recipes.filter((recipe) => {
    const matchesCategory = category === 'Todas'
      || recipe.category === category
      || (category === 'Brasileira' && recipe.tags?.includes('Brasileira'))
      || (category === 'Fitness' && recipe.tags?.includes('Fitness'));
    if (!matchesCategory) return false;
    if (!normalized) return true;
    const haystack = [recipe.name, recipe.description, recipe.category, ...(recipe.tags ?? []), ...recipe.ingredients]
      .join(' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
    return haystack.includes(normalized);
  });

  // Em "Todas", prioriza receitas brasileiras; em seguida, receitas Fitness.
  // A ordem original é preservada dentro de cada grupo.
  if (category !== 'Todas') return filtered;
  const priority = (recipe: Recipe) => recipe.tags?.includes('Brasileira') ? 0 : recipe.tags?.includes('Fitness') ? 1 : 2;
  return filtered.map((recipe, index) => ({ recipe, index }))
    .sort((a, b) => priority(a.recipe) - priority(b.recipe) || a.index - b.index)
    .map(({ recipe }) => recipe);
}

export function scaleRecipeNutrients(nutrients: RecipeNutrients, servings: number): RecipeNutrients {
  const safeServings = Number.isFinite(servings) ? Math.min(20, Math.max(0.25, servings)) : 1;
  return {
    calories: Math.round(nutrients.calories * safeServings * 10) / 10,
    proteins: Math.round(nutrients.proteins * safeServings * 10) / 10,
    carbohydrates: Math.round(nutrients.carbohydrates * safeServings * 10) / 10,
    fats: Math.round(nutrients.fats * safeServings * 10) / 10,
    fiber: Math.round(nutrients.fiber * safeServings * 10) / 10,
  };
}
