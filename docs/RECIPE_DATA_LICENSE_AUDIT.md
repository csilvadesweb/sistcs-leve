# Auditoria de licenças — catálogo de receitas do SISTCS Leve

Data da revisão: 2026-10-13  
Escopo: fontes identificadas para formar um catálogo internacional comercializável. Esta é uma triagem documental, não um parecer jurídico nem uma confirmação independente de titularidade autoral.

## Resultado por fonte

| Fonte | Volume anunciado | Licença declarada | Decisão | Condições e limitações |
|---|---:|---|---|---|
| [UniTools World Recipes](https://github.com/farcrak/unitools-recipes) | 501 | CC BY-SA 4.0 | **Aprovada condicionalmente para texto de receitas** | Atribuir “Recipe data: UniTools — theunitools.com”; compartilhar adaptações sob CC BY-SA 4.0. A nutrição é estimada a partir dos ingredientes. Fotos têm licença individual: não copiar sem verificar autor/licença de cada imagem. |
| [ForkRecipe — Open Recipe Dataset](https://github.com/futurechef/forkrecipe-recipes) | 916 | CC BY-SA 4.0 | **Aprovada condicionalmente para conteúdo de receitas** | Atribuir ForkRecipe/FoodML e colaboradores; compartilhar adaptações sob CC BY-SA 4.0. Não usar ForkRecipe, FoodML ou logotipos como marca do produto nem sugerir endosso. Preservar NOTICE e proveniência por receita. |
| [Recipe Context Protocol (RCP)](https://recipecontextprotocol.com/about) | Catálogo misto | Licença por registro; conjunto CC BY-SA 4.0 para extração substancial | **Aprovada apenas por registro** | Importar somente registros cuja licença e atribuição possam ser preservadas. Wikibooks: CC BY-SA 4.0; domínio público: aceitar somente quando declarado e rastreável. Rejeitar registros sem licença/proveniência clara. |
| [Recipe Dataset / Epicurious scrape](https://github.com/josephrmartinez/recipe-dataset) | 13 mil anunciadas | Metadados citam CC BY-SA 3.0, mas README informa que os textos foram raspados do Epicurious e não foram alterados | **Rejeitada até prova de direitos** | Uma licença no repositório não prova que quem publicou podia relicenciar textos de terceiros. Não importar instruções/descrições sem autorização verificável do titular original. |
| [DataHive Recipes with Nutrition](https://huggingface.co/datasets/datahiveai/recipes-with-nutrition) | 39.447 | CC BY-NC 4.0 | **Rejeitada** | NonCommercial é incompatível com o uso comercial pretendido sem licença adicional. |
| [Palate Open Data](https://palate.kitchen/data) | 250 | CC BY-NC 4.0 | **Rejeitada** | Uso comercial requer autorização adicional. |
| [Open Global Recipes](https://github.com/drwjkirkpatrick-web/open-global-recipes) | 75 mil+ anunciadas | Código MIT; dados compilados de fontes mistas | **Rejeitada como pacote agregado** | O próprio projeto restringe os dados a uso pessoal e desaconselha redistribuição comercial dos textos. Reavaliar apenas fontes individuais com direitos comprovados. |
| [WiseFood Catalogue / Culinary Recipes Dataset](https://zenodo.org/records/20571654) | Fontes ligadas no catálogo | Licença dos conteúdos individuais não confirmada nesta revisão | **Pendente / não importar** | Não incorporar até verificar a licença explícita de cada fonte/registro. |
| [Weighed-Meal Reference Set](https://dietaryassessmentinitiative.org/datasets/weighed-meal-reference-set-180/) | 180 refeições | CC BY 4.0 para conjunto tabular | **Apto para validação nutricional, não catálogo em massa** | Usar dados tabulares conforme a licença; fotos são restritas. Não confundir conjunto de referência nutricional com catálogo amplo de receitas publicáveis. |

## Regras obrigatórias de importação

1. Cada registro precisa de `sourceName`, `sourceUrl`, `licenseId` e `attribution`.
2. O validador permite somente `CC-BY-4.0`, `CC-BY-SA-4.0` e `PUBLIC-DOMAIN`. `CC-BY-SA-3.0` não está habilitada para importação automática neste momento; qualquer futura inclusão exige revisão explícita da cadeia de direitos, atualização coordenada do validador e teste. A allowlist técnica não substitui revisão documental.
3. Tradução é adaptação: respeitar atribuição e ShareAlike quando aplicável.
4. Não importar fotografias automaticamente; validar licença e atribuição de cada imagem separadamente.
5. Deduplicar por ID da fonte, slug normalizado e similaridade de nome/ingredientes; tradução ou variação trivial não conta como receita única.
6. Nutrição deve vir de fonte rastreável ou ser calculada a partir de ingredientes/quantidades mapeados a tabela nutricional. Rotular como estimativa; nunca gerar valores aleatórios.
7. Não promover nenhum conjunto ao catálogo ativo antes de validar estrutura, licença, atribuição, duplicatas e nutrição.
8. CC BY-SA exige compartilhar adaptações do conteúdo sob os mesmos termos; isso pode afetar a distribuição do catálogo derivado. Manter o código do app separado do conteúdo e exibir créditos/licenças.

## Situação da meta de 3.100 receitas

UniTools e ForkRecipe anunciam 1.417 registros combinados antes de deduplicação. Isso não comprova 1.417 receitas únicas utilizáveis e não alcança 3.100. RCP pode acrescentar registros elegíveis, mas a contagem/licença precisa ser verificada por registro. Não completar a meta com fontes não comerciais, textos raspados sem autorização ou duplicatas.

## Fontes primárias consultadas

- UniTools README e LICENSE: https://github.com/farcrak/unitools-recipes
- ForkRecipe README, LICENSE e NOTICE: https://github.com/futurechef/forkrecipe-recipes
- RCP — About & licensing: https://recipecontextprotocol.com/about
- Recipe Dataset README: https://github.com/josephrmartinez/recipe-dataset
- DataHive dataset card: https://huggingface.co/datasets/datahiveai/recipes-with-nutrition
- Palate licensing: https://palate.kitchen/data
- Open Global Recipes README: https://github.com/drwjkirkpatrick-web/open-global-recipes
- Weighed-Meal Reference Set: https://dietaryassessmentinitiative.org/datasets/weighed-meal-reference-set-180/
