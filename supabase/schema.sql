-- Schema do Meu Progresso Total (já aplicado no projeto yzcmxdbnitturlbozvqu).
-- Use este arquivo para recriar o banco em outro projeto Supabase.

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 60),
  goal_calories numeric check (goal_calories is null or goal_calories > 0),
  goal_proteins numeric check (goal_proteins is null or goal_proteins > 0),
  goal_carbohydrates numeric check (goal_carbohydrates is null or goal_carbohydrates > 0),
  goal_fats numeric check (goal_fats is null or goal_fats > 0),
  goal_fiber numeric check (goal_fiber is null or goal_fiber > 0),
  goal_water_ml numeric check (goal_water_ml is null or goal_water_ml > 0),
  cup_volume_ml numeric check (cup_volume_ml is null or cup_volume_ml > 0),
  updated_at timestamptz not null default now()
);

create table public.food_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  entry_date date not null,
  meal text not null check (meal in ('breakfast','lunch','snack','dinner','other')),
  name text not null check (char_length(btrim(name)) between 1 and 120),
  portion text not null check (char_length(btrim(portion)) between 1 and 120),
  quantity numeric not null check (quantity > 0),
  calories numeric not null default 0 check (calories >= 0),
  proteins numeric not null default 0 check (proteins >= 0),
  carbohydrates numeric not null default 0 check (carbohydrates >= 0),
  fats numeric not null default 0 check (fats >= 0),
  fiber numeric not null default 0 check (fiber >= 0),
  saturated_fat numeric check (saturated_fat is null or saturated_fat >= 0),
  sugars numeric check (sugars is null or sugars >= 0),
  sodium_mg numeric check (sodium_mg is null or sodium_mg >= 0),
  nutrition_source text not null check (nutrition_source in ('user-reported','user-estimated')),
  created_at timestamptz not null default now()
);

create table public.favorite_foods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  source_entry_id uuid references public.food_entries(id) on delete set null,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  portion text not null check (char_length(btrim(portion)) between 1 and 120),
  calories numeric not null default 0 check (calories >= 0),
  proteins numeric not null default 0 check (proteins >= 0),
  carbohydrates numeric not null default 0 check (carbohydrates >= 0),
  fats numeric not null default 0 check (fats >= 0),
  fiber numeric not null default 0 check (fiber >= 0),
  saturated_fat numeric check (saturated_fat is null or saturated_fat >= 0),
  sugars numeric check (sugars is null or sugars >= 0),
  sodium_mg numeric check (sodium_mg is null or sodium_mg >= 0),
  nutrition_source text not null check (nutrition_source in ('user-reported','user-estimated')),
  created_at timestamptz not null default now()
);

create table public.water_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  entry_date date not null,
  volume_ml numeric not null check (volume_ml > 0),
  created_at timestamptz not null default now()
);

create index food_entries_user_date_idx on public.food_entries (user_id, entry_date desc);
create index favorite_foods_user_idx on public.favorite_foods (user_id);
create index favorite_foods_source_idx on public.favorite_foods (source_entry_id);
create index water_entries_user_date_idx on public.water_entries (user_id, entry_date desc);

alter table public.profiles enable row level security;
alter table public.food_entries enable row level security;
alter table public.favorite_foods enable row level security;
alter table public.water_entries enable row level security;

-- Uma política por operação e tabela: cada usuário só enxerga e altera as próprias linhas.
do $$
declare t text;
begin
  foreach t in array array['profiles','food_entries','favorite_foods','water_entries'] loop
    execute format('create policy "%1$s_select_own" on public.%1$s for select to authenticated using ((select auth.uid()) = user_id)', t);
    execute format('create policy "%1$s_insert_own" on public.%1$s for insert to authenticated with check ((select auth.uid()) = user_id)', t);
    execute format('create policy "%1$s_update_own" on public.%1$s for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t);
    execute format('create policy "%1$s_delete_own" on public.%1$s for delete to authenticated using ((select auth.uid()) = user_id)', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Parte 2: dados corporais, peso, medicamentos (migração já aplicada no projeto).
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column height_cm numeric check (height_cm is null or height_cm between 50 and 260),
  add column target_weight_kg numeric check (target_weight_kg is null or target_weight_kg between 20 and 400),
  add column target_date date;

create table public.weight_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  entry_date date not null,
  weight_kg numeric not null check (weight_kg between 20 and 400),
  note text check (note is null or char_length(note) <= 200),
  created_at timestamptz not null default now()
);

create table public.medications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  dose text not null default '' check (char_length(dose) <= 120),
  times text[] not null default '{}',
  notes text check (notes is null or char_length(notes) <= 300),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.medication_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  medication_id uuid not null references public.medications(id) on delete cascade,
  log_date date not null,
  scheduled_time text not null default '',
  created_at timestamptz not null default now(),
  unique (medication_id, log_date, scheduled_time)
);

create index weight_entries_user_date_idx on public.weight_entries (user_id, entry_date desc);
create index medications_user_idx on public.medications (user_id);
create index medication_logs_user_date_idx on public.medication_logs (user_id, log_date desc);
create index medication_logs_medication_idx on public.medication_logs (medication_id);

alter table public.weight_entries enable row level security;
alter table public.medications enable row level security;
alter table public.medication_logs enable row level security;

do $$
declare t text;
begin
  foreach t in array array['weight_entries','medications','medication_logs'] loop
    execute format('create policy "%1$s_select_own" on public.%1$s for select to authenticated using ((select auth.uid()) = user_id)', t);
    execute format('create policy "%1$s_insert_own" on public.%1$s for insert to authenticated with check ((select auth.uid()) = user_id)', t);
    execute format('create policy "%1$s_update_own" on public.%1$s for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t);
    execute format('create policy "%1$s_delete_own" on public.%1$s for delete to authenticated using ((select auth.uid()) = user_id)', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Parte 3: personalização das metas (sexo, nascimento, atividade, objetivo).
-- Migração já aplicada no projeto. Todas as colunas são opcionais.
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column if not exists sex text check (sex in ('female','male')),
  add column if not exists birth_date date check (birth_date is null or birth_date >= date '1900-01-01'),
  add column if not exists activity_level text check (activity_level in ('sedentary','light','moderate','active','very_active')),
  add column if not exists goal_type text check (goal_type in ('lose','maintain','gain')),
  add column if not exists weekly_rate_kg numeric check (weekly_rate_kg is null or weekly_rate_kg between 0.1 and 1),
  add column if not exists macro_preset text not null default 'balanced' check (macro_preset in ('balanced','high_protein','low_carb'));

-- ---------------------------------------------------------------------------
-- Parte 4: foto de perfil, fotos de antes/depois e jejum intermitente.
-- ---------------------------------------------------------------------------

alter table public.profiles add column if not exists avatar_path text;

create table if not exists public.progress_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  taken_on date not null,
  kind text not null check (kind in ('before','progress','after')),
  path text not null,
  note text check (note is null or char_length(note) <= 200),
  created_at timestamptz not null default now()
);
create index if not exists progress_photos_user_idx on public.progress_photos (user_id, taken_on desc);

create table if not exists public.fasting_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  target_hours int not null check (target_hours between 1 and 72),
  note text check (note is null or char_length(note) <= 200),
  created_at timestamptz not null default now(),
  check (ended_at is null or ended_at >= started_at)
);
create index if not exists fasting_user_idx on public.fasting_entries (user_id, started_at desc);
-- no máximo um jejum em andamento por usuário
create unique index if not exists fasting_one_active_idx on public.fasting_entries (user_id) where ended_at is null;

alter table public.progress_photos enable row level security;
alter table public.fasting_entries enable row level security;

do $$
declare t text;
begin
  foreach t in array array['progress_photos','fasting_entries'] loop
    execute format('create policy "%1$s_select_own" on public.%1$s for select to authenticated using ((select auth.uid()) = user_id)', t);
    execute format('create policy "%1$s_insert_own" on public.%1$s for insert to authenticated with check ((select auth.uid()) = user_id)', t);
    execute format('create policy "%1$s_update_own" on public.%1$s for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t);
    execute format('create policy "%1$s_delete_own" on public.%1$s for delete to authenticated using ((select auth.uid()) = user_id)', t);
  end loop;
end $$;

-- Buckets privados (5 MB, só imagens). Cada usuário usa a pasta com o próprio id.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', false, 5242880, array['image/jpeg','image/png','image/webp']),
  ('progress-photos', 'progress-photos', false, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

do $$
declare b text;
begin
  foreach b in array array['avatars','progress-photos'] loop
    execute format('create policy "%1$s_select_own" on storage.objects for select to authenticated using (bucket_id = %2$L and (storage.foldername(name))[1] = (select auth.uid())::text)', replace(b,'-','_'), b);
    execute format('create policy "%1$s_insert_own" on storage.objects for insert to authenticated with check (bucket_id = %2$L and (storage.foldername(name))[1] = (select auth.uid())::text)', replace(b,'-','_'), b);
    execute format('create policy "%1$s_update_own" on storage.objects for update to authenticated using (bucket_id = %2$L and (storage.foldername(name))[1] = (select auth.uid())::text)', replace(b,'-','_'), b);
    execute format('create policy "%1$s_delete_own" on storage.objects for delete to authenticated using (bucket_id = %2$L and (storage.foldername(name))[1] = (select auth.uid())::text)', replace(b,'-','_'), b);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Parte 5: estado atual do app (menu, exercícios, Health Connect, quota e efeitos).
-- Este snapshot não substitui a reconciliação do histórico de migrations.
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists nav_config jsonb,
  add column if not exists navigation_preferences jsonb not null default '{"order":["/","/alimentacao","/registros","/jejum","/medicamentos","/relatorios","/perfil"],"labels":{}}'::jsonb;

create table if not exists public.exercise_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  entry_date date not null,
  activity text not null check (char_length(btrim(activity)) between 1 and 100),
  duration_minutes integer not null check (duration_minutes between 1 and 1440),
  calories_burned numeric not null check (calories_burned between 0 and 20000),
  note text check (note is null or char_length(note) <= 300),
  created_at timestamptz not null default now()
);
create index if not exists exercise_entries_user_date_idx on public.exercise_entries (user_id, entry_date desc, created_at desc);
alter table public.exercise_entries enable row level security;
do $$ begin
  create policy exercise_entries_select_own on public.exercise_entries for select to authenticated using ((select auth.uid()) = user_id);
  create policy exercise_entries_insert_own on public.exercise_entries for insert to authenticated with check ((select auth.uid()) = user_id);
  create policy exercise_entries_update_own on public.exercise_entries for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
  create policy exercise_entries_delete_own on public.exercise_entries for delete to authenticated using ((select auth.uid()) = user_id);
exception when duplicate_object then null; end $$;

create table if not exists public.health_activity_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  source text not null default 'health_connect' check (source = 'health_connect'),
  record_key text not null check (char_length(record_key) between 1 and 200),
  record_type text not null check (record_type in ('daily_steps', 'exercise_session')),
  record_date date not null,
  start_time timestamptz,
  end_time timestamptz,
  value numeric not null check (value between 0 and 100000000),
  unit text not null check (unit in ('count', 'minutes')),
  activity_name text check (activity_name is null or char_length(activity_name) <= 100),
  source_metadata jsonb not null default '{}'::jsonb,
  synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint health_activity_record_key_unique unique (user_id, source, record_key),
  constraint health_activity_time_range check (start_time is null or end_time is null or end_time >= start_time)
);
create index if not exists health_activity_records_user_date_idx on public.health_activity_records (user_id, record_date desc, record_type);
alter table public.health_activity_records enable row level security;
do $$ begin
  create policy health_activity_records_select_own on public.health_activity_records for select to authenticated using ((select auth.uid()) = user_id);
  create policy health_activity_records_insert_own on public.health_activity_records for insert to authenticated with check ((select auth.uid()) = user_id);
  create policy health_activity_records_update_own on public.health_activity_records for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
  create policy health_activity_records_delete_own on public.health_activity_records for delete to authenticated using ((select auth.uid()) = user_id);
exception when duplicate_object then null; end $$;

create table if not exists public.ai_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  count integer not null default 0 check (count >= 0),
  primary key (user_id, day)
);
alter table public.ai_usage enable row level security;
revoke all on table public.ai_usage from anon, authenticated;
create or replace function public.consume_ai_quota()
returns boolean language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); used integer;
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
grant execute on function public.consume_ai_quota() to authenticated, service_role;

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
create index if not exists medication_effect_logs_owner_date_idx on public.medication_effect_logs (user_id, event_date desc, created_at desc);
alter table public.medication_effect_logs enable row level security;
do $$ begin
  create policy medication_effect_logs_select_own on public.medication_effect_logs for select to authenticated using ((select auth.uid()) = user_id);
  create policy medication_effect_logs_insert_own on public.medication_effect_logs for insert to authenticated with check ((select auth.uid()) = user_id);
  create policy medication_effect_logs_update_own on public.medication_effect_logs for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
  create policy medication_effect_logs_delete_own on public.medication_effect_logs for delete to authenticated using ((select auth.uid()) = user_id);
exception when duplicate_object then null; end $$;
