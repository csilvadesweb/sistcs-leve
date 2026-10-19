// @ts-nocheck -- valida SQL versionado por leitura de arquivos; o projeto não inclui @types/node.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const migration = readFileSync(join(root, 'supabase/migrations/20261019130000_activity_goal_state.sql'), 'utf8');
const schema = readFileSync(join(root, 'supabase/schema.sql'), 'utf8');

describe('migration de sincronização de metas de atividade', () => {
  it('define estado por usuário e valida os formatos JSON', () => {
    expect(migration).toMatch(/create table if not exists public\.activity_goal_state/i);
    expect(migration).toMatch(/user_id uuid primary key[\s\S]*references auth\.users\(id\) on delete cascade/i);
    expect(migration).toMatch(/goals jsonb not null default '\{\}'::jsonb[\s\S]*jsonb_typeof\(goals\) = 'object'/i);
    expect(migration).toMatch(/awards jsonb not null default '\[\]'::jsonb[\s\S]*jsonb_typeof\(awards\) = 'array'[\s\S]*jsonb_array_length\(awards\) <= 5000/i);
  });

  it('limita acesso à conta autenticada e habilita RLS para todas as operações', () => {
    expect(migration).toMatch(/alter table public\.activity_goal_state enable row level security/i);
    expect(migration).toMatch(/revoke all on table public\.activity_goal_state from public/i);
    expect(migration).toMatch(/revoke all on table public\.activity_goal_state from anon/i);
    expect(migration).toMatch(/grant select, insert, update, delete on table public\.activity_goal_state to authenticated/i);
    for (const action of ['select', 'insert', 'update', 'delete']) {
      expect(migration).toMatch(new RegExp(`activity_goal_state_${action}_own[\\s\\S]*?for ${action} to authenticated[\\s\\S]*?auth\\.uid\\(\\)\\) = user_id`, 'i'));
    }
    expect(migration).toMatch(/with check \(\(select auth\.uid\(\)\) = user_id\)/i);
  });

  it('mantém a tabela no snapshot de recriação do banco', () => {
    expect(schema).toMatch(/create table if not exists public\.activity_goal_state/i);
    expect(schema).toMatch(/activity_goal_state_select_own/i);
    expect(schema).toMatch(/activity_goal_state_insert_own/i);
    expect(schema).toMatch(/activity_goal_state_update_own/i);
    expect(schema).toMatch(/activity_goal_state_delete_own/i);
    expect(schema).toMatch(/activity_goal_state_touch/i);
    expect(schema).toContain('returns trigger language plpgsql set search_path = public as $$');
    expect(schema).toContain('end;\n$$;');
  });
});
