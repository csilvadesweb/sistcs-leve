# Auditoria de produção — SISTCS Leve

**Data:** 15/10/2026
**Escopo:** GitHub `csilvadesweb/sistcs-leve`, Supabase `yzcmxdbnitturlbozvqu` e Cloudflare Worker `sistcs-leve`.
**Método:** inspeção somente leitura do código/configuração, inventário remoto, advisories do Supabase, validação HTTP do domínio publicado, testes, build e auditoria de dependências.

> “100%” não é uma propriedade verificável de um sistema real. Neste relatório, significa **seguro para produção, reproduzível, observável, recuperável, testado e preparado para crescer**, com riscos conhecidos aceitos explicitamente.

## 1. Resumo executivo

### Estado atual

| Área | Estado | Evidência |
|---|---|---|
| Aplicação publicada | **OK** | `https://leve.sistcs.com` responde HTTP 200 |
| Worker/API de IA | **OK com melhorias** | `/api/ai/status` responde e informa Gemini disponível |
| Supabase | **Saudável, mas com advisories** | projeto `ACTIVE_HEALTHY`, PostgreSQL 17.11 |
| RLS | **Bom** | tabelas públicas do app e buckets privados têm políticas por usuário |
| Testes | **OK** | 24 arquivos, 220 testes passando |
| TypeScript/build | **OK** | `typecheck` e `vite build` passam |
| Dependências de produção | **OK no momento** | `npm audit --omit=dev`: 0 vulnerabilidades |
| Histórico de migrations | **CRÍTICO** | migrations remotas aplicadas não estão todas no Git e há versões divergentes |
| GitHub | **Risco alto de governança** | repositório público, `main` sem proteção, sem SECURITY.md ativo |
| Backup/restore | **Não comprovado** | workflow existe, mas não foi possível provar que secrets estão configurados nem que um restore foi testado |
| Escalabilidade do front-end | **Precisa melhorar** | chunk de receitas ~1 MB e carregamento inicial de dados sem paginação em várias tabelas |

### Prioridades

1. **P0 — Antes de novas migrations:** reconciliar o histórico Supabase e criar uma baseline reproduzível.
2. **P0 — Antes de aceitar dados reais em escala:** testar restore de backup e confirmar secrets/retention.
3. **P0 — Segurança operacional:** proteger `main`, exigir CI, adicionar política de segurança e revisar permissões do GitHub.
4. **P1 — Supabase:** corrigir os três advisories de segurança e revisar o índice não utilizado.
5. **P1 — Privacidade/LGPD:** fechar ciclo de exclusão, retenção, consentimento e incident response para fotos, medicamentos e dados de saúde.
6. **P1 — Escala/performance:** paginação/limites no cliente, code splitting e estratégia de cache/observabilidade.
7. **P2 — Produto:** push real, compartilhamento seguro, sincronização offline robusta e catálogo/licenças.

## 2. O que foi verificado

### GitHub

- Repositório público: `csilvadesweb/sistcs-leve`.
- Branch padrão: `main`.
- Não há proteção de branch: a API retornou `Branch not protected`.
- Não há `SECURITY.md`/security policy ativo.
- CI, E2E, Android e backup estão versionados.
- O workflow usa `npm install`, não `npm ci`; no estado clonado não havia `package-lock.json` versionado. O `npm install` usado na auditoria criou um lockfile local não versionado.
- O workflow `validate.yml` dispara push apenas em uma branch específica (`feat/visual-parity-nutrition-ui`), portanto não é uma validação geral da `main`.
- O workflow E2E roda, mas não está configurado como check obrigatório de merge.
- Não foi possível consultar nomes de secrets nem Code Scanning por limitação de permissão da integração GitHub (`403`). Isso não prova que os secrets estejam ausentes.

### Supabase

Projeto ativo:

- Ref: `yzcmxdbnitturlbozvqu`
- Região: `sa-east-1`
- Estado: `ACTIVE_HEALTHY`
- PostgreSQL: `17.11.0.003`

Tabelas de negócio encontradas: `profiles`, `food_entries`, `favorite_foods`, `water_entries`, `weight_entries`, `medications`, `medication_logs`, `progress_photos`, `fasting_entries`, `exercise_entries`, `health_activity_records`, `ai_usage` e `medication_effect_logs`.

As tabelas do app têm RLS habilitado e políticas de `SELECT/INSERT/UPDATE/DELETE` limitadas ao `auth.uid()` do proprietário. Os buckets `avatars` e `progress-photos` estão privados, limitados a 5 MB e com MIME types de imagem.

Edge Function encontrada:

- `delete-account`, ativa, `verify_jwt=true`, versão 3.

### Cloudflare

- Worker `sistcs-leve` existe e está publicado.
- Não há bancos D1 nem namespaces KV na conta consultada.
- A listagem de R2 retornou 403 informando que R2 precisa ser habilitado; o app atualmente usa Storage do Supabase, portanto isso não é bloqueio funcional.
- O Worker publicado corresponde ao desenho do código local: assets estáticos, endpoints `/api/ai/*`, autenticação via Supabase e chave Gemini mantida no ambiente do Worker.
- Não foram feitas alterações no Cloudflare.

## 3. Achados críticos e correções recomendadas

## P0 — Reconciliar o histórico do Supabase

O remoto registra 12 migrations, incluindo versões que não estão representadas por arquivos históricos completos no `main`:

- `20261011021110_meu_progresso_total_schema_inicial`
- `20261011030655_meu_progresso_total_peso_medicamentos_perfil`
- `20261011143427_personalizacao_metas`
- `20261011150916_foto_antes_depois_jejum`
- `20261012015340_fase_1_integridade_dados_usuario`
- `20261012113725_menu_personalizado`
- `20261012162317_fix_favorite_foods_source_delete`
- `20261012163900_navigation_preferences`
- `20261012195153_exercise_entries`
- `20261013020313_health_activity_records`
- `20261014003810_ai_usage_daily_quota`
- `20261014095327_medication_effect_logs`

No Git há apenas parte dos scripts. Além disso, os nomes/versões de alguns arquivos locais não correspondem às versões remotas. O `supabase/schema.sql` é um snapshot cumulativo, não a sequência histórica exata.

**Risco:** um `supabase db push`, `db reset` ou nova instalação pode divergir do banco de produção, perder constraints/policies, falhar em deploy ou recriar um estado incorreto.

**Plano seguro:**

1. Exportar o schema atual do remoto de forma verificável.
2. Recuperar os scripts originais do histórico de branches/PRs ou gerar uma baseline explícita do estado atual.
3. Criar ambiente descartável/local e aplicar a baseline do zero.
4. Comparar tabelas, constraints, índices, policies, buckets e funções.
5. Só depois voltar a usar migrations incrementais.
6. Nunca marcar migrations como aplicadas por aproximação.
7. Adicionar CI que falhe se migration local e histórico remoto divergirem.

**Critério de pronto:** novo projeto vazio reproduz o mesmo contrato do projeto atual e os testes RLS passam em pelo menos dois usuários.

## P0 — Backup e restauração comprovados

Existe workflow semanal `.github/workflows/backup.yml` com dump criptografado, mas a auditoria não conseguiu verificar se `SUPABASE_DB_URL` e `BACKUP_PASSPHRASE` estão realmente configurados, pois a integração GitHub retornou 403 para a listagem de secrets. O próprio workflow apenas avisa e termina com sucesso quando os secrets faltam.

**Melhorias:**

- Fazer o workflow falhar ou gerar alerta externo quando um backup esperado não for produzido; não tratar “backup ignorado” como sucesso operacional.
- Enviar cópia para armazenamento externo ao GitHub, com retenção e controle de acesso.
- Validar checksum e tamanho mínimo do dump.
- Testar restore mensal em projeto descartável.
- Verificar restauração de Storage e da configuração Auth; o dump atual cobre apenas `public` e não cobre `auth.users`.
- Documentar RPO/RTO, dono do processo e procedimento de rotação da passphrase.
- Nunca deixar a passphrase somente no GitHub.
- Criar uma métrica/alerta de “último backup válido” e “último restore validado”.

**Observação:** fotos e outros objetos do Storage não são cobertos por um `pg_dump` comum. É necessário backup separado de objetos ou aceitar formalmente que as fotos não são recuperáveis.

## P0 — Proteger a branch principal

A `main` está sem branch protection e o repositório é público.

**Configurar:**

- exigir pull request para merge;
- exigir 1 ou 2 revisões;
- exigir checks `ci`, `e2e` e build/Cloudflare;
- bloquear force-push e deleção;
- exigir branch atualizada antes do merge;
- habilitar Dependabot security updates;
- configurar CodeQL/secret scanning, se disponível no plano/integração;
- adicionar `SECURITY.md` com canal de reporte;
- ativar deleção automática de branches após merge;
- remover permissões de escrita desnecessárias dos workflows.

## P1 — Corrigir advisories de segurança do Supabase

O Supabase retornou:

1. **RLS enabled no policy — INFO:** `public.ai_usage` tem RLS, mas não possui policies.
2. **Signed-in users can execute SECURITY DEFINER function — WARN:** `public.consume_ai_quota()` é `SECURITY DEFINER` e pode ser chamada por `authenticated`.
3. **Leaked Password Protection Disabled — WARN:** proteção contra senhas comprometidas está desligada.

### `ai_usage` e `consume_ai_quota`

O desenho atual é intencional: usuários autenticados precisam chamar a função para consumir quota, mas não devem ler/gravar a tabela diretamente. Os privilégios diretos estão revogados e o `search_path` da função está endurecido, o que é positivo.

**Melhoria recomendada:** tirar a função do schema exposto à API (`public`) ou criar uma camada RPC mínima dedicada, revogar privilégios padrão no schema e manter somente o `EXECUTE` estritamente necessário. Se a função permanecer exposta a `authenticated`, documentar o motivo, manter testes de abuso/concurrency e aceitar o advisory explicitamente. Não criar policy ampla em `ai_usage` apenas para fazer o advisory desaparecer.

**Testar:** concorrência de dezenas de chamadas, limite exato 30 por usuário/dia, timezone, falhas do provider, repetição, usuário deslogado e tentativa de acesso direto.

### Leaked Password Protection

Ativar no painel do Supabase antes de produção pública. Depois testar cadastro, troca e recuperação de senha, inclusive mensagens de erro que não revelem se um e-mail existe.

## P1 — Dados de saúde, LGPD e exclusão

O sistema armazena peso, medicamentos, efeitos, fotos corporais, jejum e atividade física. Isso exige governança maior que um CRUD comum.

**Fazer:**

- definir base legal, finalidade, prazo de retenção e controlador/operador;
- registrar versão do consentimento de privacidade e timestamp;
- permitir exportação completa e legível;
- permitir exclusão completa e confirmar o que é apagado;
- documentar subprocessadores: Supabase, Cloudflare, Gemini, Open Food Facts e fontes de dados;
- definir política de incidentes e contato de privacidade;
- não enviar fotos pessoais ao Gemini sem consentimento explícito e indicação clara;
- deixar explícito que estimativas nutricionais/IA não são diagnóstico nem prescrição;
- revisar mensagens de jejum, medicamentos, gravidez, transtornos alimentares e sintomas de urgência com profissional qualificado.

### Edge Function `delete-account`

A função exige JWT e usa service role apenas no servidor, o que é o padrão correto. Porém:

- CORS está `*` em uma operação sensível;
- falhas de `list`/`remove` do Storage são ignoradas;
- `limit: 1000` pode deixar arquivos se o usuário superar o limite;
- exclusão de objetos e usuário não é uma operação transacional;
- a função publicada não está claramente versionada junto com um pipeline de deploy no repositório.

**Corrigir:** restringir `Access-Control-Allow-Origin` a `https://leve.sistcs.com` e localhost de desenvolvimento controlado; listar/paginar até esvaziar; verificar cada erro; emitir logs sem dados pessoais; criar teste de exclusão com objetos; versionar/deployar a função pelo CI.

## P1 — Paginação e crescimento do banco

`loadAll()` faz várias consultas sem limite: alimentos, favoritos, água, peso, medicamentos, logs e fotos. Apenas jejuns, exercícios e efeitos têm limites explícitos.

**Riscos:** tempo de login cresce com o histórico, consumo de memória aumenta, o usuário pode baixar dados demais e o limite gratuito do Supabase pode ser atingido mais cedo.

**Implementar:**

- paginação por tela e por período;
- filtros por `entry_date`/`created_at`;
- `select` somente das colunas necessárias;
- limites explícitos e UX para “carregar mais”;
- exportação completa em endpoint/job separado;
- índices compostos alinhados às consultas reais;
- testes com 10 mil+ registros por usuário.

Índice apontado pelo advisor como não utilizado: `medication_logs_medication_idx`. Confirmar com workload real antes de remover; ele pode ser usado por consultas futuras ou pouco frequentes.

## P1 — Cloudflare Worker e API de IA

Pontos positivos:

- chave Gemini não está no frontend;
- autenticação consulta `/auth/v1/user`;
- entrada é validada e resposta do modelo é filtrada;
- quota é por usuário e armazenada no Supabase;
- CORS do Worker está restrito ao domínio público;
- imagens não são armazenadas pelo Worker.

Melhorias importantes:

- adicionar rate limit também por IP/edge e por rota, pois quota por conta não impede abuso com muitas contas;
- limitar tamanho do corpo HTTP antes de parsear JSON, além do limite aplicado ao base64;
- adicionar timeout explícito às chamadas externas;
- usar `AbortController` para controlar custo e latência;
- validar rigorosamente todos os campos e unidades da resposta da IA antes de exibir/salvar;
- não devolver detalhes operacionais desnecessários em `api/ai/status` se o modelo não precisar ser público;
- adicionar request ID, latência, status e consumo de quota em logs sem tokens, prompts, fotos ou dados de saúde;
- configurar alertas de custo/erro do Gemini;
- separar quotas de chat, foto de prato e rótulo se o custo e o risco forem diferentes;
- garantir que imagens e prompts não sejam retidos pelo provedor além do necessário, conforme termos/configuração vigente;
- criar testes de prompt injection, JSON malformado, conteúdo médico perigoso e payloads gigantes;
- rever o modelo configurado e estabelecer fallback/feature flag quando o provider estiver indisponível.

## P1 — Conteúdo e licenças do catálogo

O próprio repositório reconhece incerteza de licença em dados derivados de TACO/NEPA-UNICAMP e obrigações da Open Food Facts/ODbL.

Antes de monetizar ou redistribuir:

- obter autorização escrita para dados cuja licença comercial não está comprovada;
- manter provenance por registro/lote;
- separar dados próprios, USDA/CC0 e dados ODbL;
- exibir atribuição exigida;
- revisar condições de imagens do Open Food Facts separadamente da base;
- automatizar gates para impedir entrada de registro sem `source`, `license` e `attribution`;
- manter processo de remoção/correção de dados.

## P1 — Reprodutibilidade de dependências e CI

O projeto não tinha lockfile versionado no clone auditado e os workflows usam `npm install`.

**Fazer:**

1. Gerar `package-lock.json` deliberadamente.
2. Revisar e commitar o lockfile.
3. Trocar CI/deploy para `npm ci`.
4. Fixar versões de actions e dependências críticas por política de atualização.
5. Adicionar `npm audit --omit=dev` ao CI, sem bloquear indiscriminadamente por vulnerabilidades de desenvolvimento transitórias.
6. Fazer build do Worker com `wrangler deploy --dry-run` em PR.
7. Publicar somente após checks obrigatórios.
8. Gerar SBOM e manter inventário de dependências.

A auditoria atual encontrou **0 vulnerabilidades de produção** no `npm audit --omit=dev`; isso é um retrato do momento, não uma garantia permanente.

## P1 — Performance do frontend

O build passa, mas gera avisos relevantes:

- `Recipes` chega a aproximadamente **1,045 kB** minificado;
- bundle principal chega a aproximadamente **436 kB** minificado;
- o catálogo de receitas parece ser carregado no bundle mesmo quando o usuário não abre a tela.

**Melhorias:**

- lazy load por rota com `import()`;
- mover catálogo grande para asset versionado/endpoint paginado;
- dividir receitas por categoria;
- analisar bundle com `rollup-plugin-visualizer`;
- comprimir e otimizar imagens;
- medir Web Vitals, especialmente LCP, INP e CLS em celular;
- validar PWA em Android/iOS reais;
- adicionar cache versionado apenas para assets imutáveis e confirmar invalidação do service worker.

## P2 — Offline, sincronização e mobile

O PWA abre offline, mas os dados continuam dependentes do Supabase. O README informa que novos registros só serão salvos quando a conexão voltar; isso não equivale a sincronização offline completa.

Para elevar a robustez:

- usar fila local transacional (IndexedDB) para mutações;
- idempotency keys por operação;
- estado de sincronização visível;
- resolução de conflitos;
- retry com backoff;
- testes de queda de rede durante insert/update/delete;
- testar Android TWA e Health Connect em versões suportadas;
- evitar que notificações revelem medicamentos ou efeitos adversos.

## P2 — Funcionalidades de produto que faltam para um produto maduro

- push real com VAPID, subscriptions RLS, revogação, expiração e limpeza;
- compartilhamento de relatório somente leitura com token aleatório, hash, expiração e revogação;
- auditoria de acessos a dados compartilhados;
- painel administrativo mínimo para saúde do serviço, quota e falhas (sem expor dados pessoais);
- métricas de funil: cadastro, confirmação, primeiro registro, retenção e falhas de sync;
- suporte a exportação em CSV/JSON e portabilidade;
- catálogo com cobertura, fontes e correção colaborativa controlada;
- testes de acessibilidade WCAG 2.2 AA;
- testes cross-browser e visual regression para mobile.

## 4. Plano de execução sugerido

### Fase 0 — 1 dia: bloquear riscos de release

- Não executar `db push`/`db reset`.
- Proteger `main` e tornar CI obrigatório.
- Confirmar secrets de backup por canal administrativo.
- Ativar Leaked Password Protection.
- Adicionar `SECURITY.md`.
- Versionar lockfile e trocar workflows para `npm ci`.
- Corrigir README que ainda sugere que algumas migrations não foram aplicadas.

### Fase 1 — 2 a 5 dias: banco e recuperação

- Reconciliar migrations.
- Criar baseline reproduzível.
- Testar RLS multiusuário para leitura e escrita.
- Testar exclusão completa de conta e Storage.
- Executar primeiro restore real em projeto descartável.
- Definir retenção, RPO/RTO e alerta de backup.

### Fase 2 — 1 a 2 semanas: segurança e escala

- Paginação e filtros no `loadAll()`.
- Rate limiting por IP/rota no Worker.
- Timeouts e observabilidade da IA.
- CORS restrito na Edge Function.
- Code splitting e redução do catálogo inicial.
- Gates de provenance/licença.
- CI com build Worker, E2E e segurança.

### Fase 3 — 2 a 4 semanas: maturidade de produto

- Offline transacional.
- Push seguro.
- Compartilhamento com expiração/revogação.
- LGPD operacional e fluxo de direitos do titular.
- Monitoramento, alertas e dashboard operacional.
- Testes de carga, acessibilidade, mobile e disaster recovery.

## 5. Checklist de aceite “pronto para produção”

- [ ] Migrations locais reproduzem o remoto em ambiente limpo.
- [ ] RLS testado por dois usuários em SELECT/INSERT/UPDATE/DELETE.
- [ ] Buckets privados testados contra acesso cruzado.
- [ ] Exclusão de conta remove linhas e objetos, inclusive acima de 1.000 objetos.
- [ ] Backup automático comprovadamente produzido.
- [ ] Restore testado e cronometrado.
- [ ] Auth com proteção contra senha comprometida.
- [ ] `main` protegida e checks obrigatórios.
- [ ] Lockfile no Git e CI/deploy usando `npm ci`.
- [ ] Nenhum segredo privado no repositório ou bundle.
- [ ] Rate limit de IA por conta e por abuso de origem.
- [ ] Timeouts, logs sanitizados, métricas e alertas configurados.
- [ ] Paginação e limites para todos os históricos.
- [ ] Bundle e Web Vitals dentro das metas definidas.
- [ ] Política de privacidade/LGPD e retenção revisadas.
- [ ] Licenças/provenance do catálogo comprovadas.
- [ ] Teste de carga e disaster recovery executados.
- [ ] E2E mobile, acessibilidade e compatibilidade validados.

## 6. Limitações da auditoria

- Não foram feitas alterações em GitHub, Supabase ou Cloudflare.
- Não foi possível validar o conteúdo dos GitHub Actions secrets nem Code Scanning devido a `403` da integração.
- Não foi feito teste destrutivo de RLS com identidades reais nem exclusão de conta em produção.
- O segundo Worker Cloudflare (`sistcs`) foi listado, mas não foi atribuído com segurança a este sistema; deve ser auditado separadamente se fizer parte da mesma operação.
- Não foi possível confirmar por esta conexão as configurações de Auth/SMTP/URLs no painel além dos advisories retornados pelo Supabase.

## 7. Evidências técnicas executadas

- `npm run typecheck`: passou.
- `npm test`: **24 arquivos / 220 testes passaram**.
- `npm run build`: passou.
- `npm audit --omit=dev`: **0 vulnerabilidades**.
- HTTP `https://leve.sistcs.com`: 200.
- HTTP `/api/ai/status`: 200, IA disponível.
- Supabase: `ACTIVE_HEALTHY`, PostgreSQL 17.11.
- Cloudflare: Worker `sistcs-leve` publicado; D1/KV ausentes; R2 não habilitado.
- Advisories Supabase: 3 de segurança e 1 de performance, detalhados acima.

## Atualização de execução — 15/10/2026

Foram executadas as primeiras etapas de hardening:

- branch `fix/production-hardening-20261015` criada e publicada;
- pull request [#129](https://github.com/csilvadesweb/sistcs-leve/pull/129) aberto;
- `main` protegida com revisão de CODEOWNER, checks `verify`/`e2e`, bloqueio de force-push e resolução de conversas;
- Edge Function `delete-account` publicada como versão 4, com JWT obrigatório, CORS restrito e limpeza paginada;
- Worker preview aprovado pelo Cloudflare Workers Builds;
- Node 22 fixado nos workflows, `.node-version` e `package.json`;
- `npm ci`, typecheck, 220 testes, build, E2E e validação Wrangler aprovados;
- policy explícita de negação criada em `public.ai_usage`, removendo o advisory INFO de RLS sem abrir acesso aos dados;
- preflight público da Edge Function retornando HTTP 204 e Worker público retornando HTTP 200.

O PR permanece **bloqueado por revisão humana obrigatória**. O preview Cloudflare está aprovado, mas o Worker de produção continuará na versão anterior até o PR ser revisado e integrado na `main`; não foi feito bypass da proteção. Permanecem dois advisories intencionais/pendentes no Supabase: a RPC de quota `SECURITY DEFINER` ainda precisa de uma arquitetura RPC privada ou revisão explícita da exceção, e a proteção contra senhas comprometidas precisa ser ativada no painel Auth do Supabase.
