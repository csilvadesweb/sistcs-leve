# Auditoria de cobertura alimentar brasileira — licenças e qualidade

Data: 12/10/2026

## Resultado da revisão

A meta é manter a busca funcional sem introduzir dados cuja autorização comercial não esteja clara. A página oficial da TBCA/USP informa que a divulgação de dados é estimulada sem fins comerciais, que usos comerciais exigem contato com os coordenadores e que não é permitida a reprodução total ou parcial nem a comercialização do material. Por isso, os 12 registros que reproduziam referências da TBCA foram removidos do catálogo executável e substituídos por estimativas genéricas de preparações brasileiras, identificadas explicitamente como estimativas. Elas não são dados oficiais, variam conforme receita e porção e não devem ser usadas como substituto de rótulos ou receitas pesadas.

Fonte oficial TBCA/USP: https://fcf.usp.br/tbca/

## Fontes gratuitas para uso comercial

- **USDA FoodData Central**: dados declarados em domínio público/CC0 1.0; preferir registros cuja origem e licença estejam explícitas. https://fdc.nal.usda.gov/
- **Open Food Facts**: base ODbL, com atribuição e obrigações de compartilhamento pela mesma licença para a base derivada; imagens de produtos têm condições próprias. Não copiar imagens automaticamente nem presumir que todos os campos tenham direitos idênticos. https://world.openfoodfacts.org/terms-of-use
- **TACO/NEPA-UNICAMP**: o NEPA disponibiliza a tabela publicamente, mas não foi localizada uma licença explícita e inequívoca para redistribuição comercial dos 590 registros embutidos neste app. A disponibilidade pública, sozinha, não confirma autorização comercial. É necessária confirmação escrita do titular ou um plano de substituição compatível com zero regressão.

Fontes:
- USDA FoodData Central — licenciamento: https://fdc.nal.usda.gov/
- Open Food Facts — licenças e reutilização: https://github.com/openfoodfacts/openfoodfacts-server/blob/main/docs/api/tutorials/license-be-on-the-legal-side.md
- NEPA/UNICAMP — publicações TACO: https://nepa.unicamp.br/publicacoes/

## Proteção contra regressão

- Nenhuma migration, dado de usuário, autenticação ou fluxo de registro foi alterado.
- As 12 preparações continuam pesquisáveis, agora com códigos próprios e origem `estimate`.
- A interface deve distinguir claramente estimativas de dados oficiais.
- Testes devem cobrir busca, valores numéricos válidos e medidas caseiras.

## Limitação importante

Esta alteração elimina a dependência dos 12 registros TBCA, mas **não libera automaticamente o catálogo TACO já existente para uso comercial**. O próximo passo seguro é obter autorização escrita da NEPA/UNICAMP ou substituir os registros em lotes por dados com licença explícita, validando cada lote antes de remover os dados atuais.


## Nova auditoria de fontes públicas (13/10/2026)

A busca encontrou uma fonte adicional muito relevante: a **POF/IBGE — Tabelas de Composição Nutricional dos Alimentos Consumidos no Brasil (2008–2009)**, que inclui preparações e alimentos relatados em domicílios e fora deles. A publicação informa que a composição foi compilada usando múltiplas fontes, incluindo TACO/UNICAMP, NDSR, publicações científicas e rótulos. Portanto, o arquivo completo **não pode ser presumido como livre para redistribuição comercial** apenas por estar disponível no site do IBGE; cada registro precisa ter sua referência de origem verificada. Fonte oficial: https://www.ibge.gov.br/estatisticas/todos-os-produtos-estatisticas/9050-pesquisa-de-orcamentos-familiares.html?edicao=9058 e descrição da publicação: https://loja.ibge.gov.br/pesquisa-de-orcamentos-familiares-2008-2009-tabelas-de-composic-o-nutricional-dos-alimentos-consumidos-no-brasil.html.

A POF/IBGE continua sendo útil para orientar **prioridade e nomes** dos alimentos consumidos no Brasil e para descobrir lacunas regionais. Não se deve copiar a tabela inteira para o catálogo antes de resolver as licenças das fontes incorporadas.

### Caminho de importação sem custo de licença

1. Usar USDA FoodData Central para dados nutricionais cujos registros sejam de origem USDA e licença pública explícita. O USDA declara seus dados em domínio público/CC0 1.0 e permite reutilização sem pedir autorização, recomendando atribuição: https://fdc.nal.usda.gov/api-guide/ e https://fdc.nal.usda.gov/download-datasets/.
2. Usar os conjuntos de alimentos genéricos (Foundation Foods/SR Legacy) para ingredientes básicos, mantendo ID, nome original, nutrientes por 100 g, URL, data/versão e licença. Traduzir nomes e acrescentar sinônimos em campos separados, sem alterar os valores de origem nem apresentar uma tradução como medição brasileira.
3. Usar Open Food Facts para produtos embalados com código de barras, atribuição visível e tratamento compatível com ODbL/DCL. Não misturar sua base derivada com outra base sem avaliar a obrigação share-alike e não reutilizar imagens sem análise da licença própria.
4. Para pratos regionais e preparações brasileiras não cobertos por fonte reutilizável, priorizar valores calculados de receitas próprias e pesadas ou obter autorização escrita do titular. Marcar estimativas com transparência; não inventar valores como se fossem oficiais.
5. Fazer importação em lote aditivo e idempotente, deduplicar por identificador de origem, preservar os alimentos existentes e testar a busca, valores por 100 g, unidades, origem e atribuição antes de ativar os novos registros.

### Cobertura não é sinônimo de catálogo completo

Nenhuma das fontes encontradas é simultaneamente completa para todos os alimentos consumidos no Brasil, livre de restrições para redistribuição comercial e atualizada com todos os produtos embalados. A estratégia mais segura é combinar **USDA CC0 para ingredientes genéricos + Open Food Facts sob suas condições para embalados + receitas próprias validadas/autorizações para pratos regionais**, sem importar integralmente TACO/TBCA/POF enquanto as permissões não estiverem claras.

### Melhoria de busca regional

A normalização local aceita sinônimos regionais adicionais (por exemplo, *mexerica*, *batata salsa*, *mandioquinha*, *pão cacetinho* e *feijão de corda/macassa*) e os direciona a registros existentes equivalentes, sem criar novos valores nutricionais ou remover alimentos.


## Atualização de busca USDA (13/10/2026)

A busca externa já utiliza somente linhas identificadas como USDA SR Legacy e com licença explícita `us_public_domain`, mantendo a origem e URL da fonte. A normalização agora traduz mais consultas brasileiras comuns para termos de referência em inglês (mandioca/macaxeira/aipim, feijão preto/fradinho, couve, quiabo, fubá/polvilho/tapioca e outros). Isso **melhora a descoberta dos registros licenciados existentes**, mas não transforma valores USDA em medições brasileiras nem substitui os alimentos regionais ausentes. Para itens sem equivalência confiável, deve-se usar receita própria validada ou autorização do titular.
