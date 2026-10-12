# Auditoria SISTCS Leve — 2026-10-12

## Escopo e limites
Auditoria estática do repositório e consultas somente de leitura no Supabase correto `yzcmxdbnitturlbozvqu`. Nenhuma alteração foi feita em `main`, na aplicação publicada, na configuração de Auth ou no banco de dados. Typecheck, build e testes automatizados não foram executados neste ambiente; portanto, não há alegação de que passaram.

## Verificações realizadas

- Projeto Supabase responde e está em estado `ACTIVE_HEALTHY`.
- O banco registra 5 migrations aplicadas; o repositório inspecionado tem `supabase/schema.sql`, mas não expõe diretório `supabase/migrations/`. Há risco de divergência futura entre histórico do banco e versionamento. Não executar `schema.sql` como migração.
- As 9 tabelas públicas encontradas estão com RLS habilitado.
- As políticas consultadas de `public` limitam operações a `auth.uid() = user_id` para o usuário autenticado.
- Os buckets `avatars` e `progress-photos` têm políticas de leitura/escrita por pasta correspondente ao usuário autenticado; não foi feito teste de upload/download com usuários reais.
- Restrições compostas existentes impedem vincular favoritos e registros de medicamento a itens de outro usuário.
- Consultas agregadas de integridade retornaram zero ocorrências para: favoritos ligados a registros de outro usuário, logs de medicamento ligados a medicamento de outro usuário, intervalos de jejum inválidos, registros alimentares com valores negativos/inválidos, pesos fora da faixa e tipos de foto inválidos. São verificações pontuais, não prova de ausência de todo tipo de erro.
- Advisor de segurança: proteção contra senhas comprometidas desativada.
- Advisors de desempenho: 2 chaves estrangeiras sem índice de cobertura e 1 índice reportado como não utilizado. Não remover índices sem avaliar consultas e carga real.

## Achados para correção/validação

1. **Recuperação de senha** — a inspeção de `src/session.tsx` não identificou fluxo de recuperação por email e definição de nova senha. Confirmar fluxos existentes antes de implementar, incluindo links expirados/inválidos e redirects permitidos.
2. **Mensagens de autenticação** — `translateAuthError()` pode incluir mensagem técnica original em erros não mapeados. Preferir mensagem pública genérica e logging protegido sem dados sensíveis.
3. **Nutrientes ausentes** — em `src/foods-br.ts`, `fromOff` aparenta converter nutrientes ausentes em zero. Preservar a diferença entre valor zero confirmado e dado indisponível; requer decisão de UX/modelo de dados antes de alterar.
4. **Histórico de migrations** — banco tem 5 migrations registradas, mas o repositório consultado não tem `supabase/migrations/`. Reconciliar o histórico de forma aditiva e revisada, sem editar/reaplicar migrations já aplicadas e sem recriar o banco.
5. **Cobertura de testes** — `package.json` não declara script de testes automatizados. Adicionar cobertura para autenticação, nutrientes ausentes, cálculos e isolamento de usuário antes de alterações funcionais.
6. **Cálculos de saúde** — testar casos-limite e regressões de `src/calc.ts` antes de mudar fórmulas ou metas.
7. **PWA/offline** — revisar o service worker gerado e testar em navegador/dispositivo real; confirmar que dados de saúde autenticados não sejam armazenados em cache público.
8. **Proteção de senhas comprometidas** — recomendação do advisor. Não ativada nesta auditoria porque pode alterar a experiência de cadastro/login e requer validação/planejamento.

## Próximas etapas recomendadas

1. Executar `npm ci`, typecheck e build num ambiente com dependências e rede disponíveis; registrar resultados reais.
2. Criar testes de regressão para autenticação, importação de nutrientes ausentes, cálculos e isolamento por usuário.
3. Reconciliar as 5 migrations aplicadas com arquivos versionados em branch separada, sem aplicar alterações remotas.
4. Corrigir os dois avisos de índices somente após verificar planos/consultas; não remover o índice não utilizado sem evidência.
5. Planejar a ativação da proteção contra senhas comprometidas após avaliar impacto em usuários.
6. Revisar alterações por PR antes de qualquer publicação; smoke tests de produção devem evitar alterar dados reais.

## Status
- Acesso ao projeto Supabase correto: confirmado.
- Consultas remotas: somente leitura.
- Código funcional: não alterado.
- `main`: não alterada.
- Banco, Auth, Storage e produção: nenhuma alteração.
- Build/typecheck/testes: pendentes de execução.
