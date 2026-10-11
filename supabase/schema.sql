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
