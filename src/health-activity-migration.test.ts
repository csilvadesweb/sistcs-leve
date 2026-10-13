import { describe, expect, it } from 'vitest';

import migration from '../supabase/migrations/20261012195500_health_activity_records.sql?raw';

describe('contrato da sincronização Health Connect', () => {
  it('usa uma tabela aditiva e não remove dados existentes', () => {
    expect(migration).toMatch(/create table if not exists public\.health_activity_records/i);
    expect(migration).toMatch(/user_id uuid not null default auth\.uid\(\) references auth\.users\(id\) on delete cascade/i);
    expect(migration).not.toMatch(/\bdrop table\b|\btruncate\b|\bdelete from\b/i);
  });

  it('deduplica registros por usuário, origem e chave de origem', () => {
    expect(migration).toMatch(/unique \(user_id, source, record_key\)/i);
    expect(migration).toMatch(/record_type in \('daily_steps', 'exercise_session'\)/i);
    expect(migration).toMatch(/unit in \('count', 'minutes'\)/i);
  });

  it('protege leitura e escrita com RLS por usuário autenticado', () => {
    expect(migration).toMatch(/enable row level security/i);
    expect(migration).toMatch(/for select to authenticated[\s\S]*?auth\.uid\(\)\) = user_id/i);
    expect(migration).toMatch(/for insert to authenticated[\s\S]*?with check \(\(select auth\.uid\(\)\) = user_id\)/i);
    expect(migration).toMatch(/for update to authenticated[\s\S]*?using \(\(select auth\.uid\(\)\) = user_id\)[\s\S]*?with check \(\(select auth\.uid\(\)\) = user_id\)/i);
    expect(migration).toMatch(/for delete to authenticated[\s\S]*?auth\.uid\(\)\) = user_id/i);
  });

  it('permite upsert idempotente e indexa histórico por usuário/data', () => {
    expect(migration).toMatch(/grant select, insert, update, delete on public\.health_activity_records to authenticated/i);
    expect(migration).toMatch(/health_activity_records_user_date_idx[\s\S]*?\(user_id, record_date desc, record_type\)/i);
  });
});
