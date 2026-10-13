# Auditoria estática do catálogo TACO — 2026-10-13

## Escopo e limites

Esta é uma verificação automatizada do arquivo `src/foods-taco.ts` na revisão da `main` após o PR #90. Não é uma certificação nutricional nem substitui a conferência registro a registro com a publicação original da TACO.

Nenhum valor nutricional foi alterado nesta auditoria.

## Resultados reproduzíveis

- Registros reconhecidos no arquivo: **586**.
- IDs: **586 únicos**, todos positivos e inteiros.
- Nomes vazios: **nenhum**.
- Nomes duplicados após conversão para minúsculas: **nenhum**.
- Valores nutricionais não finitos ou negativos: **nenhum**, conforme o teste automatizado existente.
- Energia acima de 1.000 kcal/100 g: **nenhum**, conforme o teste automatizado existente.
- Proteína, carboidrato, lipídeos ou fibra acima de 100 g/100 g: **nenhum**, conforme o teste automatizado existente.
- Soma proteína + carboidrato + lipídeos acima de 100 g/100 g: **nenhum** no rastreio estático.

## Itens para conferência com a fonte original

O rastreio encontrou sete linhas em que a fibra declarada é ligeiramente maior que o carboidrato declarado:

| ID | Alimento | Carboidrato (g/100 g) | Fibra (g/100 g) |
|---:|---|---:|---:|
| 78 | Alface, crespa, crua | 1,7 | 1,8 |
| 108 | Cebolinha, crua | 3,4 | 3,5 |
| 128 | Jurubeba, crua | 23,1 | 23,9 |
| 163 | Abacate, cru | 6,0 | 6,3 |
| 241 | Pequi, cru | 13,0 | 19,0 |
| 325 | Caldo de galinha, tablete | 10,6 | 11,8 |
| 586 | Tremoço, em conserva | 12,4 | 14,4 |

Essas diferenças **não são prova suficiente de erro**: podem depender das definições analíticas, arredondamento, tratamento de traços ou de erro de transcrição. O item 241 merece prioridade de revisão devido à diferença maior. Antes de corrigir qualquer linha, comparar nome, unidade, edição e valores diretamente com a tabela oficial e registrar a referência conferida.

## Próximas ações seguras

1. Conferir os sete registros contra a edição oficial da TACO e anotar a evidência por item.
2. Separar correções confirmadas de diferenças explicáveis pela metodologia.
3. Adicionar teste de regressão para cada correção comprovada.
4. Não importar nem redistribuir uma cópia ampliada da TACO sem resolver a autorização/licença descrita em `docs/FOOD_DATA_SOURCES_AND_LICENSES.md`.
5. Não alterar dados de usuários, banco de produção ou deploy durante a auditoria.

## Como reproduzir

Os testes de integridade existentes estão em `src/foods-taco.test.ts`. Execute `npm test` no repositório para rodar a suíte Vitest; execute `npm run build` para conferir tipos e build.
