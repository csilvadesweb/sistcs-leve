// @ts-nocheck -- Vitest reads a migration fixture from disk; @types/node is not part of the frontend typecheck.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  join(process.cwd(), 'supabase/migrations/20261019134000_seed_supplement_catalog_batches_04_25.sql'),
  'utf8',
);

describe('consolidated supplement catalog seed', () => {
  it('preserves all 22 source batches as separate idempotent inserts', () => {
    expect((migration.match(/-- Source batch:/g) || [])).toHaveLength(22);
    expect((migration.match(/with products\(/gi) || [])).toHaveLength(22);
    expect((migration.match(/insert into public\.supplement_catalog/gi) || [])).toHaveLength(22);
    expect((migration.match(/where not exists/gi) || []).length).toBeGreaterThanOrEqual(22);
  });

  it('keeps products without verified nutrition out of the ready-to-search status', () => {
    expect(migration).toContain('needs_verified_product_data');
    expect(migration).toContain('label_transcribed');
    expect(migration).toMatch(/source_url/);
  });

  it('does not delete or overwrite existing catalog data', () => {
    expect(migration).not.toMatch(/\b(delete\s+from|truncate|drop\s+table|update\s+public\.supplement_catalog)\b/i);
  });
});
