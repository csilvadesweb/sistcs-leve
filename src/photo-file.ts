const SUPPORTED_IMAGE_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const SUPPORTED_IMAGE_EXTENSIONS = /\.(?:jpe?g|png|webp)$/i;

/** Some Android gallery providers return a blank MIME type for otherwise supported image files. */
export function isSupportedPhotoFile(file: { type?: string | null; name?: string | null }): boolean {
  const type = (file.type ?? '').toLowerCase();
  if (SUPPORTED_IMAGE_MIMES.has(type)) return true;
  return type === '' && SUPPORTED_IMAGE_EXTENSIONS.test(file.name ?? '');
}
