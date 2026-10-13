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
