import { describe, expect, it } from 'vitest';
import { isBarcodeText } from './foodsearch';
import { imageProblem } from './photo-upload';

describe('registro único de alimentos', () => {
  it('reconhece código de barras digitado ou colado no campo de busca', () => {
    expect(isBarcodeText('7891000100103')).toBe(true);
    expect(isBarcodeText('7891 0001-00103')).toBe(true);
    expect(isBarcodeText('2 ovos')).toBe(false);
    expect(isBarcodeText('150')).toBe(false);
    expect(isBarcodeText('123456789012345')).toBe(false);
  });

  it('valida tipo e tamanho da imagem antes de enviar', () => {
    expect(imageProblem({ type: 'image/jpeg', size: 1000 })).toBeNull();
    expect(imageProblem({ type: 'application/pdf', size: 1000 })).toMatch(/JPG/);
    expect(imageProblem({ type: 'image/png', size: 5 * 1024 * 1024 })).toMatch(/4 MB/);
  });
});
