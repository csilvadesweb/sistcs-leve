-- Histórico estruturado e privado de efeitos relatados. Aditiva: não altera tabelas existentes.
create table if not exists public.medication_effect_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  medication_name text not null check (char_length(btrim(medication_name)) between 1 and 120),
  event_date date not null,
  symptom text not null check (char_length(btrim(symptom)) between 1 and 120),
  severity smallint not null check (severity between 1 and 5),
  started_at timestamptz,
  resolved_at timestamptz,
  notes text not null default '' check (char_length(notes) <= 1000),
  created_at timestamptz not null default now(),
  constraint medication_effect_time_order check (resolved_at is null or started_at is null or resolved_at >= started_at)
);
create index if not exists medication_effect_logs_owner_date_idx
  on public.medication_effect_logs (user_id, event_date desc, created_at desc);
alter table public.medication_effect_logs enable row level security;
drop policy if exists medication_effect_logs_select_own on public.medication_effect_logs;
create policy medication_effect_logs_select_own on public.medication_effect_logs for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists medication_effect_logs_insert_own on public.medication_effect_logs;
create policy medication_effect_logs_insert_own on public.medication_effect_logs for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists medication_effect_logs_update_own on public.medication_effect_logs;
create policy medication_effect_logs_update_own on public.medication_effect_logs for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists medication_effect_logs_delete_own on public.medication_effect_logs;
create policy medication_effect_logs_delete_own on public.medication_effect_logs for delete to authenticated using ((select auth.uid()) = user_id);
grant select, insert, update, delete on public.medication_effect_logs to authenticated;
