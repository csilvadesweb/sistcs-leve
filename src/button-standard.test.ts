import { describe, expect, it } from 'vitest';
import { BUTTON_SIZES, BUTTON_VARIANTS, buttonClass } from './button-style';

/**
 * Garante que o padrão único de botões (button-style.ts + buttons.css) não se
 * desfaça: ninguém volta a escrever classes de botão à mão nem a definir a
 * aparência de botão fora de buttons.css.
 */

const cssFiles = import.meta.glob<string>('./**/*.css', { eager: true, query: '?raw', import: 'default' });
const sourceFiles = import.meta.glob<string>('./**/*.tsx', { eager: true, query: '?raw', import: 'default' });

const stripComments = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '');
const appSources = Object.entries(sourceFiles).filter(([path]) => !path.includes('.test.'));
const otherCss = Object.entries(cssFiles).filter(([path]) => !path.endsWith('/buttons.css'));

/** Seletor que COMEÇA em .btn (definir o botão). `.pai .btn` só posiciona e é permitido. */
const CSS_STARTS_WITH_BTN = /(?:^|[{},])\s*\.btn(?![A-Za-z0-9_])/;
/** Variante/tamanho escrito à mão no TSX em vez de passar por Button ou buttonClass(). */
const TSX_VARIANT_TOKEN = /(?<![\w-])btn-(?:default|outline|ghost|destructive|primary|md|sm|icon|block)(?![\w-])/;
const TSX_BARE_BTN = /className=(?:"btn[" ]|\{?[`'"]btn[`'" ])/;
/** <Button style={...}>: estilo inline sobrescreve o padrão. */
const BUTTON_INLINE_STYLE = /<Button\b(?:[^>]|=>)*?\sstyle=/;

describe('buttonClass', () => {
  it('sem opções gera o botão principal de tamanho padrão, sem espaços sobrando', () => {
    expect(buttonClass()).toBe('btn btn-default btn-md');
  });

  it('combina variante, tamanho, largura total e classe extra', () => {
    expect(buttonClass({ variant: 'outline', size: 'sm', block: true, className: ' extra ' })).toBe('btn btn-outline btn-sm btn-block extra');
    expect(buttonClass({ variant: 'destructive', size: 'icon' })).toBe('btn btn-destructive btn-icon');
  });
});

describe('padrão único de botões', () => {
  const buttonsCss = stripComments(cssFiles['./buttons.css'] ?? '');

  it('buttons.css existe e define todas as variantes e tamanhos do TypeScript', () => {
    expect(buttonsCss.length).toBeGreaterThan(0);
    for (const variant of BUTTON_VARIANTS) expect(buttonsCss, `variante ${variant}`).toContain(`.btn-${variant}`);
    for (const size of BUTTON_SIZES) expect(buttonsCss, `tamanho ${size}`).toContain(`.btn-${size}`);
    expect(buttonsCss).toContain('.btn-block');
  });

  it('nenhum outro CSS define a aparência de botão (só posiciona com ".pai .btn")', () => {
    const offenders = otherCss.filter(([, css]) => CSS_STARTS_WITH_BTN.test(stripComments(css))).map(([path]) => path);
    expect(offenders).toEqual([]);
  });

  it('nenhuma tela escreve classes de botão à mão (use Button ou buttonClass())', () => {
    const offenders = appSources
      .filter(([, source]) => TSX_VARIANT_TOKEN.test(source) || TSX_BARE_BTN.test(source))
      .map(([path]) => path);
    expect(offenders).toEqual([]);
  });

  it('nenhum Button usa estilo inline', () => {
    const offenders = appSources.filter(([, source]) => BUTTON_INLINE_STYLE.test(source)).map(([path]) => path);
    expect(offenders).toEqual([]);
  });

  it('as regras de proteção detectam violações de verdade', () => {
    expect(CSS_STARTS_WITH_BTN.test('.a { } .btn { color: red }')).toBe(true);
    expect(CSS_STARTS_WITH_BTN.test('.a, .btn:hover { color: red }')).toBe(true);
    expect(CSS_STARTS_WITH_BTN.test('@media (max-width: 1px) { .btn-sm { color: red } }')).toBe(true);
    expect(CSS_STARTS_WITH_BTN.test('.galeria li .btn { position: absolute }')).toBe(false);
    expect(TSX_VARIANT_TOKEN.test('<button className="btn btn-primary">')).toBe(true);
    expect(TSX_VARIANT_TOKEN.test('<div className="btn-group btn-overlay">')).toBe(false);
    expect(TSX_BARE_BTN.test('<a className="btn x" />')).toBe(true);
    expect(TSX_BARE_BTN.test('<div className="btn-group">')).toBe(false);
    expect(BUTTON_INLINE_STYLE.test('<Button onClick={() => go()} style={{ a: 1 }}>x</Button>')).toBe(true);
    expect(BUTTON_INLINE_STYLE.test('<Button onClick={() => go()}>x</Button><p style={{ a: 1 }} />')).toBe(false);
  });
});
