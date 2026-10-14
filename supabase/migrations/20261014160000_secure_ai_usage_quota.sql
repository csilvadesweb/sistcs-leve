-- Least-privilege hardening for the AI daily quota.
-- The quota function is SECURITY DEFINER and writes as its owner, so browser roles
-- do not need direct access to the usage table.
revoke all on table public.ai_usage from anon, authenticated;

-- Pin the function to an empty search_path. All application objects referenced by
-- the function are schema-qualified; pg_catalog built-ins remain available.
alter function public.consume_ai_quota() set search_path = '';

-- Only signed-in clients need to consume their own quota via RPC.
revoke execute on function public.consume_ai_quota() from public, anon;
grant execute on function public.consume_ai_quota() to authenticated, service_role;
