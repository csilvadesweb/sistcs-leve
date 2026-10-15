# Fontes seguras e licenças do catálogo nutricional

Esta política orienta a expansão do catálogo do SISTCS Leve, que deve continuar gratuito para o usuário. **Acesso público não significa automaticamente autorização irrestrita para redistribuir uma base de dados.** Esta documentação não substitui aconselhamento jurídico.

## Fontes prioritárias

### 1. USDA FoodData Central — melhor opção para dados de referência

- Fonte oficial: https://fdc.nal.usda.gov/
- Licença declarada pelo USDA: CC0 1.0 Universal / domínio público.
- O USDA solicita atribuição da fonte mesmo sem exigir permissão.
- Usar para complementar alimentos genéricos e nutrientes ausentes, mantendo identificador, URL de origem, data de consulta e a distinção entre alimento genérico e produto de marca.
- O app já tem um caminho de busca para referências USDA por meio de uma base intermediária; antes de importar dados em massa, confirmar que cada registro preserva a origem e a licença.

### 2. Open Food Facts — opção para produtos embalados e códigos de barras

- Licenciamento oficial: https://openfoodfacts.github.io/openfoodfacts-server/api/tutorials/license-be-on-the-legal-side/
- Banco de dados sob Open Database License (ODbL); conteúdos individuais sob Database Contents License (DbCL); imagens têm condições próprias.
- Atribuir Open Food Facts e cumprir as condições de share-alike aplicáveis à base derivada. Não misturar dados incompatíveis numa base redistribuída sem análise de compatibilidade.
- Respeitar os limites de requisição e identificar a aplicação conforme as regras da API.
- Tratar os dados comunitários como potencialmente incompletos: validar valores ausentes, negativos, porção, unidade e energia antes de gravar no diário. Não inventar macros que a fonte não informou.

### 3. TACO / NEPA-UNICAMP — referência brasileira

- Página da fonte: https://www.nepa.unicamp.br/taco/
- A TACO é útil para alimentos brasileiros e preparações tradicionais. Entretanto, o repositório atual não contém uma confirmação de licença de redistribuição comercial para o conjunto de dados.
- **Ação obrigatória antes de redistribuição em produção:** obter e arquivar a licença ou autorização escrita do titular; se não houver confirmação, não expandir a cópia redistribuída. Preservar a implementação existente enquanto a equipe prepara uma alternativa licenciada e verifica a possibilidade de substituição por etapas.
- Não remover registros atuais automaticamente e não afirmar que a tabela está liberada para qualquer uso apenas porque está publicamente acessível.

## Regras para qualquer nova importação

1. Registrar fonte, URL, licença, versão/data e atribuição para cada lote.
2. Manter separados dados CC0, dados ODbL e dados cuja licença esteja pendente.
3. Não copiar imagens de produtos junto com dados nutricionais sem revisar a licença específica das imagens.
4. Normalizar unidades e porções, mas nunca apresentar estimativas como valores medidos ou confirmados.
5. Validar IDs/barcodes duplicados, valores negativos, calorias/macros impossíveis, campos ausentes e origem antes de mesclar.
6. Importar primeiro para uma branch e ambiente de teste; executar testes e comparar contagens antes/depois.
7. Fazer merge somente com CI verde. Não executar migrations no Supabase de produção para uma atualização de catálogo sem plano aditivo, backup validado e aprovação explícita.
8. Mostrar ao usuário uma indicação clara quando os dados são estimados, incompletos ou originados de uma base colaborativa.

## Fontes oficiais consultadas

- USDA FoodData Central — licenciamento e atribuição: https://fdc.nal.usda.gov/
- Open Food Facts — condições de uso e reutilização: https://openfoodfacts.github.io/openfoodfacts-server/api/tutorials/license-be-on-the-legal-side/
- Open Data Commons — resumo ODbL: https://opendatacommons.org/licenses/odbl/summary/
- NEPA/UNICAMP — TACO: https://www.nepa.unicamp.br/taco/

## Correção de fuso horário do Health Connect

Datas de atividade são datas de calendário brasileiras. A consulta deve calcular os últimos sete dias a partir de `America/Sao_Paulo`, em vez de cortar a data UTC de `Date.now() - 6 dias`; perto da meia-noite, UTC pode estar no dia seguinte e ocultar registros válidos. A função `dateDaysAgoInSaoPaulo` centraliza esse cálculo e tem testes de regressão.


## Lote 5 — 1.000 referências USDA SR28

O módulo `src/foods-usda-batch5.ts` acrescenta 1.000 referências genéricas de composição nutricional derivadas do USDA National Nutrient Database for Standard Reference (SR28), por 100 g. O dataset derivado consultado é o projeto foodWeb de Russell Steadman, que identifica a fonte de dados como USDA SR e sua licença de dados como CC BY 4.0. A atribuição fica registrada no módulo e em cada item; nomes originais em inglês são preservados como aliases de busca.

- Dataset USDA: https://catalog.data.gov/dataset/usda-national-nutrient-database-for-standard-reference-legacy-release
- Dataset derivado: https://github.com/russellsteadman/foodweb
- Licença de dados declarada pela fonte derivada: CC BY 4.0; atribuição ao USDA e a Russell Steadman/foodWeb mantida no código.
- Os nomes são traduções automáticas de referência e devem ser revisados editorialmente; os nutrientes vêm da tabela de referência, não de rótulos atuais de marcas brasileiras.
- O lote é adicionado depois dos dados existentes, com prioridade inferior na busca, para preservar os resultados atuais.
