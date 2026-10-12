# Auditoria SISTCS Leve — 2026-10-12

## Escopo e limites
Auditoria estática preliminar do repositório. Nenhuma alteração foi feita em `main`, na aplicação publicada ou no banco de dados. O acesso ao projeto Supabase `yzcmxdbnitturlbozvqu` ainda precisa ser validado; portanto, as políticas e o estado aplicado do banco não são considerados verificados. Build, typecheck e testes automatizados não foram executados neste ambiente.

## Achados para correção/validação

1. **Recuperação de senha** — a inspeção de `src/session.tsx` não identificou fluxo de recuperação por email e definição de nova senha. Confirmar os fluxos existentes antes de implementar, incluindo links expirados/inválidos e redirects permitidos.
2. **Mensagens de autenticação** — `translateAuthError()` pode incluir a mensagem técnica original em erros não mapeados. Preferir mensagem pública genérica e logging protegido sem dados sensíveis.
3. **Nutrientes ausentes** — em `src/foods-br.ts`, a função `fromOff` aparenta converter nutrientes ausentes em zero. Preservar a diferença entre valor zero confirmado e dado indisponível.
4. **Isolamento de registros de medicamentos** — o schema de referência `supabase/schema.sql` mostra RLS de `medication_logs` por `user_id`; é necessário verificar se também é garantido que `medication_id` pertence ao mesmo usuário. Não executar o schema de referência como migração.
5. **Cobertura de testes** — `package.json` não aparenta declarar script de testes automatizados. Confirmar os scripts completos e adicionar cobertura apropriada antes de alterações funcionais.
6. **Cálculos de saúde** — testar casos-limite e regressões de `src/calc.ts` antes de mudar fórmulas ou metas.
7. **PWA/offline** — verificar em navegador/dispositivo real atualização do service worker, uso offline e que dados de saúde autenticados não sejam armazenados em cache público.
8. **RLS e estado real** — políticas, permissões e migrations aplicadas não foram confirmadas no projeto remoto. Fazer leitura somente depois que o acesso ao projeto correto estiver autorizado.

## Plano de validação
- Instalar dependências e executar typecheck, lint (se configurado), build e testes.
- Criar testes de regressão para autenticação, importação de nutrientes ausentes, cálculos e isolamento por usuário.
- Validar migrations aplicadas e advisors de segurança/performance no projeto Supabase correto.
- Revisar alterações na branch isolada e abrir PR para revisão; não publicar automaticamente.
- Fazer smoke tests de produção sem alterar dados reais, depois de revisar os resultados.

## Status
- Branch de auditoria isolada: criada.
- Código funcional: ainda não alterado.
- Banco de dados: nenhuma alteração.
- Produção/Cloudflare: nenhuma alteração.
- Testes: pendentes de execução.
