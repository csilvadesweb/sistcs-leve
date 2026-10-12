# Auditoria de cobertura alimentar brasileira — fase 1

Data: 12/10/2026

## Escopo e limite honesto

A base local existente contém 590 registros derivados da TACO 4ª edição, complementados por busca de produtos embalados do Open Food Facts e referências genéricas USDA SR Legacy com licença pública explícita. Isso não equivale a uma lista exaustiva de tudo que se come no Brasil: receitas regionais, variações de preparo, marcas e produtos novos são praticamente ilimitados. A meta é ampliar a cobertura de forma rastreável, sem inventar valores como se fossem oficiais.

## O que entrou nesta fase

Foram adicionadas seis entradas da TBCA/USP à busca local, com código de referência, link da fonte e valores por 100 g:

| Alimento | Referência TBCA | Medida inicial |
|---|---|---|
| Pão de queijo industrializado assado | BRC0123B | unidade pequena (25 g) |
| Feijoada com sal | BRC0198T | porção/concha (150 g) |
| Brigadeiro caseiro com chocolate | BRC0190K | unidade (25 g) |
| Tapioca sem manteiga e sem recheio | BRC0906B | unidade média (60 g) |
| Cuscuz de tapioca com coco e leite de coco | BRC0997B | pedaço médio (70 g) |
| Moqueca baiana de peixe | BRC0121E | concha (45–60 g) |

Os valores são os da preparação descrita pela TBCA; marcas, receita, tamanho e quantidade de óleo/açúcar podem alterar os nutrientes. As medidas caseiras são estimativas de peso e não devem ser tratadas como universais.

Fontes de referência:
- TBCA/USP: https://www.tbca.net.br/base-dados/composicao_alimentos_calculaveis.php
- TACO/NEPA-UNICAMP: https://nepa.unicamp.br/tabela-brasileira-de-composicao-de-alimentos-4a-edicao/
- IBGE, POF 2017–2018 — consumo alimentar: https://www.ibge.gov.br/estatisticas/multidominio/condicoes-de-vida-desigualdade-e-pobreza/24786-pesquisa-de-orcamentos-familiares-2.html

## Matriz de cobertura a revisar

| Grupo | Cobertura já identificada | Próxima verificação |
|---|---|---|
| Arroz, feijões, cereais, farinhas e massas | Diversas formas cruas/cozidas na TACO | Variedades regionais, cuscuz de arroz, polvilho e preparações |
| Carnes, aves, ovos, pescados e frutos do mar | Muitos cortes e preparações na TACO | Carne de sol, churrasco por corte, peixes regionais e preparos |
| Leite, queijos e derivados | Leites, queijos e iogurtes; produtos embalados via OFF | Queijos regionais, coalhada, requeijão e marcas faltantes |
| Frutas, verduras e legumes | Muitas espécies e estados de preparo na TACO | Frutas regionais/sazonais, PANCs, tubérculos e variedades locais |
| Pratos brasileiros e regionais | Acarajé, arroz carreteiro, baião de dois, barreado, cuscuz, feijão tropeiro, maniçoba, tacacá, vatapá e outros na TACO | Pão de queijo pronto, feijoada, tapioca simples, moqueca e preparações regionais adicionais |
| Doces e sobremesas | Doces da TACO e produtos de marca via OFF | Brigadeiros e doces regionais, bolos caseiros e sobremesas com receita identificada |
| Bebidas | Café, chás, sucos e refrigerantes em várias formas | Bebidas regionais e produtos embalados ausentes |
| Industrializados e marcas | Open Food Facts com busca paginada e código de barras | Qualidade, duplicatas, rótulos incompletos e cobertura de marcas brasileiras |

A matriz é uma lista de auditoria, não uma afirmação de que todos os itens de cada grupo já estão cobertos.

## Regras de qualidade

1. Priorizar registros oficiais/identificáveis (TBCA, TACO e rótulos) e preservar fonte/código.
2. Distinguir alimento cru, cozido, assado, frito, drenado e receita preparada.
3. Não misturar preparação com ingrediente nem substituir a composição de marca por uma média sem avisar.
4. Não duplicar um alimento existente só por diferença de grafia; usar aliases quando forem sinônimos.
5. Não inventar macros para preencher lacunas. Quando só houver estimativa, identificar como estimativa.
6. Validar busca por nome comum, acentos/sinônimos, código de referência, medidas caseiras e cálculo de nutrientes.
7. Nenhuma migration ou alteração de dados de usuários é necessária para esta expansão do catálogo local.

## Próxima etapa recomendada

Fazer comparação estruturada com os grupos e microdados de consumo da POF/IBGE, revisar entradas da TBCA que não estejam representadas, e adicionar em lotes pequenos com testes de busca e fonte. Para produtos de marca, continuar a usar a busca paginada do Open Food Facts, sem copiar toda a base externa para o app.
