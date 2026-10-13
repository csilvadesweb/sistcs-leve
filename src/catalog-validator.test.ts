// @ts-nocheck -- testa um script Node externo; o projeto não inclui @types/node.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const temporaryDirectories = [];
const validator = join(process.cwd(), 'scripts/validate-recipe-catalog.mjs');

function runValidator(catalog) {
  const directory = mkdtempSync(join(tmpdir(), 'sistcs-recipe-catalog-'));
  temporaryDirectories.push(directory);
  const file = join(directory, 'catalog.json');
  writeFileSync(file, JSON.stringify(catalog), 'utf8');
  return spawnSync(process.execPath, [validator, file], { encoding: 'utf8' });
}

function validRecipe(overrides = {}) {
  return {
    id: 'recipe-001',
    name: 'Arroz com legumes',
    description: 'Receita caseira de arroz com legumes.',
    sourceName: 'Conteúdo editorial próprio do SISTCS Leve',
    sourceUrl: 'https://leve.sistcs.com/receitas',
    licenseId: 'CC-BY-4.0',
    attribution: 'SISTCS Leve — conteúdo editorial próprio',
    nutritionNote: 'Estimativa nutricional calculada a partir dos ingredientes.',
    minutes: 25,
    servings: 2,
    ingredients: ['1 xícara de arroz', '1 cenoura'],
    steps: ['Lave os ingredientes.', 'Cozinhe até ficar macio.'],
    nutrientsPerServing: {
      calories: 220,
      proteins: 5,
      carbohydrates: 42,
      fats: 3,
      fiber: 4,
    },
    ...overrides,
  };
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe('validador do catálogo de receitas', () => {
  it('aceita um registro estruturalmente completo com licença permitida', () => {
    const result = runValidator([validRecipe()]);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('1 receitas passaram');
    expect(result.stderr).toContain('AVISO: 1 receitas; a meta é 3.100.');
  });

  it('rejeita licenças não aprovadas para importação automática', () => {
    const result = runValidator([validRecipe({ licenseId: 'CC-BY-NC-4.0' })]);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('licença não permitida ou não revisada');
  });

  it('rejeita IDs duplicados e nomes duplicados após normalização de acentos', () => {
    const first = validRecipe();
    const second = validRecipe({
      id: first.id,
      name: 'ARROZ COM LEGUMES',
    });
    const result = runValidator([first, second]);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('ID duplicado');
    expect(result.stderr).toContain('nome possivelmente duplicado');
  });

  it('rejeita valores nutricionais negativos ou não numéricos', () => {
    const result = runValidator([
      validRecipe({
        nutrientsPerServing: {
          calories: -1,
          proteins: 'cinco',
          carbohydrates: 42,
          fats: 3,
          fiber: 4,
        },
      }),
    ]);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('nutrientsPerServing.calories');
    expect(result.stderr).toContain('nutrientsPerServing.proteins');
  });

  it('rejeita URLs sem HTTPS e receitas sem ingredientes ou preparo', () => {
    const result = runValidator([
      validRecipe({
        sourceUrl: 'http://example.com/recipe',
        ingredients: [],
        steps: [],
      }),
    ]);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('sourceUrl deve ser HTTPS');
    expect(result.stderr).toContain('ingredients deve conter');
    expect(result.stderr).toContain('steps deve conter');
  });

  it('rejeita JSON que não seja um array e arquivos ausentes', () => {
    const result = runValidator({ recipe: validRecipe() });
    expect(result.status).toBe(2);
    expect(result.stderr).toContain('O catálogo deve ser um array JSON.');

    const missing = spawnSync(process.execPath, [validator], { encoding: 'utf8' });
    expect(missing.status).toBe(2);
    expect(missing.stderr).toContain('Uso:');
  });
});
