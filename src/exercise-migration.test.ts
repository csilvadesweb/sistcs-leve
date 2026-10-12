import { describe, expect, it } from 'vitest';

import migration from '../supabase/migrations/20261012170000_exercise_entries.sql?raw';

describe('contrato da migration do diário de exercícios', () => {
  it('cria a tabela de forma aditiva e preserva os dados existentes', () => {
    expect(migration).toMatch(/create table if not exists public\.exercise_entries/i);
    expect(migration).toMatch(/user_id uuid not null default auth\.uid\(\) references auth\.users\(id\) on delete cascade/i);
    expect(migration).not.toMatch(/\bdrop table\b|\btruncate\b|\bdelete from\b/i);
  });

  it('valida atividade, duração, calorias e tamanho da observação no banco', () => {
    expect(migration).toMatch(/activity text not null check\s*\(char_length\(btrim\(activity\)\) between 1 and 100\)/i);
    expect(migration).toMatch(/duration_minutes integer not null check\s*\(duration_minutes between 1 and 1440\)/i);
    expect(migration).toMatch(/calories_burned numeric not null check\s*\(calories_burned\s*>=\s*0 and calories_burned\s*<=\s*20000\)/i);
    expect(migration).toMatch(/note text check\s*\(note is null or char_length\(note\)<=300\)/i);
  });

  it('habilita RLS e limita as quatro operações ao dono autenticado', () => {
    expect(migration).toMatch(/alter table public\.exercise_entries enable row level security/i);
    expect(migration).toMatch(/create policy exercise_entries_select_own on public\.exercise_entries for select to authenticated using\(\(select auth\.uid\(\)\)=user_id\)/i);
    expect(migration).toMatch(/create policy exercise_entries_insert_own on public\.exercise_entries for insert to authenticated with check\(\(select auth\.uid\(\)\)=user_id\)/i);
    expect(migration).toMatch(/create policy exercise_entries_update_own on public\.exercise_entries for update to authenticated using\(\(select auth\.uid\(\)\)=user_id\) with check\(\(select auth\.uid\(\)\)=user_id\)/i);
    expect(migration).toMatch(/create policy exercise_entries_delete_own on public\.exercise_entries for delete to authenticated using\(\(select auth\.uid\(\)\)=user_id\)/i);
  });

  it('cria índice por usuário e data para o histórico', () => {
    expect(migration).toMatch(/create index if not exists exercise_entries_user_date_idx on public\.exercise_entries\(user_id,entry_date desc,created_at desc\)/i);
  });
});
