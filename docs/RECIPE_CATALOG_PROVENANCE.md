# Proveniência e licença do catálogo de receitas

## Conteúdo editorial próprio do SISTCS Leve
As receitas mantidas em `src/recipes.ts` são textos editoriais escritos para o projeto. Os números nutricionais são estimativas e não devem ser tratados como análise laboratorial. O catálogo não reproduz textos de YAZIO, FatSecret ou outro concorrente.

## Fonte candidata para futura importação: UniTools World Recipes
- Página do conjunto: https://theunitools.com/en/data
- Arquivo integral anunciado: https://theunitools.com/data/unitools-recipes-v1.json
- Licença declarada: Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)
- Atribuição indicada pelo publicador: UniTools — theunitools.com
- Quantidade anunciada: 501 receitas (metadados do conjunto consultados em 2026-10-13).

O conjunto fornece calorias, proteína, carboidratos e gordura por porção no exemplo de esquema consultado, mas não fornece fibra nesse esquema. Por isso, não foi importado automaticamente para o catálogo principal: a fibra não será inventada ou registrada como zero apenas para passar em validações. Uma futura adaptação/tradução deverá manter a atribuição, incluir a licença e respeitar o compartilhamento pela mesma licença CC BY-SA 4.0. As fotos têm autoria/licença própria e não devem ser copiadas sem revisar esses metadados individualmente.

## Outra fonte candidata: ForkRecipe
- Repositório: https://github.com/futurechef/forkrecipe-recipes
- Licença declarada no GitHub: CC BY-SA 4.0
- Quantidade anunciada na descrição do repositório: 916 receitas.

O formato examinado não apresenta nutrição completa de forma uniforme; os registros não serão considerados nutricionalmente completos sem cálculo rastreável por ingredientes e uma fonte de composição nutricional licenciada compatível.

## Regra de entrada
Não importar registros que falhem deduplicação, licença/atribuição, ingredientes, preparo, porções ou validação nutricional. Não afirmar uma contagem-alvo até que o catálogo real e os testes confirmem a quantidade de receitas únicas completas.
