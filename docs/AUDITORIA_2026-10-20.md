# Auditoria — 20/10/2026

Rodada complementar à [auditoria geral de 19/10/2026](AUDITORIA_GERAL_2026-10-19.md). Foco: estado do repositório e do CI, segurança e banco no Supabase, código, Worker e documentação.

## Como foi feito e o que isto não prova

- Repositório: PRs abertos, CI da `main`, workflows, varredura estática de padrões de risco (`dangerouslySetInnerHTML`, `eval`, segredos, `target="_blank"` sem `rel`), cabeçalhos de segurança, manifesto e PWA.
- Supabase (somente leitura): avisos de segurança e desempenho, ledger de migrations, tabelas, políticas e funções.
- Não foi possível executar `npm ci`, `npm test` ou `npm run build` no ambiente da auditoria (registro npm bloqueado). **O resultado do CI de cada PR é a evidência de testes**; os testes novos do push também foram executados localmente com um executor mínimo.
- Nada foi validado em aparelho físico nem no domínio publicado.

## Estado verificado

| Item | Resultado |
| --- | --- |
| CI na `main` (`ffc87a3`) | `verify`, `validate`, `e2e`, `ping` e `Workers Builds` com sucesso |
| Segredos no código | Nenhum encontrado (a chave publicável do Supabase é pública por desenho) |
| Padrões perigosos no código | Nenhum (`innerHTML`, `eval`, `document.write`); links externos usam `rel="noreferrer"` |
| Testes ignorados (`.skip`/`.only`) | Nenhum |
| Cabeçalhos (`public/_headers`) | CSP restritiva, HSTS, `X-Frame-Options: DENY`, `nosniff`, cache correto de `sw.js` e manifesto |
| RLS | Ativo em todas as tabelas públicas listadas, incluindo `activity_goal_state` |
| Cota de IA | `consume_ai_quota()` é chamada nas três rotas de IA do Worker |

### Avisos de segurança do Supabase (consulta de 20/10/2026)

1. **`consume_ai_quota()` executável por usuários autenticados (WARN).** Esperado: é a RPC que o Worker chama com o token da pessoa. Não remover a permissão sem redesenhar a cota.
2. **Proteção contra senhas vazadas desativada (WARN).** Configuração manual em Supabase > Authentication; não é possível alterar pelo conector usado. **Pendente para o proprietário.**

Desempenho: 3 índices sem uso (INFO, `supplement_catalog_name_search`, `medication_logs_medication_idx`, `food_catalog_name_en_idx`). Sem ação: as tabelas são pequenas e dois deles dão suporte a busca e a chave estrangeira.

## Corrigido nesta rodada

| Problema | Correção |
| --- | --- |
| Tela inicial **preta** ao abrir o app instalado (`background_color` do manifesto era `#000000`, contra o tema claro) | `#f4f6f1` em `public/manifest.webmanifest` |
| Documentação defasada (registro rápido, cópia de dia, metas na conta, padrão de botões, Worker) | `README.md` atualizado |
| Push (PR #184): o agendador lia só as primeiras 1.000 linhas de medicamentos | Leitura paginada |
| Push: limpeza de reservas só rodava em minutos com dose | Limpeza uma vez por hora |
| Push: `/api/push/test` sem limite | 1 teste por minuto por pessoa (429) |
| Push: "Ativar lembretes" podia travar sem service worker registrado | Tempo limite e mensagem clara |
| "Apagar tudo" do perfil não removia as inscrições push | Incluídas na lista (tolera tabela ausente) |

## Pendências que dependem do proprietário

1. **Push em produção** (PR #184): rodar `supabase/migrations/20261019140000_push_notifications.sql`, gerar as chaves com `node scripts/generate-vapid.mjs` e guardar `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` e `SUPABASE_SERVICE_ROLE_KEY` como segredos do Worker (seção 6 do `DEPLOY.md`). Sem isso o app apenas informa que o recurso não está ativado.
2. Ativar a proteção contra senhas vazadas no Supabase Auth (exige plano que ofereça o recurso).
3. Testar em aparelho físico: sincronização de metas entre dispositivos, notificações push (Android e iPhone instalado) e Health Connect.
4. Smoke test no domínio publicado após o próximo deploy.

## Observações sem correção (dívida técnica)

- `src/pages/Exercises.tsx` usa `style={{...}}` extenso em botões de cartão; mover para CSS exige conferência visual.
- O workflow `backup.yml` imprime host e usuário da conexão no log de um repositório público (sem senha). Considerar remover essas linhas após o backup estar estável.
- Há dezenas de branches remotas antigas (muitas de PRs já mesclados). Limpar com cuidado, conferindo cada uma.
- Migrations aplicadas pelo SQL Editor podem não entrar no ledger remoto; ao aplicar a do push, registrar a versão se o ledger for reconciliado.
- Lembretes de água continuam funcionando só com o app aberto (o push cobre apenas doses de medicamento).
