-- Mantém o acesso direto à tabela bloqueado, mas deixa o contrato de RLS explícito.
-- A quota continua sendo consumida somente pela RPC autenticada.
create policy ai_usage_deny_direct_access
  on public.ai_usage
  for all
  to authenticated
  using (false)
  with check (false);
