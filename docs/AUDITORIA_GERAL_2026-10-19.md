# Auditoria geral do SISTCS Leve — 19/10/2026

## 1. Resumo executivo

**Escopo executado nesta rodada:** leitura estática do `README.md`, `package.json`, workflows de CI, código de navegação, busca nutricional, diário alimentar, Coach de IA, receitas, PWA/lembretes, cartão de atividade/Health Connect, documentação Android, `DEPLOY.md`, `supabase/schema.sql` e documentação de migrations. Também foram consultados os metadados do commit mais recente retornado pela busca do repositório: `18cc7bde86db1b3c8847ef1e9113b33d5053be3f` (merge do PR #167, 19/10/2026).

**Resultado:** a aplicação tem uma base funcional ampla e automação de verificação configurada, mas não é possível certificar o sistema inteiro como livre de falhas somente por inspeção de código. Permanecem bloqueios relevantes de governança de migrations, licenciamento do catálogo alimentar e validação integrada/real de dispositivos e notificações.

**Não executado nesta auditoria:** nenhuma alteração de dados ou schema no Supabase, nenhuma migration remota, nenhum deploy, nenhuma alteração de segredo/configuração, nenhum teste em aparelho físico e nenhuma afirmação de que o commit mais recente passou na CI. A consulta de execuções de workflow não retornou execuções associadas ao SHA consultado; isso não prova sucesso nem falha.

## 2. Escopo e evidências revisadas

| Área | Evidência estática | Resultado |
| --- | --- | --- |
| Stack e scripts | `package.json` | React 18, TypeScript, Vite, Supabase JS, Vitest, Playwright e Wrangler; Node >=22 |
| Navegação | `src/App.tsx`, `src/pages/NavigationHub.tsx` | Cinco destinos principais: Início, Alimentação, Atividade, Evolução e Perfil; áreas internas agrupadas |
| Alimentação | `src/pages/Food.tsx`, `src/foodsearch.tsx`, `src/foods-br.ts` | Diário, busca, porções, câmera/código de barras compatível, estimativas e fontes externas |
| Nutrição adicional | `src/data.ts`, tela de alimentação e commits recentes | Gordura saturada, açúcares e sódio são opcionais quando a fonte informa; NULL deve continuar significando “não informado” |
| Suplementos | `searchSupplementCatalog` em `src/foods-br.ts` e chamada em `src/foodsearch.tsx` | A busca consulta o catálogo do Supabase; cobertura total, qualidade de cada rótulo e disponibilidade em produção não foram verificadas nesta rodada |
| Coach de IA | `src/pages/Assistant.tsx` | Usa endpoints `/api/ai/status` e `/api/ai/chat`, token de sessão e contexto alimentar opcional desativado por padrão; depende de configuração segura no servidor |
| Receitas | `src/pages/Recipes.tsx`, `src/recipes.ts`, `src/meal-plan.ts` | Busca/filtros, favoritos, planejamento, lista de compras e PDFs estão implementados no frontend |
| Atividade | `src/pages/NavigationHub.tsx`, código de exercícios e metas | Hub reúne exercícios/passos, dispositivos e metas; cálculos de calorias são estimativas, não medições |
| Health Connect | `src/components/HealthActivityCard.tsx`, `android-health-connect/README.md` | Há app complementar e tela web de consulta; sincronização real e permissões precisam de teste no dispositivo |
| PWA | `src/pwa.tsx`, `public/sw.js`, manifesto | Instalação/atualização e cache de arquivos estáticos; não equivale a persistência offline completa |
| Lembretes | `src/WaterReminders.tsx`, `src/water-reminder-sound.ts` | Lembretes locais dependem da página, permissões e políticas do navegador; push universal com app fechado não está comprovado |
| Supabase | `supabase/schema.sql`, `supabase/migrations/README.md`, `docs/SUPABASE_MIGRATION_AUDIT_2026-10-12.md` | O próprio repositório documenta histórico remoto incompleto e proíbe `db push` até reconciliação |
| Deploy | `DEPLOY.md`, `wrangler.jsonc` (referenciado pela documentação) | Deploy direto via Wrangler existe; não foi executado nesta auditoria |
| CI | `.github/workflows/ci.yml`, scripts do package | O workflow declara typecheck, testes, build e auditoria de dependências; estado verde do commit atual não foi confirmado |

## 3. Achados priorizados

### P0 — Bloqueador: histórico de migrations do Supabase

A documentação de `supabase/migrations/README.md` informa que o banco de produção foi criado antes de todo o histórico ser versionado e proíbe `supabase db push`, `db reset` ou reparo manual de versões até reconstrução verificável da baseline. O documento `docs/SUPABASE_MIGRATION_AUDIT_2026-10-12.md` contém uma fotografia datada de 14/10/2026, com versões remotas sem scripts correspondentes.

Como o repositório recebeu novas mudanças depois dessa data, a lista histórica do documento **não deve ser tratada como inventário atual**. A situação remota precisa ser consultada novamente e comparada com o Git antes de qualquer alteração de schema. Não recriar scripts históricos por inferência do schema final.

**Ação exigida:** exportar o schema remoto e histórico atual; recuperar os scripts originais ou definir uma baseline aprovada; reproduzir em projeto descartável; comparar tabelas, constraints, índices, funções, Storage e RLS; executar testes de leitura e escrita com duas contas. Até concluir, bloquear qualquer `db push` em produção.

### P1 — Licenciamento e rastreabilidade dos dados nutricionais

A documentação reconhece que a permissão comercial para redistribuir os registros TACO incorporados não está confirmada. A publicação pública de uma tabela não comprova, por si só, licença de redistribuição comercial. Open Food Facts exige análise da ODbL, atribuição e possíveis obrigações de share-alike; imagens podem ter termos diferentes. As estimativas brasileiras não são dados oficiais.

**Ação exigida:** obter autorização escrita para os dados sem licença inequívoca ou substituir gradualmente por dados compatíveis, mantendo fonte, versão, unidade, licença e nível de confiança por registro. Cada lote deve ser aditivo, idempotente, deduplicado e validado antes de retirar registros existentes.

### P1 — RLS e permissões precisam de nova validação integrada

A auditoria remota anterior registra testes de leitura de RLS em tabelas existentes, mas também documenta que isso não comprovou todas as operações de escrita e que novas tabelas/funções exigem validação. A fotografia de 14/10 é anterior às mudanças recentes do repositório.

**Ação exigida:** inventariar no banco remoto atual todas as tabelas, funções, grants e policies; validar SELECT/INSERT/UPDATE/DELETE sob duas contas autenticadas e usuário anônimo quando aplicável; verificar funções `SECURITY DEFINER`, privilégios e acesso à quota de IA. Não concluir que uma tabela está segura apenas porque RLS está habilitado.

### P1 — Catálogo de suplementos sem prova de cobertura completa

A busca do frontend consulta `supplement_catalog`, mas a inspeção do código não comprova que todos os produtos vendidos no Brasil estejam cadastrados nem que cada variante tenha rótulo verificado. Alguns campos nutricionais podem estar ausentes por não constarem na fonte; esses campos não devem ser preenchidos por suposição.

**Ação exigida:** produzir relatório reproduzível com total de produtos reais (separados de termos de busca), marcas/variantes, duplicatas, EANs, fonte, status de verificação e campos nutricionais ausentes. Testar busca por nome, marca e código de barras no ambiente conectado ao banco. Não declarar catálogo completo enquanto não houver critério de cobertura verificável.

### P1 — CI e E2E não certificados nesta rodada

O repositório possui scripts de `typecheck`, testes unitários, build e Playwright, e o workflow de CI declara verificações automatizadas. A consulta ao GitHub para execuções associadas ao SHA mais recente não retornou runs; por isso não é possível afirmar que o commit atual passou. Também não foram executados testes locais nesta auditoria.

**Ação exigida:** abrir o commit/PR atual no GitHub, confirmar cada check e logs, rodar E2E em ambiente configurado e smoke test de login, diário, editar/excluir lançamento, busca, receitas, jejum, medicamentos, exportação/importação e navegação móvel. Corrigir falhas antes de merge/deploy.

### P1 — Health Connect: documentação e teste físico

O cartão web consulta registros importados para a conta, e existe um app Android complementar. O README Android apresenta uma inconsistência: a abertura o descreve como sincronização manual, mas depois menciona sincronização ao abrir e execução periódica por WorkManager. Isso deve ser resolvido com base no comportamento real do código Android e testes de dispositivo, não apenas por texto.

**Ação exigida:** verificar o código Android e o comportamento em Samsung Galaxy real; testar login, refresh token, permissões concedidas/negadas/revogadas, Samsung Health → Health Connect, envio autenticado, duplicação, falhas de rede e isolamento de contas. Atualizar o README Android para uma descrição única e comprovada.

### P2 — Lembretes, áudio e segundo plano

O código de lembretes usa permissões do navegador e verifica a rotina em intervalos enquanto a página está visível. O som pode depender da interação prévia do usuário e das políticas do browser/Android. Notificações do sistema não garantem áudio audível; execução em segundo plano e entrega com o app fechado não devem ser prometidas sem Web Push/backend e testes por fabricante.

**Ação exigida:** testar som, permissão, modo silencioso, economia de bateria, PWA instalada e app em primeiro/segundo plano em Android real. Documentar com precisão o que funciona localmente e o que requer push.

### P2 — Offline e disponibilidade de serviços externos

O service worker armazena recursos estáticos; os dados pessoais continuam dependentes de sessão/rede/Supabase. Não foi encontrada evidência suficiente para declarar fila offline com reconciliação automática. Consultas externas (por exemplo, produtos) também dependem de disponibilidade e respostas das APIs.

**Ação exigida:** manter o estado offline claramente informado, cobrir falha/timeout/resposta vazia, impedir duplicação em tentativas e nunca mostrar uma gravação como salva até o backend confirmar.

### P2 — Configuração e custo

O frontend permite que a chave publicável do Supabase esteja no cliente, mas chaves privilegiadas e segredo do provedor de IA devem ficar no servidor. A gratuidade depende dos limites atuais de Cloudflare, Supabase, APIs externas, armazenamento e tráfego; não é possível garantir custo zero para qualquer escala.

**Ação exigida:** revisar secrets, URL de autenticação, redirect URLs, confirmação de e-mail, SMTP, proteção contra senhas comprometidas, logs e limites de quota no painel. Monitorar consumo antes de abrir o serviço ao público.

## 4. Divergências documentais corrigidas no README raiz

- A navegação foi atualizada para refletir cinco áreas principais (Início, Alimentação, Atividade, Evolução e Perfil) e opções internas agrupadas.
- Foram incluídos Coach de IA, receitas/planejamento/PDFs, metas de atividade e busca do catálogo de suplementos, com ressalvas sobre dependências e cobertura.
- O texto distingue cache de arquivos PWA de modo offline completo e lembretes locais de push garantido.
- A integração Health Connect passou a ser descrita como dependente de app complementar, permissões e validação física.
- A seção Supabase agora destaca a natureza datada do inventário anterior e mantém explícito o bloqueio a `db push`.
- Os scripts de desenvolvimento/teste e o fluxo de deploy estão documentados sem afirmar que os testes/deploy foram executados nesta rodada.

## 5. Plano de fechamento

1. **Supabase:** reconciliação de migrations e RLS antes de qualquer operação de schema.
2. **Qualidade de dados:** licença/proveniência TACO, política Open Food Facts e relatório de completude de alimentos/suplementos.
3. **CI:** confirmar status real do SHA atual; executar unitários, typecheck, build, auditoria de dependências e E2E.
4. **Testes integrados:** duas contas Supabase, operações CRUD, erros de rede, importação/exportação e fluxo de autenticação.
5. **Android/PWA:** teste físico de Health Connect, notificações/áudio e navegação móvel.
6. **Release:** revisar diff, checks e preview; só então autorizar merge/deploy. Nenhuma etapa de banco remoto deve ser incluída automaticamente em um PR de documentação.

## 6. Limites desta auditoria

Esta é uma auditoria estática do código e da documentação disponíveis no repositório em 19/10/2026. Não é pentest, auditoria legal, análise completa de dependências executada, validação de produção, consulta atual ao schema remoto nem certificação de todos os fluxos de interface. Os itens listados como pendentes são intencionalmente mantidos em aberto até que exista evidência verificável.


## 7. Atualização após consulta somente de leitura ao Supabase — 19/10/2026

Esta seção complementa o retrato estático inicial. Foram consultados o histórico de migrations, tabelas/colunas, políticas RLS e advisors do projeto remoto `yzcmxdbnitturlbozvqu`. Nenhum dado foi alterado.

### Estado remoto observado

- **18 migrations registradas.** As versões incluem as onze já documentadas na auditoria de 14/10 e sete versões posteriores: `20261014095327 medication_effect_logs`, `20261015034843 harden_ai_usage_direct_access`, `20261016014035 exercise_met_and_body_weight`, `20261016124123 create_supplement_catalog`, `20261016124142 seed_supplement_search_terms`, `20261016131549 seed_supplement_catalog_batch_02` e `20261019113958 food_extra_nutrients`.
- **15 tabelas públicas, todas com RLS habilitado; 51 políticas.** O estado do RLS está habilitado, mas a validação completa de isolamento CRUD com duas contas não foi executada nesta rodada.
- **Bug confirmado: `activity_goal_state` ausente.** O frontend chama essa tabela em `src/activity-cloud.ts`, mas ela não consta no inventário remoto. As metas e medalhas podem permanecer locais, mas a sincronização entre dispositivos não funciona até a tabela existir. A proposta de correção está em [PR #169](https://github.com/csilvadesweb/sistcs-leve/pull/169), com migration aditiva, RLS por proprietário, permissões explícitas, atualização do snapshot e teste estático; os checks da revisão consultada passaram, mas a migration não foi aplicada em produção.
- **Divergência de migration nutricional:** o remoto registra `20261019113958 food_extra_nutrients`, enquanto o arquivo em `main` se chama `20261019120000_food_extra_nutrients.sql`. As colunas extras existem no banco, mas o timestamp divergente precisa de reconciliação por fonte confiável. Não renomear/reparar o histórico por suposição.
- **Catálogo de suplementos:** 126 linhas totais; 11 `label_transcribed` com URL de fonte e valores de energia/proteína; 115 `needs_verified_product_data` sem URL de fonte, código de barras ou macronutrientes. Os 115 são categorias/termos de busca e não devem ser contados como produtos verificados. A busca do frontend exige energia, proteína, carboidratos e gorduras; a [PR #171](https://github.com/csilvadesweb/sistcs-leve/pull/171) acrescentou o filtro explícito por `data_status = 'label_transcribed'` e teste estático de regressão, e foi integrada à `main`. A publicação efetiva em produção ainda não foi verificada.

### Advisors e interpretação

- **Proteção contra senhas comprometidas desativada (WARN):** pendência de configuração do painel Supabase Auth. Não há ferramenta de configuração disponível nesta execução, portanto não foi alterada.
- **`consume_ai_quota()` SECURITY DEFINER executável por `authenticated` (WARN):** a função é a RPC esperada pelo Coach para consumir quota enquanto o acesso direto à tabela `ai_usage` está bloqueado. A definição verificada checa `auth.uid()` e limita a 30 chamadas por usuário/dia. Não revogar EXECUTE sem redesenhar o fluxo; o advisor deve permanecer documentado como revisão de segurança, não como falha automaticamente corrigível.
- **Três índices não usados (INFO):** `supplement_catalog_name_search`, `medication_logs_medication_idx` e `food_catalog_name_en_idx`. Não removê-los sem perfil de consultas e evidência de que não são necessários em cargas futuras.

### Bloqueios que continuam reais

1. Reconciliar o histórico de migrations, incluindo as versões históricas ausentes e a divergência de timestamp de `food_extra_nutrients`.
2. Validar a migration de `activity_goal_state` em ambiente descartável e integrar PR #169 com checks verdes; só depois planejar aplicação remota autorizada.
3. Ajustar a proteção contra senhas comprometidas no painel Supabase Auth e testar o fluxo de cadastro/login antes de declarar essa pendência resolvida.
4. Expandir o catálogo com produtos reais e rótulos confirmados; não preencher campos ausentes por inferência nem contar termos de busca como produtos.
5. Confirmar licença/autorizações dos dados nutricionais e realizar testes de RLS CRUD entre duas contas.

A consulta remota reduz a incerteza sobre o estado atual, mas não é uma prova completa de segurança nem substitui testes integrados e físicos. A regra de não executar `db push` continua válida.


## 8. Atualização após integração dos lotes de suplementos e inspeção de deploy — 19/10/2026

- A [PR #161](https://github.com/csilvadesweb/sistcs-leve/pull/161) foi integrada à `main` por squash commit após os workflows `ci`, `Validate SISTCS Leve` e `e2e` concluírem em `success` no SHA revisado. Os lotes 04–25 agora estão versionados no repositório; isso **não** significa que os produtos foram carregados no banco de produção.
- A consulta read-only do Supabase ainda mostrou 126 linhas no catálogo: 11 com status `label_transcribed` e 115 termos/categorias `needs_verified_product_data`. Nenhuma migration dos lotes 04–25 foi aplicada durante esta rodada.
- O Worker `sistcs-leve` no Cloudflare tinha como implantação mais recente observada a versão criada em `2026-10-19T12:11:24Z` (100% do tráfego). A consulta não encontrou implantação posterior; por isso, a presença do filtro de suplementos e de outras mudanças recentes na versão publicada não está comprovada.
- O histórico Supabase continua com a versão remota `20261019113958 food_extra_nutrients`, enquanto o arquivo versionado se chama `20261019120000_food_extra_nutrients.sql`. Não se deve aplicar `db push`, reparar o histórico ou renomear o arquivo de migration sem comparar o SQL remoto, o conteúdo do arquivo e o estado de todos os ambientes.
- A migration de `activity_goal_state` está na `main`, mas a tabela ainda não foi encontrada no banco remoto. O fluxo permanece sem sincronização entre aparelhos até a reconciliação e aplicação autorizada.

### Próximas ações seguras

1. Obter o diff exato entre o SQL remoto das colunas nutricionais e o arquivo `20261019120000_food_extra_nutrients.sql`, além do inventário de migrations em cada ambiente.
2. Reconciliar a versão divergente sem perder histórico nem fazer a migration ser aplicada duas vezes em ambientes diferentes; validar em ambiente descartável.
3. Executar as migrations do catálogo 04–25 em ambiente descartável com repetição/idempotência, rollback e auditoria de duplicatas; revisar os registros pendentes do lote 18 antes de contar esses itens como produtos prontos.
4. Planejar e verificar um deploy do Worker a partir do commit `main` atual, depois dos checks verdes. Não inferir deploy só porque o merge aconteceu.
5. Só então programar a aplicação remota autorizada e testar a sincronização de metas e a busca de suplementos em duas contas e em dispositivo real.
