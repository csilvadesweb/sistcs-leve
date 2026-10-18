/**
 * Padrão único de botões do SISTCS Leve.
 *
 * Variantes: `default` (ação principal), `outline` (ação secundária),
 * `ghost` (ação discreta) e `destructive` (excluir/descartar).
 * Tamanhos: `md` (48 px), `sm` (42 px) e `icon` (quadrado de 42 px).
 *
 * As regras visuais ficam todas em `buttons.css`. Para um botão que não é um
 * <button> (link, <label> de arquivo), use `buttonClass()` no className.
 */
export type ButtonVariant = 'default' | 'outline' | 'ghost' | 'destructive';
export type ButtonSize = 'md' | 'sm' | 'icon';

export const BUTTON_VARIANTS: readonly ButtonVariant[] = ['default', 'outline', 'ghost', 'destructive'];
export const BUTTON_SIZES: readonly ButtonSize[] = ['md', 'sm', 'icon'];

export interface ButtonStyleOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Ocupa toda a largura disponível e deixa o texto quebrar em duas linhas. */
  block?: boolean;
  /**
   * Classes extras: só posicionamento (margem, alinhamento) ou um modificador
   * definido em `buttons.css` (hoje, `btn-overlay` para botão sobre foto).
   */
  className?: string;
}

export function buttonClass({ variant = 'default', size = 'md', block = false, className = '' }: ButtonStyleOptions = {}): string {
  return ['btn', `btn-${variant}`, `btn-${size}`, block ? 'btn-block' : '', className.trim()]
    .filter(Boolean)
    .join(' ');
}
