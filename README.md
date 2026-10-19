# SISTCS Leve

Aplicativo web instalável (PWA) para acompanhar alimentação, hidratação, atividade física, jejum e evolução pessoal. O frontend usa React, TypeScript e Vite; autenticação e persistência usam Supabase; a publicação web é preparada para Cloudflare Workers com arquivos estáticos. Há também um aplicativo Android complementar para integração com Health Connect.

> **Estado e limites:** esta documentação descreve recursos identificados no código do repositório. Não significa que cada integração foi validada em produção, em aparelho físico ou no projeto Supabase remoto. Consulte a [auditoria geral de 19/10/2026](docs/AUDITORIA_GERAL_2026-10-19.md) para riscos, evidências e pendências.

## Navegação e funcionalidades

O menu principal tem cinco áreas. As opções internas ficam agrupadas em cada área, sem ocupar lugares adicionais no menu inferior; a ordem pode ser reorganizada por pressão longa e arraste, com preferências salvas na conta.

- **Início:** resumo diário e atalhos para acompanhar as metas.
- **Alimentação:** diário por refeição; busca de alimentos, produtos embalados e suplementos; porções e medidas caseiras; código de barras quando o navegador/dispositivo oferece suporte; favoritos; leitura assistida de foto de prato e de rótulo com revisão antes de salvar; totais de energia, macronutrientes, gordura saturada, açúcares e sódio quando informados.
- **Coach de IA:** conversa para sugestões educativas de refeições, receitas e substituições. O serviço depende de configuração segura da API na Cloudflare. O envio do resumo alimentar diário é opcional e desativado por padrão.
- **Hidratação:** registro de água, meta, volume do copo e lembretes configuráveis.
- **Jejum:** protocolos e temporizador, com histórico e estatísticas estimadas.
- **Receitas:** busca e filtros, favoritos, porções, planejamento semanal, lista de compras em PDF e receita em PDF, conforme os recursos disponíveis no catálogo.
- **Atividade:** registro de exercícios e estimativa aproximada de calorias por MET; metas e cronômetro de atividade; consulta aos passos e sessões importados quando a integração Android/Health Connect estiver configurada.
- **Evolução:** registros de peso, fotos de progresso, gráficos e relatórios.
- **Perfil:** dados pessoais, metas calculadas ou manuais, medicamentos e registro de doses, preferências de navegação, exportação/importação de dados e exclusão dos dados da conta.

### Cálculos e segurança de saúde

As metas calculadas são estimativas gerais, não prescrição nutricional. Cálculos dependem dos dados informados pela pessoa; confirme resultados e porções. O app não substitui orientação médica ou nutricional. Não use o jejum ou metas de perda de peso como recomendação clínica individual.

## Catálogo nutricional e qualidade dos dados

A busca combina fontes distintas, que devem ser apresentadas com sua origem e nível de confiança:

- **TACO/NEPA-UNICAMP:** usada como referência na base local; a autorização explícita para redistribuição comercial ainda precisa ser confirmada por escrito.
- **USDA FoodData Central:** preferir registros com origem identificável e licença pública aplicável (USDA declara dados do FDC em domínio público/CC0).
- **Open Food Facts:** útil para produtos embalados e códigos de barras; a base tem condições ODbL e requisitos de atribuição/share-alike. Imagens podem ter condições diferentes.
- **Estimativas brasileiras:** receitas e preparações sem referência adequada são estimativas, não valores oficiais ou análises laboratoriais.
- **Suplementos:** a busca consulta o catálogo estruturado no Supabase, mas a cobertura não é exaustiva. Um produto só deve ser considerado verificado quando os dados nutricionais e sua fonte foram confirmados; campos ausentes não devem ser inventados.

Leia [fontes e licenças de dados alimentares](docs/FOOD_DATA_SOURCES_AND_LICENSES.md) e a [auditoria de cobertura alimentar brasileira](docs/auditoria-cobertura-alimentar-brasileira-2026-10.md) antes de importar, remover ou redistribuir dados. Não copie bases proprietárias nem faça importação em massa sem avaliação de licença, deduplicação e testes de regressão.

## PWA, notificações e modo offline

- A instalação depende de navegador compatível e publicação HTTPS; em desenvolvimento local o service worker não representa o comportamento de produção.
- O service worker armazena arquivos da aplicação para permitir abrir a interface quando possível. **Isso não equivale a modo offline completo:** os registros e a sincronização dependem do Supabase/rede, e não há garantia de fila offline para gravações.
- Os lembretes de água usam permissões e recursos locais do navegador. A execução em segundo plano, o áudio e a entrega com o app fechado variam conforme Android, navegador, economia de bateria e configurações do sistema. Não há garantia de entrega push contínua em todos os dispositivos.
- Ao trocar logos/ícones, confira todos os assets e a versão/cache do service worker em aparelho real.

## Health Connect e aplicativo Android complementar

O código Android complementar solicita permissões para ler passos e sessões de exercício do Health Connect e envia registros vinculados à conta SISTCS. A disponibilidade depende dos dados fornecidos pelo Samsung Health ou outro app compatível e das permissões concedidas. A integração não deve ser considerada validada apenas porque a tela existe ou o APK compila.

Instruções de execução e limitações: [android-health-connect/README.md](android-health-connect/README.md). Antes de distribuição, teste em aparelho físico Samsung Galaxy, incluindo permissões concedidas/negadas/revogadas, login, falhas de rede, renovação de sessão e isolamento entre contas.

## Desenvolvimento

Requisitos: Node.js **22 ou superior** (consulte `package.json`).

```bash
npm ci
npm run dev         # servidor de desenvolvimento
npm run typecheck   # verificação TypeScript
npm test            # testes unitários
npm run build       # typecheck + build de produção em dist/
npm run test:e2e    # testes Playwright, quando o ambiente/browser estiver configurado
```

O workflow de CI também executa verificações automatizadas, incluindo auditoria de dependências. O resultado precisa ser consultado para o commit/PR específico; a existência do workflow não prova que a última execução passou.

## Configuração e publicação

- Veja `.env.example` para `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`. A chave publicável pode estar no frontend; **nunca** coloque `service_role`, chaves privadas, tokens ou segredos da IA no código cliente ou no Git.
- A API do Coach de IA requer segredo configurado no ambiente seguro da Cloudflare. Sem ele, a interface pode abrir, mas o serviço não estará disponível.
- Para publicar no domínio `https://leve.sistcs.com`, siga [DEPLOY.md](DEPLOY.md). `npm run deploy` publica diretamente: só execute após revisar o diff e aprovar os testes necessários.
- Configure e valide Site URL/Redirect URLs do Supabase, confirmação de e-mail e SMTP antes de disponibilizar autenticação ao público.
- Não presuma que o projeto permaneça 100% gratuito sob qualquer volume: quotas, armazenamento, tráfego, chamadas de IA e limites dos fornecedores podem mudar ou ser excedidos. Monitore os limites atuais dos planos usados.

## Supabase: regra obrigatória para migrations

O histórico de migrations do projeto de produção foi iniciado antes de todo o histórico estar versionado no Git. A documentação de auditoria anterior registra versões remotas sem scripts históricos completos correspondentes no repositório. Essa auditoria é um retrato datado e precisa ser reconciliada com o banco remoto antes de qualquer operação de schema.

**Não execute `supabase db push`, `supabase db reset` nem repare versões manualmente** até recuperar/validar os scripts históricos, exportar o schema remoto, reproduzir uma baseline em projeto descartável e comparar tabelas, constraints, índices, funções, Storage e políticas RLS. `supabase/schema.sql` é um snapshot cumulativo e não substitui os scripts históricos exatos.

Toda alteração de banco deve ser aditiva, revisada em PR, testada com execução repetida/rollback em ambiente descartável e validada quanto ao isolamento de usuários. Não aplicar migrations de produção como parte de uma simples atualização de documentação.

Referências: [auditoria de migrations Supabase](docs/SUPABASE_MIGRATION_AUDIT_2026-10-12.md) e [regras do diretório de migrations](supabase/migrations/README.md).

## Estrutura principal

- `src/App.tsx`: rotas, shell e navegação principal.
- `src/pages/`: páginas do app, incluindo alimentação, assistente, receitas, atividade, registros, relatórios, jejum, medicamentos e perfil.
- `src/data.ts` e `src/session.tsx`: modelos, persistência, carregamento de sessão e integração com Supabase.
- `src/calc.ts`: estimativas de metas.
- `src/foods-br.ts`, `src/foods-taco.ts`, `src/foodsearch.tsx`: busca, fontes, porções e código de barras.
- `src/recipes.ts`, `src/meal-plan.ts`: catálogo e planejamento de receitas.
- `src/pwa.tsx`, `public/manifest.webmanifest`, `public/sw.js`: instalação, atualizações e cache dos arquivos estáticos.
- `supabase/schema.sql`, `supabase/migrations/`: snapshot e alterações de banco versionadas.
- `android-health-connect/`: app complementar Android.
- `DEPLOY.md`: publicação no Cloudflare.

## Auditoria, critérios de aceite e pendências

A [auditoria geral de 19/10/2026](docs/AUDITORIA_GERAL_2026-10-19.md) separa o que foi verificado no código do que ainda exige validação externa. Em resumo:

1. Resolver a reconciliação histórica de migrations antes de qualquer alteração de schema em produção.
2. Revalidar políticas RLS e permissões, especialmente tabelas/funções adicionadas depois da auditoria remota anterior.
3. Confirmar licenças e proveniência do catálogo TACO e manter atribuição/obrigações do Open Food Facts.
4. Verificar cobertura, duplicatas e completude dos alimentos/suplementos sem inventar valores de rótulo.
5. Executar CI/E2E e smoke tests em preview; validar notificações e integração Health Connect em aparelhos físicos.
6. Não declarar produção validada com base apenas em typecheck/build ou documentação.

Nenhuma auditoria estática substitui testes de ponta a ponta no ambiente publicado. Atualize esta documentação quando a implementação, o estado remoto ou os limites de fornecedores forem confirmados novamente.
