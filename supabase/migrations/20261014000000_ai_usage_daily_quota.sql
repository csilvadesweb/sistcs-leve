-- Limite diário (30 mensagens) do assistente IA, por conta. Já aplicada no projeto via Supabase.
create table if not exists public.ai_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  count integer not null default 0,
  primary key (user_id, day)
);
alter table public.ai_usage enable row level security;
-- Sem políticas: ninguém lê ou grava direto; só a função abaixo.

create or replace function public.consume_ai_quota()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  used integer;
begin
  if uid is null then return false; end if;
  insert into public.ai_usage (user_id, day, count)
  values (uid, (now() at time zone 'America/Sao_Paulo')::date, 1)
  on conflict (user_id, day) do update set count = public.ai_usage.count + 1
    where public.ai_usage.count < 30
  returning count into used;
  return used is not null;
end;
$$;
revoke all on function public.consume_ai_quota() from public, anon;
grant execute on function public.consume_ai_quota() to authenticated;
