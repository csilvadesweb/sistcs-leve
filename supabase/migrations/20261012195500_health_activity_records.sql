-- Additive Health Connect ingestion. Does not alter existing user or exercise records.
create table if not exists public.health_activity_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  source text not null default 'health_connect' check (source = 'health_connect'),
  record_key text not null check (char_length(record_key) between 1 and 200),
  record_type text not null check (record_type in ('daily_steps', 'exercise_session')),
  record_date date not null,
  start_time timestamptz,
  end_time timestamptz,
  value numeric not null check (value >= 0 and value <= 100000000),
  unit text not null check (unit in ('count', 'minutes')),
  activity_name text check (activity_name is null or char_length(activity_name) <= 100),
  source_metadata jsonb not null default '{}'::jsonb,
  synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint health_activity_record_key_unique unique (user_id, source, record_key),
  constraint health_activity_time_range check (
    start_time is null or end_time is null or end_time >= start_time
  )
);

create index if not exists health_activity_records_user_date_idx
  on public.health_activity_records (user_id, record_date desc, record_type);

alter table public.health_activity_records enable row level security;

drop policy if exists health_activity_records_select_own on public.health_activity_records;
create policy health_activity_records_select_own
  on public.health_activity_records for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists health_activity_records_insert_own on public.health_activity_records;
create policy health_activity_records_insert_own
  on public.health_activity_records for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists health_activity_records_update_own on public.health_activity_records;
create policy health_activity_records_update_own
  on public.health_activity_records for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists health_activity_records_delete_own on public.health_activity_records;
create policy health_activity_records_delete_own
  on public.health_activity_records for delete to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.health_activity_records to authenticated;
