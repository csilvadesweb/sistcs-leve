-- Refeições salvas: combinações de alimentos que a pessoa registra com um toque.
-- Aditiva, idempotente e protegida por RLS. Os itens ficam em jsonb (cópia dos valores).
create table if not exists public.saved_meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  items jsonb not null default '[]'::jsonb
    check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) between 1 and 60),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists saved_meals_user_idx on public.saved_meals (user_id, created_at desc);

alter table public.saved_meals enable row level security;

revoke all on table public.saved_meals from public;
revoke all on table public.saved_meals from anon;
grant select, insert, update, delete on table public.saved_meals to authenticated;

drop policy if exists saved_meals_select_own on public.saved_meals;
create policy saved_meals_select_own on public.saved_meals for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists saved_meals_insert_own on public.saved_meals;
create policy saved_meals_insert_own on public.saved_meals for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists saved_meals_update_own on public.saved_meals;
create policy saved_meals_update_own on public.saved_meals for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists saved_meals_delete_own on public.saved_meals;
create policy saved_meals_delete_own on public.saved_meals for delete to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.touch_saved_meals()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists saved_meals_touch on public.saved_meals;
create trigger saved_meals_touch before update on public.saved_meals
  for each row execute function public.touch_saved_meals();
