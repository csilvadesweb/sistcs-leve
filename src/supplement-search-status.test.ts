// @ts-nocheck -- contrato de busca validado por leitura do código; o projeto não inclui @types/node.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = readFileSync(join(process.cwd(), 'src/foods-br.ts'), 'utf8');

describe('busca do catálogo de suplementos', () => {
  it('não apresenta registros sem rótulo nutricional verificado', () => {
    expect(source).toMatch(
      /\.from\('supplement_catalog'\)[\s\S]*?\.eq\('data_status',\s*'label_transcribed'\)[\s\S]*?\.not\('calories_kcal',\s*'is',\s*null\)[\s\S]*?\.not\('protein_g',\s*'is',\s*null\)[\s\S]*?\.not\('carbohydrates_g',\s*'is',\s*null\)[\s\S]*?\.not\('total_fat_g',\s*'is',\s*null\)/,
    );
  });
});
