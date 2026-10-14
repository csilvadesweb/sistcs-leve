import { describe, expect, it } from 'vitest';
import { isSupportedPhotoFile } from './photo-file';

describe('compatibilidade de arquivos de foto', () => {
  it('aceita os tipos de imagem suportados pelo app', () => {
    expect(isSupportedPhotoFile({ type: 'image/jpeg', name: 'foto.jpg' })).toBe(true);
    expect(isSupportedPhotoFile({ type: 'image/png', name: 'foto.png' })).toBe(true);
    expect(isSupportedPhotoFile({ type: 'image/webp', name: 'foto.webp' })).toBe(true);
  });

  it('aceita extensão conhecida quando o seletor Android não informa MIME', () => {
    expect(isSupportedPhotoFile({ type: '', name: 'IMG_1234.JPG' })).toBe(true);
    expect(isSupportedPhotoFile({ type: null, name: 'progresso.jpeg' })).toBe(true);
    expect(isSupportedPhotoFile({ type: 'application/octet-stream', name: 'galeria.jpg' })).toBe(true);
    expect(isSupportedPhotoFile({ type: '', name: 'imagem.webp' })).toBe(true);
  });

  it('não infere formatos não suportados apenas pela extensão', () => {
    expect(isSupportedPhotoFile({ type: 'image/heic', name: 'foto.jpg' })).toBe(false);
    expect(isSupportedPhotoFile({ type: '', name: 'foto.heic' })).toBe(false);
    expect(isSupportedPhotoFile({ type: '', name: 'documento.pdf' })).toBe(false);
  });
});
