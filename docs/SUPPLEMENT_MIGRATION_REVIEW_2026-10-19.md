# Revisão estática dos lotes de suplementos 04–25 — 19/10/2026

## Resultado

Foi feita uma varredura automatizada dos 22 arquivos SQL adicionados pela PR #161, diretamente do patch completo da PR. Esta revisão cobre padrões de segurança e idempotência do SQL; não equivale a executar os arquivos contra PostgreSQL nem a confirmar os produtos no banco de produção.

| Verificação estática | Resultado |
| --- | ---: |
| Arquivos revisados | 22 |
| Linhas adicionadas nos arquivos | 462 |
| Registros de produto declarados nos lotes | 57 |
| Registros com status `label_transcribed` | 54 |
| Registros com status `needs_verified_product_data` | 3 |
| URLs de fonte presentes | 57 |
| Arquivos com guarda `WHERE NOT EXISTS` | 22 |
| `DELETE`, `TRUNCATE` ou `DROP TABLE` detectados | 0 |
| `UPDATE public.supplement_catalog` detectados | 0 |

## Interpretação

- Os lotes são aditivos na forma estática examinada e usam uma condição de existência para evitar inserir novamente um produto já identificado por código de barras ou nome/marca.
- Os três registros do lote 18 que usam `needs_verified_product_data` devem continuar fora da busca de produtos nutricionalmente prontos; campos ausentes não devem ser preenchidos por inferência.
- Os 54 registros marcados como transcritos ainda precisam ter os rótulos e as fontes conferidos por amostragem e, quando necessário, por produto/variante. A presença de uma URL não comprova por si só que ela sustenta todos os valores do registro.
- A análise não prova que todos os EANs e valores nutricionais são verdadeiros, nem testa a compatibilidade com o schema remoto, concorrência, repetição real, desempenho, rollback ou funcionamento da busca no app.

## Bloqueios antes da produção

1. Reconciliar o histórico de migrations do Supabase; os lotes 04–25 não aparecem no ledger remoto consultado.
2. Executar os SQLs num PostgreSQL/Supabase descartável sem custo e verificar sintaxe, constraints, repetição e contagens antes/depois.
3. Confirmar as fontes e valores nutricionais por produto/variante; manter os três registros não verificados fora da busca pronta.
4. Aplicar somente com plano versionado e validado, sem `db push` enquanto o histórico estiver divergente.
5. Após a carga autorizada, confirmar no banco as contagens, duplicatas por nome/EAN e buscas por marca, nome e código de barras.

## Evidência de produção separada

A consulta somente de leitura ao Supabase em 19/10/2026 retornou 126 linhas em `public.supplement_catalog`, das quais 11 estavam com status `label_transcribed`. Nenhum dos lotes 04–25 foi aplicado durante essa consulta. Esses números não devem ser confundidos com os 57 registros declarados nos arquivos SQL.

## Limites

Esta é uma verificação estática de padrões no patch, não um teste de integração nem certificação legal, nutricional ou de produção. Nenhuma alteração foi feita no banco ou no deploy como parte desta revisão.
