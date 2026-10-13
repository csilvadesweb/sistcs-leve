#!/usr/bin/env node
/**
 * Valida um arquivo JSON de receitas antes de integrá-lo ao SISTCS Leve.
 * Uso: node scripts/validate-recipe-catalog.mjs caminho/para/catalogo.json
 */
import { readFile } from 'node:fs/promises';

const allowedLicenses = new Set([
  'CC-BY-4.0',
  'CC-BY-SA-4.0',
  'PUBLIC-DOMAIN',
]);

const path = process.argv[2];
if (!path) {
  console.error('Uso: node scripts/validate-recipe-catalog.mjs <catalogo.json>');
  process.exit(2);
}

let catalog;
try {
  catalog = JSON.parse(await readFile(path, 'utf8'));
} catch (error) {
  console.error('Não foi possível ler JSON válido: ' + error.message);
  process.exit(2);
}

const errors = [];
const seenIds = new Set();
const seenNames = new Set();

if (!Array.isArray(catalog)) {
  console.error('O catálogo deve ser um array JSON.');
  process.exit(2);
}

catalog.forEach((recipe, index) => {
  const label = 'registro[' + index + ']';
  const requiredText = [
    'id', 'name', 'description', 'sourceName', 'sourceUrl',
    'licenseId', 'attribution', 'nutritionNote',
  ];

  for (const key of requiredText) {
    if (typeof recipe?.[key] !== 'string' || !recipe[key].trim()) {
      errors.push(label + ': campo obrigatório ausente/inválido: ' + key);
    }
  }

  if (recipe?.id) {
    if (seenIds.has(recipe.id)) errors.push(label + ': ID duplicado: ' + recipe.id);
    seenIds.add(recipe.id);
  }

  if (recipe?.name) {
    const normalized = recipe.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('pt-BR').replace(/[^a-z0-9]+/g, ' ').trim();
    if (seenNames.has(normalized)) errors.push(label + ': nome possivelmente duplicado: ' + recipe.name);
    seenNames.add(normalized);
  }

  if (!allowedLicenses.has(recipe?.licenseId)) {
    errors.push(label + ': licença não permitida ou não revisada: ' + (recipe?.licenseId ?? '(ausente)'));
  }

  if (typeof recipe?.sourceUrl !== 'string' || !/^https:\/\//.test(recipe.sourceUrl)) {
    errors.push(label + ': sourceUrl deve ser HTTPS');
  }

  if (!Number.isInteger(recipe?.minutes) || recipe.minutes < 0) {
    errors.push(label + ': minutes deve ser inteiro >= 0');
  }
  if (!Number.isInteger(recipe?.servings) || recipe.servings < 1) {
    errors.push(label + ': servings deve ser inteiro >= 1');
  }
  if (!Array.isArray(recipe?.ingredients) || recipe.ingredients.length < 1 ||
      recipe.ingredients.some((item) => typeof item !== 'string' || !item.trim())) {
    errors.push(label + ': ingredients deve conter ingredientes textuais');
  }
  if (!Array.isArray(recipe?.steps) || recipe.steps.length < 1 ||
      recipe.steps.some((item) => typeof item !== 'string' || !item.trim())) {
    errors.push(label + ': steps deve conter instruções textuais');
  }

  const nutrition = recipe?.nutrientsPerServing;
  for (const key of ['calories', 'proteins', 'carbohydrates', 'fats', 'fiber']) {
    if (!Number.isFinite(nutrition?.[key]) || nutrition[key] < 0) {
      errors.push(label + ': nutrientsPerServing.' + key + ' deve ser número >= 0');
    }
  }
  if (typeof recipe?.nutritionNote !== 'string' || !/estimad|calculad|fonte|medid/i.test(recipe.nutritionNote)) {
    errors.push(label + ': informe origem/limitação nutricional em nutritionNote');
  }
});

if (catalog.length < 1) errors.push('Catálogo vazio.');
if (catalog.length < 3100) console.warn('AVISO: ' + catalog.length + ' receitas; a meta é 3.100.');

if (errors.length) {
  console.error('Falha: ' + errors.length + ' problema(s) em ' + catalog.length + ' registro(s):');
  for (const error of errors) console.error('- ' + error);
  process.exit(1);
}

console.log('OK: ' + catalog.length + ' receitas passaram nas verificações estruturais, da licença declarada e da atribuição.');
console.log('A validação automática não comprova titularidade, precisão nutricional nem ausência semântica de duplicatas.');
