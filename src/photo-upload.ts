/** Regras e leitura de imagem compartilhadas pelas fotos do prato e do rótulo. */

export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

/** Mensagem de erro se a imagem não puder ser enviada; null se estiver ok. */
export function imageProblem(file: { type: string; size: number }): string | null {
  if (!(IMAGE_TYPES as readonly string[]).includes(file.type)) return 'Escolha uma imagem JPG, PNG ou WebP.';
  if (file.size > MAX_IMAGE_BYTES) return 'A imagem deve ter no máximo 4 MB.';
  return null;
}

/** Conteúdo da imagem em base64 (sem o prefixo data:). */
export function readImageAsBase64(file: Blob): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Não foi possível abrir a imagem.'));
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const comma = result.indexOf(',');
      if (comma < 0) reject(new Error('Não foi possível preparar a imagem.'));
      else resolve(result.slice(comma + 1));
    };
    reader.readAsDataURL(file);
  });
}
