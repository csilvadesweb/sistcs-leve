import { useEffect, useRef, useState } from 'react';
import { UserRound } from 'lucide-react';
import { signedPhotoUrl } from './data';
import { isSupportedPhotoFile } from './photo-file';

/** Reduz e converte a imagem para JPEG no navegador (economiza espaço e remove metadados como o GPS). */
type DecodedPhoto = {
  source: CanvasImageSource;
  width: number;
  height: number;
  close: () => void;
};

async function decodePhoto(file: File): Promise<DecodedPhoto> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file);
      return { source: bitmap, width: bitmap.width, height: bitmap.height, close: () => bitmap.close() };
    } catch {
      // Older mobile browsers and some gallery providers need the HTMLImageElement fallback below.
    }
  }

  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error('O navegador não conseguiu abrir esta foto. Tente uma imagem JPG, PNG ou WebP.'));
      element.src = url;
    });
    if (!image.naturalWidth || !image.naturalHeight) {
      throw new Error('A foto não contém uma imagem que o navegador consiga ler.');
    }
    return {
      source: image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      close: () => URL.revokeObjectURL(url),
    };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}

/** Reduz e converte a imagem para JPEG no navegador (economiza espaço e remove metadados como o GPS). */
export async function resizeImage(file: File, maxSide: number, square = false): Promise<Blob> {
  if (!isSupportedPhotoFile(file)) throw new Error('Use uma imagem JPG, PNG ou WebP.');
  if (!Number.isFinite(file.size) || file.size <= 0 || file.size > 15 * 1024 * 1024) {
    throw new Error('A imagem deve ter até 15 MB e não pode estar vazia.');
  }
  if (!Number.isFinite(maxSide) || maxSide < 1) throw new Error('O tamanho da imagem não é válido.');

  const decoded = await decodePhoto(file);
  try {
    let sx = 0, sy = 0, sw = decoded.width, sh = decoded.height;
    if (square) {
      const side = Math.min(decoded.width, decoded.height);
      sx = (decoded.width - side) / 2;
      sy = (decoded.height - side) / 2;
      sw = sh = side;
    }
    const scale = Math.min(1, maxSide / Math.max(sw, sh));
    const w = Math.max(1, Math.round(sw * scale));
    const h = Math.max(1, Math.round(sh * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Seu navegador não conseguiu processar a imagem.');
    ctx.drawImage(decoded.source, sx, sy, sw, sh, 0, 0, w, h);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
    if (!blob) throw new Error('Não foi possível preparar a imagem.');
    return blob;
  } finally {
    decoded.close();
  }
}

/** Link temporário (1 hora) para uma imagem do Storage privado. */
export function useSignedUrl(bucket: 'avatars' | 'progress-photos', path: string | null | undefined) {
  const [url, setUrl] = useState<string | null>(null);
  const current = useRef<string | null | undefined>(path);
  useEffect(() => {
    current.current = path;
    if (!path) {
      setUrl(null);
      return;
    }
    let alive = true;
    void signedPhotoUrl(bucket, path).then((u) => {
      if (alive && current.current === path) setUrl(u);
    });
    return () => {
      alive = false;
    };
  }, [bucket, path]);
  return url;
}

export function Avatar({ path, name, size = 40 }: { path: string | null | undefined; name?: string; size?: number }) {
  const url = useSignedUrl('avatars', path);
  const initial = name?.trim() ? name.trim()[0]!.toUpperCase() : '';
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }} aria-hidden={url ? undefined : true}>
      {url ? <img src={url} alt={name ? `Foto de ${name}` : 'Sua foto de perfil'} /> : initial || <UserRound size={Math.round(size * 0.5)} aria-hidden="true" />}
    </span>
  );
}

export function PhotoImg({ path, alt }: { path: string; alt: string }) {
  const url = useSignedUrl('progress-photos', path);
  return url ? <img className="photo-img" src={url} alt={alt} loading="lazy" /> : <span className="photo-img photo-loading" role="img" aria-label="Carregando foto" />;
}
