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

  {
    id: 'cuscuz-ovo', name: 'Cuscuz de milho com ovo', category: 'Café da manhã', tags: ['Brasileira', 'Fitness'],
    description: 'Cuscuz nordestino servido com ovo cozido ou mexido.', minutes: 12, servings: 1,
    ingredients: ['100 g de cuscuz de milho cozido', '1 ovo', '1 colher de chá de azeite', 'Sal e cheiro-verde a gosto'],
    steps: ['Hidrate e cozinhe o flocão conforme a embalagem.', 'Prepare o ovo com pouco azeite.', 'Sirva junto e finalize com cheiro-verde.'],
    nutrientsPerServing: { calories: 245, proteins: 9, carbohydrates: 34, fats: 8, fiber: 3 },
    nutritionNote: 'Estimativa por porção; varia conforme o flocão e a gordura usada no preparo.',
  },
  {
    id: 'pao-queijo-frigideira', name: 'Pão de queijo de frigideira', category: 'Café da manhã', tags: ['Brasileira'],
    description: 'Versão rápida com tapioca, ovo e queijo.', minutes: 10, servings: 1,
    ingredients: ['1 ovo', '2 colheres de sopa de goma de tapioca (30 g)', '30 g de queijo minas ralado', 'Orégano a gosto'],
    steps: ['Misture o ovo, a tapioca e o queijo.', 'Despeje em frigideira antiaderente aquecida.', 'Doure dos dois lados e sirva.'],
    nutrientsPerServing: { calories: 265, proteins: 13, carbohydrates: 22, fats: 13, fiber: 0.5 },
    nutritionNote: 'Estimativa por porção; marcas e tipos de queijo alteram os valores.',
  },
  {
    id: 'crepioca-frango', name: 'Crepioca recheada com frango', category: 'Café da manhã', tags: ['Brasileira', 'Fitness'],
    description: 'Crepioca com recheio de frango desfiado.', minutes: 12, servings: 1,
    ingredients: ['1 ovo', '2 colheres de sopa de goma de tapioca (30 g)', '70 g de frango cozido desfiado', 'Tomate e orégano a gosto'],
    steps: ['Bata o ovo com a tapioca.', 'Cozinhe a massa em frigideira antiaderente.', 'Recheie com frango e tomate e dobre.'],
    nutrientsPerServing: { calories: 290, proteins: 27, carbohydrates: 24, fats: 9, fiber: 1 },
    nutritionNote: 'Estimativa por porção; depende do tamanho do ovo e do preparo do frango.',
  },
  {
    id: 'iogurte-mamao-aveia', name: 'Iogurte com mamão e aveia', category: 'Café da manhã', tags: ['Brasileira', 'Fitness'],
    description: 'Tigela fresca com fruta e cereal integral.', minutes: 4, servings: 1,
    ingredients: ['170 g de iogurte natural', '120 g de mamão', '20 g de aveia em flocos', 'Canela a gosto'],
    steps: ['Corte o mamão em cubos.', 'Coloque o iogurte em uma tigela.', 'Acrescente mamão, aveia e canela.'],
    nutrientsPerServing: { calories: 225, proteins: 10, carbohydrates: 34, fats: 5, fiber: 5 },
    nutritionNote: 'Estimativa por porção; varia com o iogurte e a variedade do mamão.',
  },
  {
    id: 'panqueca-banana-aveia', name: 'Panqueca de banana e aveia', category: 'Café da manhã', tags: ['Fitness'],
    description: 'Panqueca simples sem açúcar adicionado.', minutes: 10, servings: 1,
    ingredients: ['1 banana média', '1 ovo', '25 g de aveia', 'Canela a gosto'],
    steps: ['Amasse a banana e misture com ovo, aveia e canela.', 'Despeje porções pequenas em frigideira antiaderente.', 'Doure dos dois lados em fogo baixo.'],
    nutrientsPerServing: { calories: 255, proteins: 10, carbohydrates: 37, fats: 8, fiber: 5 },
    nutritionNote: 'Estimativa por porção; não inclui coberturas ou óleo adicional.',
  },
  {
    id: 'arroz-integral-carne-moida', name: 'Arroz integral com carne moída e legumes', category: 'Almoço e jantar', tags: ['Brasileira', 'Fitness'],
    description: 'Refeição caseira com proteína e vegetais.', minutes: 25, servings: 1,
    ingredients: ['120 g de arroz integral cozido', '100 g de patinho moído cozido', '80 g de cenoura e abobrinha', '1 colher de chá de azeite', 'Alho e temperos a gosto'],
    steps: ['Refogue alho e legumes com o azeite.', 'Acrescente a carne e cozinhe completamente.', 'Sirva com o arroz integral.'],
    nutrientsPerServing: { calories: 430, proteins: 31, carbohydrates: 42, fats: 14, fiber: 6 },
    nutritionNote: 'Estimativa por porção; o teor de gordura depende do corte e do preparo.',
  },
  {
    id: 'peixe-assado-batata', name: 'Peixe assado com batata e limão', category: 'Almoço e jantar', tags: ['Brasileira', 'Fitness'],
    description: 'Filé assado com acompanhamento simples.', minutes: 30, servings: 1,
    ingredients: ['150 g de filé de tilápia', '180 g de batata', '1 colher de chá de azeite', 'Limão, alho e ervas a gosto'],
    steps: ['Corte a batata e tempere com parte do azeite.', 'Tempere o peixe com limão, alho e ervas.', 'Asse até a batata ficar macia e o peixe completamente cozido.'],
    nutrientsPerServing: { calories: 360, proteins: 34, carbohydrates: 38, fats: 8, fiber: 4 },
    nutritionNote: 'Estimativa por porção; espécie de peixe e quantidade de azeite alteram os valores.',
  },
  {
    id: 'frango-abobora', name: 'Frango grelhado com purê de abóbora', category: 'Almoço e jantar', tags: ['Fitness'],
    description: 'Prato com proteína magra e purê de abóbora.', minutes: 25, servings: 1,
    ingredients: ['130 g de peito de frango', '220 g de abóbora cozida', '1 colher de chá de azeite', 'Alho, pimenta e sal a gosto'],
    steps: ['Cozinhe a abóbora até ficar macia e amasse.', 'Grelhe o frango até cozinhar por completo.', 'Tempere e sirva com o purê.'],
    nutrientsPerServing: { calories: 310, proteins: 38, carbohydrates: 24, fats: 7, fiber: 5 },
    nutritionNote: 'Estimativa por porção; varia conforme o corte e o tipo de abóbora.',
  },
  {
    id: 'feijao-tropeiro-leve', name: 'Feijão tropeiro leve', category: 'Almoço e jantar', tags: ['Brasileira'],
    description: 'Versão caseira com feijão, ovo e couve.', minutes: 25, servings: 2,
    ingredients: ['250 g de feijão cozido escorrido', '2 ovos', '60 g de farinha de mandioca', '1 xícara de couve fatiada', '1 colher de chá de azeite', 'Alho e cheiro-verde a gosto'],
    steps: ['Refogue alho e couve no azeite.', 'Adicione os ovos mexidos e o feijão.', 'Misture a farinha aos poucos e finalize com cheiro-verde.'],
    nutrientsPerServing: { calories: 330, proteins: 15, carbohydrates: 43, fats: 10, fiber: 11 },
    nutritionNote: 'Estimativa por porção, considerando duas porções e sem carnes adicionais.',
  },
  {
    id: 'omelete-espinafre-ricota', name: 'Omelete de espinafre com ricota', category: 'Almoço e jantar', tags: ['Fitness'],
    description: 'Omelete com folhas e queijo fresco.', minutes: 12, servings: 1,
    ingredients: ['2 ovos', '50 g de ricota', '1 xícara de espinafre', '1 colher de chá de azeite', 'Pimenta e ervas a gosto'],
    steps: ['Refogue rapidamente o espinafre.', 'Bata os ovos e misture a ricota esfarelada.', 'Junte o espinafre e cozinhe em frigideira antiaderente.'],
    nutrientsPerServing: { calories: 280, proteins: 21, carbohydrates: 5, fats: 19, fiber: 2 },
    nutritionNote: 'Estimativa por porção; depende do queijo e da quantidade de azeite.',
  },
  {
    id: 'lentilha-arroz-legumes', name: 'Lentilha com arroz e legumes', category: 'Almoço e jantar', tags: ['Brasileira', 'Fitness'],
    description: 'Refeição vegetal com leguminosas e grãos.', minutes: 25, servings: 1,
    ingredients: ['120 g de lentilha cozida', '100 g de arroz integral cozido', '100 g de cenoura e abobrinha', '1 colher de chá de azeite', 'Alho e cominho a gosto'],
    steps: ['Refogue alho e legumes com azeite.', 'Adicione a lentilha cozida e os temperos.', 'Sirva com arroz integral.'],
    nutrientsPerServing: { calories: 365, proteins: 17, carbohydrates: 62, fats: 7, fiber: 15 },
    nutritionNote: 'Estimativa por porção; considera lentilha e arroz já cozidos.',
  },
  {
    id: 'macarrao-frango-brocolis', name: 'Macarrão integral com frango e brócolis', category: 'Almoço e jantar', tags: ['Fitness'],
    description: 'Massa integral com frango e vegetais.', minutes: 25, servings: 1,
    ingredients: ['150 g de macarrão integral cozido', '100 g de frango cozido em cubos', '100 g de brócolis cozido', '1 colher de chá de azeite', 'Alho e limão a gosto'],
    steps: ['Cozinhe a massa conforme a embalagem.', 'Salteie alho, brócolis e frango com azeite.', 'Misture a massa e finalize com limão.'],
    nutrientsPerServing: { calories: 420, proteins: 36, carbohydrates: 49, fats: 9, fiber: 9 },
    nutritionNote: 'Estimativa por porção; não inclui molhos cremosos ou queijo.',
  },
  {
    id: 'escondidinho-mandioca-frango', name: 'Escondidinho de mandioca com frango', category: 'Almoço e jantar', tags: ['Brasileira'],
    description: 'Camadas de purê de mandioca e frango temperado.', minutes: 35, servings: 2,
    ingredients: ['300 g de mandioca cozida', '200 g de frango desfiado', '60 ml de leite', '30 g de queijo minas', 'Alho, cebola e cheiro-verde a gosto'],
    steps: ['Amasse a mandioca com o leite até formar purê.', 'Refogue o frango com cebola, alho e cheiro-verde.', 'Monte em refratário, cubra com queijo e leve ao forno para aquecer e gratinar.'],
    nutrientsPerServing: { calories: 390, proteins: 29, carbohydrates: 48, fats: 8, fiber: 4 },
    nutritionNote: 'Estimativa por porção, considerando duas porções e queijo em quantidade moderada.',
  },
  {
    id: 'tofu-legumes-arroz', name: 'Tofu salteado com legumes e arroz', category: 'Vegetariana', tags: ['Fitness'],
    description: 'Prato vegetal com tofu, legumes e arroz.', minutes: 20, servings: 1,
    ingredients: ['120 g de tofu firme', '100 g de arroz cozido', '150 g de brócolis e cenoura', '1 colher de chá de azeite', 'Shoyu com teor reduzido de sódio a gosto'],
    steps: ['Seque o tofu e corte em cubos.', 'Doure o tofu com azeite e adicione os legumes.', 'Tempere moderadamente e sirva com arroz.'],
    nutrientsPerServing: { calories: 345, proteins: 19, carbohydrates: 39, fats: 12, fiber: 6 },
    nutritionNote: 'Estimativa por porção; tofu e shoyu variam entre marcas.',
  },
  {
    id: 'salada-quinoa-frango', name: 'Salada de quinoa com frango', category: 'Almoço e jantar', tags: ['Fitness'],
    description: 'Salada completa com grãos, frango e vegetais.', minutes: 20, servings: 1,
    ingredients: ['100 g de quinoa cozida', '100 g de frango grelhado', '1 tomate médio', '1/2 pepino', '1 colher de chá de azeite', 'Limão a gosto'],
    steps: ['Deixe a quinoa cozida esfriar.', 'Corte o frango e os vegetais.', 'Misture tudo e tempere com azeite e limão.'],
    nutrientsPerServing: { calories: 390, proteins: 35, carbohydrates: 34, fats: 12, fiber: 6 },
    nutritionNote: 'Estimativa por porção; considera quinoa cozida e frango sem pele.',
  },
  {
    id: 'wrap-frango-iogurte', name: 'Wrap integral de frango com iogurte', category: 'Lanches', tags: ['Fitness'],
    description: 'Lanche prático com frango e molho de iogurte.', minutes: 10, servings: 1,
    ingredients: ['1 tortilha integral média', '80 g de frango cozido desfiado', '2 colheres de sopa de iogurte natural', 'Alface e tomate a gosto'],
    steps: ['Misture o frango com o iogurte.', 'Distribua o recheio e os vegetais na tortilha.', 'Enrole firmemente e sirva.'],
    nutrientsPerServing: { calories: 310, proteins: 27, carbohydrates: 34, fats: 7, fiber: 5 },
    nutritionNote: 'Estimativa por porção; tortilhas comerciais variam bastante.',
  },
  {
    id: 'pipoca-caseira', name: 'Pipoca caseira com ervas', category: 'Lanches', tags: ['Fitness'],
    description: 'Lanche crocante com pouco óleo e temperos.', minutes: 8, servings: 2,
    ingredients: ['50 g de milho para pipoca', '1 colher de chá de azeite', 'Páprica e orégano a gosto'],
    steps: ['Aqueça o azeite em panela com tampa.', 'Adicione o milho e mexa até começar a estourar.', 'Tampe, agite ocasionalmente e tempere depois de pronta.'],
    nutrientsPerServing: { calories: 115, proteins: 3, carbohydrates: 21, fats: 3, fiber: 4 },
    nutritionNote: 'Estimativa por porção, considerando duas porções e pouco óleo.',
  },
  {
    id: 'edamame-limao', name: 'Edamame com limão e páprica', category: 'Lanches', tags: ['Fitness'],
    description: 'Lanche vegetal rico em proteína e fibras.', minutes: 8, servings: 1,
    ingredients: ['150 g de edamame sem casca', 'Limão a gosto', 'Páprica e pouco sal a gosto'],
    steps: ['Cozinhe o edamame conforme a embalagem.', 'Escorra bem.', 'Tempere com limão e páprica e sirva.'],
    nutrientsPerServing: { calories: 185, proteins: 18, carbohydrates: 14, fats: 8, fiber: 7 },
    nutritionNote: 'Estimativa por porção; confira os valores nutricionais do produto utilizado.',
  },
  {
    id: 'maca-assada-canela', name: 'Maçã assada com canela e iogurte', category: 'Lanches', tags: ['Fitness'],
    description: 'Sobremesa de fruta sem açúcar adicionado.', minutes: 18, servings: 1,
    ingredients: ['1 maçã média', '100 g de iogurte natural', 'Canela a gosto'],
    steps: ['Corte a maçã ao meio e retire as sementes.', 'Asse até ficar macia.', 'Sirva com iogurte e canela.'],
    nutrientsPerServing: { calories: 145, proteins: 5, carbohydrates: 29, fats: 2, fiber: 5 },
    nutritionNote: 'Estimativa por porção; não inclui mel, açúcar ou granola.',
  },
  {
    id: 'pasta-grao-bico-cenoura', name: 'Pasta de grão-de-bico com cenoura', category: 'Lanches', tags: ['Fitness'],
    description: 'Pasta vegetal para acompanhar pão ou vegetais crus.', minutes: 10, servings: 3,
    ingredients: ['200 g de grão-de-bico cozido', '1 cenoura pequena cozida', '1 colher de chá de azeite', 'Suco de limão', 'Alho e cominho a gosto'],
    steps: ['Processe o grão-de-bico com a cenoura.', 'Adicione azeite, limão e temperos.', 'Ajuste a textura com um pouco de água e refrigere.'],
    nutrientsPerServing: { calories: 120, proteins: 5, carbohydrates: 18, fats: 3, fiber: 5 },
    nutritionNote: 'Estimativa por porção, considerando três porções e sem pão ou acompanhamentos.',
  },
  {
    id: 'smoothie-morango-banana', name: 'Vitamina de morango e banana', category: 'Lanches', tags: ['Fitness'],
    description: 'Bebida de frutas com iogurte natural.', minutes: 5, servings: 1,
    ingredients: ['100 g de morangos', '1/2 banana média', '150 g de iogurte natural', 'Água e gelo a gosto'],
    steps: ['Lave os morangos e retire as folhas.', 'Bata as frutas com o iogurte.', 'Adicione água ou gelo até atingir a textura desejada.'],
    nutrientsPerServing: { calories: 165, proteins: 8, carbohydrates: 27, fats: 3, fiber: 4 },
    nutritionNote: 'Estimativa por porção; não inclui açúcar, mel ou suplementos.',
  },
  {
    id: 'bolinho-atum-forno', name: 'Bolinho assado de atum e batata', category: 'Lanches', tags: ['Fitness'],
    description: 'Bolinho de forno com atum e batata cozida.', minutes: 30, servings: 3,
    ingredients: ['1 lata de atum em água escorrido (120 g)', '250 g de batata cozida', '1 ovo', 'Cheiro-verde e pimenta a gosto'],
    steps: ['Amasse a batata e misture com atum, ovo e temperos.', 'Modele bolinhos pequenos.', 'Asse em forno preaquecido até firmarem e dourarem levemente.'],
    nutrientsPerServing: { calories: 155, proteins: 14, carbohydrates: 19, fats: 3, fiber: 2 },
    nutritionNote: 'Estimativa por porção, considerando três porções e atum escorrido.',
  },
  {
    id: 'salada-frutas-chia', name: 'Salada de frutas com chia', category: 'Lanches', tags: ['Fitness'],
    description: 'Frutas frescas com sementes de chia.', minutes: 7, servings: 1,
    ingredients: ['80 g de mamão', '1/2 maçã', '80 g de abacaxi', '1 colher de chá de chia', 'Suco de limão a gosto'],
    steps: ['Higienize e corte as frutas.', 'Misture em uma tigela.', 'Adicione chia e algumas gotas de limão.'],
    nutrientsPerServing: { calories: 165, proteins: 3, carbohydrates: 36, fats: 3, fiber: 7 },
    nutritionNote: 'Estimativa por porção; depende das frutas e quantidades utilizadas.',
  },
  {
    id: 'sopa-lentilha-cenoura', name: 'Sopa de lentilha com cenoura', category: 'Almoço e jantar', tags: ['Brasileira', 'Fitness'],
    description: 'Sopa reconfortante de leguminosas e vegetais.', minutes: 30, servings: 2,
    ingredients: ['180 g de lentilha cozida', '1 cenoura média', '1/2 cebola', '500 ml de água ou caldo sem excesso de sódio', '1 colher de chá de azeite', 'Alho e cominho a gosto'],
    steps: ['Refogue cebola e alho com azeite.', 'Adicione cenoura, lentilha e líquido.', 'Cozinhe até a cenoura ficar macia e ajuste os temperos.'],
    nutrientsPerServing: { calories: 210, proteins: 12, carbohydrates: 34, fats: 4, fiber: 10 },
    nutritionNote: 'Estimativa por porção, considerando duas porções e caldo com pouco sódio.',
  },
  {
    id: 'abobrinha-recheada-carne', name: 'Abobrinha recheada com carne moída', category: 'Almoço e jantar', tags: ['Fitness'],
    description: 'Abobrinha assada recheada com carne e tomate.', minutes: 30, servings: 1,
    ingredients: ['1 abobrinha média', '100 g de patinho moído cozido', '100 g de tomate picado', '20 g de queijo minas', 'Alho e ervas a gosto'],
    steps: ['Corte a abobrinha ao meio e retire parte do miolo.', 'Misture a carne cozida com tomate e miolo picado.', 'Recheie, cubra com queijo e asse até a abobrinha ficar macia.'],
    nutrientsPerServing: { calories: 285, proteins: 29, carbohydrates: 14, fats: 12, fiber: 5 },
    nutritionNote: 'Estimativa por porção; depende do corte da carne e do queijo.',
  },
  {
    id: 'hamburguer-caseiro-salada', name: 'Hambúrguer caseiro com salada', category: 'Almoço e jantar', tags: ['Brasileira', 'Fitness'],
    description: 'Hambúrguer de carne magra servido com salada.', minutes: 20, servings: 1,
    ingredients: ['120 g de patinho moído', '1 pão integral pequeno', 'Alface e tomate a gosto', '1 colher de chá de mostarda', 'Sal e pimenta a gosto'],
    steps: ['Tempere a carne e modele um hambúrguer.', 'Grelhe até atingir cozimento seguro.', 'Sirva no pão com salada e mostarda.'],
    nutrientsPerServing: { calories: 390, proteins: 32, carbohydrates: 35, fats: 14, fiber: 6 },
    nutritionNote: 'Estimativa por porção; pão e teor de gordura da carne mudam os valores.',
  },
  {
    id: 'polenta-molho-lentilha', name: 'Polenta com molho de lentilha', category: 'Almoço e jantar', tags: ['Brasileira'],
    description: 'Polenta cremosa com molho de lentilhas e tomate.', minutes: 30, servings: 2,
    ingredients: ['100 g de fubá', '500 ml de água', '200 g de lentilha cozida', '200 g de tomate triturado', 'Alho, cebola e ervas a gosto'],
    steps: ['Cozinhe o fubá na água mexendo até engrossar.', 'Refogue alho e cebola, adicione tomate e lentilha.', 'Sirva o molho sobre a polenta.'],
    nutrientsPerServing: { calories: 310, proteins: 14, carbohydrates: 59, fats: 3, fiber: 11 },
    nutritionNote: 'Estimativa por porção, considerando duas porções e sem queijo ou manteiga.',
  },
  {
    id: 'pudim-chia-cacau', name: 'Pudim de chia com cacau', category: 'Lanches', tags: ['Fitness'],
    description: 'Sobremesa preparada na geladeira sem açúcar adicionado.', minutes: 5, servings: 1,
    ingredients: ['200 ml de leite', '20 g de chia', '1 colher de chá de cacau sem açúcar', 'Canela ou baunilha a gosto'],
    steps: ['Misture leite, chia, cacau e temperos.', 'Mexa novamente após alguns minutos para evitar grumos.', 'Refrigere por pelo menos duas horas até engrossar.'],
    nutrientsPerServing: { calories: 220, proteins: 9, carbohydrates: 18, fats: 13, fiber: 10 },
    nutritionNote: 'Estimativa por porção; varia conforme o leite e não inclui adoçantes.',
  },
  {
    id: 'batata-doce-frango', name: 'Batata-doce com frango desfiado', category: 'Almoço e jantar', tags: ['Fitness'],
    description: 'Combinação simples de carboidrato e proteína.', minutes: 25, servings: 1,
    ingredients: ['180 g de batata-doce cozida', '120 g de frango cozido desfiado', '1 colher de chá de azeite', 'Páprica, alho e limão a gosto'],
    steps: ['Cozinhe a batata-doce até ficar macia.', 'Tempere o frango com alho, limão e páprica.', 'Sirva juntos e finalize com um fio de azeite.'],
    nutrientsPerServing: { calories: 390, proteins: 38, carbohydrates: 42, fats: 8, fiber: 6 },
    nutritionNote: 'Estimativa por porção; o preparo e a variedade da batata alteram os valores.',
  },
  {
    id: 'salmao-arroz-brocolis', name: 'Salmão com arroz e brócolis', category: 'Almoço e jantar', tags: ['Fitness'],
    description: 'Prato com peixe, arroz e vegetais cozidos.', minutes: 25, servings: 1,
    ingredients: ['120 g de salmão', '100 g de arroz integral cozido', '120 g de brócolis', 'Limão, pimenta e ervas a gosto'],
    steps: ['Tempere o salmão com limão e ervas.', 'Asse ou grelhe até cozinhar por completo.', 'Sirva com arroz integral e brócolis cozido no vapor.'],
    nutrientsPerServing: { calories: 430, proteins: 31, carbohydrates: 31, fats: 20, fiber: 6 },
    nutritionNote: 'Estimativa por porção; o teor de gordura varia conforme o peixe e o preparo.',
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
