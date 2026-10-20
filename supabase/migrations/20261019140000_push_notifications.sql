-- Notificações push com o app fechado. Aditiva: duas tabelas novas.
-- push_subscriptions: um registro por aparelho, só o dono lê/altera.
-- push_sent: reserva de avisos já enviados (evita avisar a mesma dose duas vezes);
--            só o servidor (service_role) acessa, por isso não há políticas.
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  endpoint text not null unique check (char_length(endpoint) between 20 and 2000 and endpoint like 'https://%'),
  p256dh text not null check (char_length(p256dh) between 20 and 200),
  auth text not null check (char_length(auth) between 10 and 100),
  user_agent text check (user_agent is null or char_length(user_agent) <= 200),
  created_at timestamptz not null default now()
);
create index if not exists push_subscriptions_user_idx on public.push_subscriptions (user_id);
alter table public.push_subscriptions enable row level security;

drop policy if exists push_subscriptions_select_own on public.push_subscriptions;
create policy push_subscriptions_select_own on public.push_subscriptions for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists push_subscriptions_insert_own on public.push_subscriptions;
create policy push_subscriptions_insert_own on public.push_subscriptions for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists push_subscriptions_update_own on public.push_subscriptions;
create policy push_subscriptions_update_own on public.push_subscriptions for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists push_subscriptions_delete_own on public.push_subscriptions;
create policy push_subscriptions_delete_own on public.push_subscriptions for delete to authenticated using ((select auth.uid()) = user_id);
revoke all on public.push_subscriptions from anon;

create table if not exists public.push_sent (
  user_id uuid not null references auth.users(id) on delete cascade,
  dedupe_key text not null check (char_length(dedupe_key) <= 200),
  sent_at timestamptz not null default now(),
  primary key (user_id, dedupe_key)
);
create index if not exists push_sent_sent_at_idx on public.push_sent (sent_at);
alter table public.push_sent enable row level security;
revoke all on public.push_sent from anon, authenticated;
