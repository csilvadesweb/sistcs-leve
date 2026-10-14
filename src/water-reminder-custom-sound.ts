export const MAX_CUSTOM_SOUND_BYTES = 2 * 1024 * 1024;
export const MAX_CUSTOM_SOUND_SECONDS = 10;

/** Valida o arquivo escolhido pela pessoa antes de guardá-lo no aparelho. Retorna a mensagem de erro ou null. */
export function validateCustomSound(file: { type: string; size: number }): string | null {
  if (!file.type.startsWith('audio/')) return 'Escolha um arquivo de áudio (MP3, OGG, M4A ou WAV).';
  if (file.size <= 0) return 'O arquivo está vazio.';
  if (file.size > MAX_CUSTOM_SOUND_BYTES) return 'O áudio deve ter até 2 MB. Escolha um toque curto.';
  return null;
}
