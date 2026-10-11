import { useEffect, useRef, useState } from 'react';
import { UserRound } from 'lucide-react';
import { signedPhotoUrl } from './data';

/** Reduz e converte a imagem para JPEG no navegador (economiza espaço e remove metadados como o GPS). */
export async function resizeImage(file: File, maxSide: number, square = false): Promise<Blob> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error('Use uma imagem JPG, PNG ou WebP.');
  if (file.size > 15 * 1024 * 1024) throw new Error('A imagem é grande demais. Escolha uma de até 15 MB.');
  const bitmap = await createImageBitmap(file);
  let sx = 0, sy = 0, sw = bitmap.width, sh = bitmap.height;
  if (square) {
    const side = Math.min(bitmap.width, bitmap.height);
    sx = (bitmap.width - side) / 2;
    sy = (bitmap.height - side) / 2;
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
  ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, w, h);
  bitmap.close?.();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
  if (!blob) throw new Error('Não foi possível preparar a imagem.');
  return blob;
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
