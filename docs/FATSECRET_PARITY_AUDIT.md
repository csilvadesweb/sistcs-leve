# Auditoria de paridade funcional — SISTCS Leve × fatsecret

**Data:** 2026-10-12  
**Branch:** `audit/fatsecret-parity-zero-regression-20261012`  
**Escopo:** auditoria inicial baseada no código e README atuais; não certifica equivalência completa nem substitui testes de execução.

## Regra de segurança

- ZERO REGRESSÃO: não remover nem alterar comportamento existente sem teste de proteção.
- Não alterar o projeto Supabase, schema, RLS, dados de usuários, secrets, domínio ou configuração de produção nesta etapa.
- Não importar nem copiar a base proprietária do fatsecret. Usar somente dados/licenças autorizados e atribuição adequada.
- Não publicar em produção enquanto testes, revisão e validação funcional não estiverem aprovados.
- Toda funcionalidade nova deve respeitar o isolamento por usuário já existente no Supabase.

## Progresso verificado em 2026-10-12

- CI #39 no commit `1a1f6ccea15b4812ecdea2b7c4105b4fd4ddc972`: 45 testes aprovados, typecheck aprovado e build de produção aprovado.
- Adicionada cópia de um alimento do diário para a data selecionada, com confirmação ao duplicar no mesmo dia e testes para preservar nutrientes sem reutilizar o ID.
- Ampliados testes de leitura de dados legados e de escopo de conta nas nove consultas de `loadAll`; os testes mockados não substituem teste RLS real no Supabase.
- As consultas de `loadAll` na branch desta auditoria filtram explicitamente por `user_id`.
- A importação externa do Open Food Facts agora descarta produtos com energia negativa e normaliza nutrientes negativos/não numéricos para zero, com teste de regressão.
- Validação defensiva adicional em `src/calc.ts`: datas ISO impossíveis retornam idade inválida; estimativas recusam peso fora de 20–400 kg, altura fora de 50–260 cm, valores não finitos e configurações de atividade/macros desconhecidas.
- Testes de regressão acrescentados em `src/calc.test.ts` para datas impossíveis, limites de altura/peso e valores não finitos.
- CI do commit `e64fd1e20f89099af7885b92e04df2dfc207915d`: testes unitários, typecheck e build aprovados: https://github.com/csilvadesweb/sistcs-leve/actions/runs/38271409857
- Não foi executada migration, alteração de banco, merge ou deploy nesta rodada. Build aprovado não certifica comportamento em produção.
- O estado do PR deve ser conferido no GitHub antes de declarar integração à `main`; o estado observado nesta verificação ainda mostrava PR #3 aberta.

## Inventário observado no SISTCS Leve

Com base em `README.md`, `src/App.tsx`, `src/foods-br.ts` e `src/foodsearch.tsx`:

- Busca local com TACO (590 alimentos), produtos embalados consultados no Open Food Facts, cálculo por gramas e medidas caseiras.
- Consulta manual de código de barras e leitura por câmera em navegadores compatíveis.
- Diário alimentar por refeição, favoritos e metas de calorias/macronutrientes.
- Água, peso e progresso, fotos de antes/depois, jejum, medicamentos e marcação de doses.
- Relatórios de 7/14/30 dias; perfil, metas personalizadas, exportação/importação JSON.
- PWA instalável e suporte básico offline para arquivos do app; os dados dependem da conexão com o Supabase.
- O README informa que lembretes push com app fechado ainda não existem.

## Matriz inicial de paridade

| Área do fatsecret | Situação observada | Trabalho necessário |
|---|---|---|
| Busca de alimentos genéricos, marcas e restaurantes | Parcial: TACO + Open Food Facts | Aumentar cobertura usando fonte/API licenciada; identificar fonte e confiança de cada item; evitar prometer equivalência de catálogo |
| Calorias e nutrientes/macros | Parcial | Testes de unidade, arredondamento, unidades/porções, dados ausentes e limites |
| Código de barras | Parcial: Open Food Facts + câmera compatível | Testar códigos válidos/inválidos, produto não encontrado, permissões negadas e indisponibilidade de rede |
| Diário alimentar e refeições | Parcial | Calendário diário, editar/excluir/copiar lançamento, refeições personalizadas e histórico consistente |
| Metas de peso e nutrição | Existente | Testar limites, alterações de objetivo e cálculos; manter alertas e estimativas claramente identificados |
| Peso e gráficos | Existente | Testar histórico, datas, ordenação, valores inválidos e séries vazias |
| Diário de exercícios/calorias queimadas | Ausente no inventário atual | Criar registros, catálogo/entrada manual, estimativa claramente identificada e balanço diário |
| Calendário de dieta (consumo × exercício) | Parcial/ausente | Visão por dia, totais e navegação histórica sem duplicar lançamentos |
| Jornal/notas de progresso | Ausente no inventário atual | Notas por data, edição/exclusão e privacidade por usuário |
| Fotos e reconhecimento de alimentos por imagem | Parcial: fotos de progresso, sem reconhecimento alimentar observado | Fluxo de foto separado, consentimento, estimativa revisável e nenhuma gravação automática sem confirmação |
| Planejador de refeições/planos alimentares | Ausente no inventário atual | Planejamento por data, cálculo por refeição e cópia para diário; planos devem ser informativos e não substituir profissional |
| Receitas, refeições personalizadas e copiar alimento/refeição | Ausente no inventário atual | CRUD isolado por usuário, cálculo por ingredientes e testes de duplicação/edição |
| Água | Existente | Confirmar histórico diário, metas, edição/exclusão e persistência |
| Conquistas e sequências | Ausente no inventário atual | Regras determinísticas, datas locais e testes de virada de dia/fuso |
| Lembretes/notificações | Parcial/ausente: push reconhecido como pendente no README | Preferências por usuário, consentimento, permissões e backend seguro para push |
| Integrações Google Fit, Samsung Health e Fitbit | Ausentes no inventário atual | Investigar APIs, permissões e disponibilidade antes de escolher implementação |
| Comunidade e conteúdo educativo | Ausentes no inventário atual | Recurso opcional, controles de privacidade/moderação e conteúdo com fonte |
| Assistente por texto/voz e scanner inteligente premium | Ausentes no inventário atual | Protótipo com confirmação humana, validação nutricional e custo/privacidade avaliados |
| Login social | Login por e-mail/senha descrito | Avaliar provedores e configuração sem interromper autenticação existente |
| Sincronização multi-dispositivo | Supabase já usado | Testes de concorrência, sessão, isolamento por usuário e falhas de rede |

**Fontes públicas de referência para a matriz:**  
- fatsecret Brasil: https://www.fatsecret.com/br  
- Funcionalidades gratuitas e Premium: https://www.fatsecret.com/br/premium  
- Lista de funcionalidades no Google Play: https://play.google.com/store/apps/details?hl=pt_BR&id=com.fatsecret.android

A disponibilidade pode variar por região e versão. A meta é paridade funcional equivalente, com implementação própria; não copiar marca, interface proprietária, conteúdo protegido nem dados sem licença.

## Plano de testes obrigatório antes de integrar

### 1. Linha de base e regressão
- Confirmar build/typecheck da branch e da `main` no mesmo ambiente.
- Testar login/logout, carregamento da sessão e recuperação de sessão.
- Testar RLS/isolamento: usuário A nunca lê, altera ou exclui dados do usuário B.
- Testar CRUD e persistência para alimentos, favoritos, água, peso, fotos, jejum, medicamentos e relatórios.
- Testar exportação/importação JSON com arquivo válido, inválido, parcial e de versão anterior; nunca apagar dados silenciosamente.
- Testar PWA, rotas, navegação móvel, telas vazias, erros de rede e reconexão.

### 2. Nutrição e busca
- Casos: `2 ovos`, `150 g de arroz`, `1 banana`, `1 colher de sopa de azeite`, alimento com marca e código de barras.
- Verificar kcal, proteínas, carboidratos, gorduras e fibras contra cálculo por 100 g.
- Quantidades zero, negativas, não numéricas e acima de 5.000 g devem ser rejeitadas.
- Resultados não podem mudar sem mudança da consulta; preencher nutrientes não pode entrar em ciclo de renderização.
- Busca externa: timeout, cancelamento, resposta vazia, JSON inválido e produto sem nutrientes.
- Conferir duplicação de porções/rótulos, unidades e arredondamento.

### 3. Recursos novos
Cada novo módulo precisa de testes de unidade, integração com persistência, autorização/RLS, estados de erro/vazio/carregamento, acessibilidade básica e fluxo móvel. Adicionar um recurso por PR pequeno, com feature isolada e rollback claro.

### 4. Critérios de aceite
- TypeScript e build aprovados.
- Testes automatizados novos e existentes aprovados.
- Diff revisado; nenhum secret, dado real ou mudança destrutiva.
- Verificação de CI concluída e commit SHA confirmado.
- Smoke test em preview/ambiente isolado antes de qualquer deploy.
- Produção não é considerada validada apenas porque o build passou.

## Limite desta auditoria

Esta é a matriz inicial para orientar a implementação incremental. Não afirma que os recursos ausentes já foram construídos nem que testes de execução foram aprovados. O próximo passo é implementar em PRs pequenos, começando por cobertura de testes para busca/cálculos e depois pelos módulos de maior valor, sem integrar mudanças não verificadas.
