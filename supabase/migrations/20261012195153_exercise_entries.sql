-- Migration aditiva: diário de exercícios; não remove nem altera dados existentes.
create table if not exists public.exercise_entries (id uuid primary key default gen_random_uuid(),user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,entry_date date not null,activity text not null check(char_length(btrim(activity)) between 1 and 100),duration_minutes integer not null check(duration_minutes between 1 and 1440),calories_burned numeric not null check(calories_burned>=0 and calories_burned<=20000),note text check(note is null or char_length(note)<=300),created_at timestamptz not null default now());
create index if not exists exercise_entries_user_date_idx on public.exercise_entries(user_id,entry_date desc,created_at desc);
alter table public.exercise_entries enable row level security;
drop policy if exists exercise_entries_select_own on public.exercise_entries;
create policy exercise_entries_select_own on public.exercise_entries for select to authenticated using((select auth.uid())=user_id);
drop policy if exists exercise_entries_insert_own on public.exercise_entries;
create policy exercise_entries_insert_own on public.exercise_entries for insert to authenticated with check((select auth.uid())=user_id);
drop policy if exists exercise_entries_update_own on public.exercise_entries;
create policy exercise_entries_update_own on public.exercise_entries for update to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);
drop policy if exists exercise_entries_delete_own on public.exercise_entries;
create policy exercise_entries_delete_own on public.exercise_entries for delete to authenticated using((select auth.uid())=user_id);
