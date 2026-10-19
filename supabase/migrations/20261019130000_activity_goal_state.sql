-- Metas de atividade e medalhas na conta (antes só ficavam no navegador).
-- Uma linha por pessoa; só ela lê e altera. Aditiva: tabela nova, nada existente muda.
create table if not exists public.activity_goal_state (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  goals jsonb not null default '{}'::jsonb check (jsonb_typeof(goals) = 'object'),
  awards jsonb not null default '[]'::jsonb check (jsonb_typeof(awards) = 'array' and jsonb_array_length(awards) <= 5000),
  updated_at timestamptz not null default now()
);

alter table public.activity_goal_state enable row level security;

drop policy if exists activity_goal_state_select_own on public.activity_goal_state;
create policy activity_goal_state_select_own on public.activity_goal_state for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists activity_goal_state_insert_own on public.activity_goal_state;
create policy activity_goal_state_insert_own on public.activity_goal_state for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists activity_goal_state_update_own on public.activity_goal_state;
create policy activity_goal_state_update_own on public.activity_goal_state for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists activity_goal_state_delete_own on public.activity_goal_state;
create policy activity_goal_state_delete_own on public.activity_goal_state for delete to authenticated using ((select auth.uid()) = user_id);

revoke all on public.activity_goal_state from anon;

create or replace function public.touch_activity_goal_state() returns trigger
language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists activity_goal_state_touch on public.activity_goal_state;
create trigger activity_goal_state_touch before update on public.activity_goal_state
  for each row execute function public.touch_activity_goal_state();
