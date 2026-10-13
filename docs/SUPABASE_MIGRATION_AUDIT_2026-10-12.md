# Auditoria de reconciliação Supabase — 2026-10-12

## Escopo e segurança

- Projeto verificado: `yzcmxdbnitturlbozvqu`.
- Consultas somente de leitura para comparar o histórico remoto, o esquema e os arquivos versionados. Nenhuma migration foi aplicada por esta correção, nenhum dado foi alterado e nenhum deploy foi solicitado.
- Não foi criado branch pago do Supabase. O trabalho de versionamento no GitHub não exige upgrade de plano.
- `supabase/schema.sql` é um snapshot cumulativo, não substitui os scripts históricos exatos.

## Histórico encontrado no Supabase

A verificação inicial encontrou oito migrations; uma consulta posterior, em 2026-10-12, confirmou também a migration `exercise_entries`. O histórico remoto atual consultado contém nove versões:

| Versão | Nome | Arquivo versionado |
| --- | --- | --- |
| `20261011021110` | `meu_progresso_total_schema_inicial` | Ausente |
| `20261011030655` | `meu_progresso_total_peso_medicamentos_perfil` | Ausente |
| `20261011143427` | `personalizacao_metas` | Ausente |
| `20261011150916` | `foto_antes_depois_jejum` | Ausente |
| `20261012015340` | `fase_1_integridade_dados_usuario` | Ausente |
| `20261012113725` | `menu_personalizado` | Ausente |
| `20261012162317` | `fix_favorite_foods_source_delete` | Ausente |
| `20261012163900` | `navigation_preferences` | `20261012163900_navigation_preferences.sql` |
| `20261012195153` | `exercise_entries` | Alinhado nesta alteração para `20261012195153_exercise_entries.sql` |

Os sete scripts históricos ausentes **não foram inventados nem reconstruídos por aproximação**. O esquema final não prova a sequência exata de operações nem todos os detalhes históricos. Recuperar esses scripts exige fonte versionada confiável ou exportações verificáveis.

## Correção da divergência de versão

A migration remota `exercise_entries` foi registrada como versão `20261012195153`, enquanto o arquivo local usava `20261012170000_exercise_entries.sql`. Isso poderia fazer a CLI tratar o arquivo como uma migration pendente.

A consulta somente de leitura ao banco confirmou que a tabela existente tem as oito colunas esperadas, o índice `exercise_entries_user_date_idx`, as quatro políticas RLS de proprietário e as constraints correspondentes ao arquivo versionado. Esta alteração, portanto, alinha o nome do arquivo local à versão já registrada no histórico remoto e atualiza o teste estático. **Não executa a migration novamente nem modifica o banco.**

A migration `navigation_preferences` permanece versionada como `20261012163900_navigation_preferences.sql`, alinhada ao histórico remoto.

## Verificações de RLS no banco atual

- A auditoria anterior verificou nove tabelas do schema `public` com RLS habilitado.
- Foi feita uma verificação de leitura usando o papel `authenticated`, alternando a identidade JWT de duas contas existentes dentro de transações encerradas com `ROLLBACK`.
- A conta com registros conseguiu ver apenas suas linhas nas tabelas verificadas; a segunda conta, sem registros próprios nessas tabelas, viu zero linhas. Nenhum ID ou dado pessoal foi incluído neste relatório.
- A verificação anterior não executou INSERT/UPDATE/DELETE e não prova por si só o isolamento das operações de escrita de todas as tabelas.

## Bloqueios restantes

1. Recuperar os sete scripts históricos originais a partir de fonte confiável. Não executar `db push`, `db reset` nem marcar versões como aplicadas sem essa reconciliação.
2. Reproduzir o histórico completo em ambiente local/descartável gratuito antes de liberar futuras migrations.
3. Adicionar/rodar testes de integração de leitura e escrita RLS em ambiente descartável para novas tabelas.
4. Rever no painel a recomendação de segurança sobre proteção contra senhas comprometidas desativada. A configuração não foi alterada.

A divergência de versão de `exercise_entries` está corrigida no versionamento proposto, mas **a reconciliação geral das sete migrations históricas ausentes continua bloqueando qualquer `db push`**.
