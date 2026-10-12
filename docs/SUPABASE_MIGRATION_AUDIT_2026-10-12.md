# Auditoria de reconciliação Supabase — 2026-10-12

## Escopo e segurança

- Projeto verificado: `yzcmxdbnitturlbozvqu`.
- Esta auditoria foi somente de leitura no banco. Nenhuma migration foi aplicada, nenhum dado foi inserido/alterado/removido e nenhum deploy foi executado.
- Não foi criado branch pago do Supabase. O trabalho de versionamento abaixo é no GitHub e não exige upgrade de plano.
- `supabase/schema.sql` é um snapshot cumulativo, não substitui os scripts históricos exatos.

## Histórico encontrado no Supabase

O histórico remoto lista estas 8 migrations aplicadas:

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

Os sete scripts históricos ausentes **não foram inventados nem reconstruídos por aproximação**. Embora o esquema atual forneça parte da evidência do estado final, ele não prova a sequência exata, os nomes de constraints/policies nem as operações históricas. Recuperar esses scripts exige localizar fontes versionadas confiáveis ou exportações verificáveis.

## Correção de versionamento nesta alteração

Os dois arquivos de migration existentes usavam apenas o prefixo `20261012`, portanto compartilhavam a mesma versão curta para o Supabase CLI e não refletiam a versão remota de navegação. Isso foi corrigido sem tocar no banco:

- `20261012_navigation_preferences.sql` → `20261012163900_navigation_preferences.sql`, alinhado à migration já aplicada.
- `20261012_exercise_entries.sql` → `20261012170000_exercise_entries.sql`, versão única posterior ao histórico remoto; continua **pendente e não aplicada**.
- O teste estático foi atualizado para apontar para o novo arquivo de exercícios.

Antes de qualquer `db push`, ainda é necessário reconciliar os sete scripts históricos ausentes. Não executar `db reset`, não marcar migrations como aplicadas sem evidência e não aplicar a migration de exercícios em produção nesta etapa.

## Verificações de RLS no banco atual

- As 9 tabelas do schema `public` verificadas têm Row Level Security habilitado.
- Foi feita uma verificação de leitura usando o papel `authenticated`, alternando a identidade JWT de duas contas existentes dentro de transações encerradas com `ROLLBACK`.
- A conta com registros conseguiu ver apenas suas linhas: 1 perfil, 3 alimentos, 2 registros de água, 1 registro de peso e 1 registro de jejum; nenhuma linha de outras tabelas verificadas.
- A segunda conta, sem registros próprios nessas tabelas, viu zero linhas em todas as tabelas verificadas. Não foram expostos IDs ou dados pessoais neste relatório.
- A verificação não executou INSERT/UPDATE/DELETE e não prova ainda o isolamento das operações de escrita nem a migration de exercícios.

## Pendências explícitas

1. Recuperar os sete scripts históricos originais a partir de fonte confiável.
2. Reproduzir o banco localmente e validar o histórico completo sem usar branch pago.
3. Adicionar/rodar testes de integração de leitura e escrita RLS em ambiente descartável gratuito antes de liberar a migration de exercícios.
4. Rever no painel a recomendação de segurança do Supabase sobre proteção contra senhas comprometidas desativada. A configuração não foi alterada.
5. Não declarar a migration de exercícios pronta para produção até concluir as verificações acima.
