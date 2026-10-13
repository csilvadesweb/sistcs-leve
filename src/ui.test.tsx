import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Button, Field, dateDaysAgoInSaoPaulo, decimalIsValid, decimalInputText, decimalText } from './ui';

describe('componentes básicos da interface', () => {
  it('mantém o tipo e as classes padrão do botão sem submit acidental', () => {
    const html = renderToStaticMarkup(createElement(Button, { children: 'Salvar' }));

    expect(html).toContain('type="button"');
    expect(html).toContain('class="btn btn-default btn-md "');
    expect(html).toContain('>Salvar</button>');
  });

  it('preserva variantes, estado desabilitado e tipo submit quando solicitados', () => {
    const html = renderToStaticMarkup(
      createElement(Button, {
        variant: 'destructive',
        size: 'sm',
        type: 'submit',
        disabled: true,
        children: 'Apagar conta',
      }),
    );

    expect(html).toContain('type="submit"');
    expect(html).toContain('class="btn btn-destructive btn-sm "');
    expect(html).toContain('disabled=""');
    expect(html).toContain('>Apagar conta</button>');
  });

  it('liga o rótulo ao campo e expõe erros de validação como alerta acessível', () => {
    const html = renderToStaticMarkup(
      createElement(
        Field,
        {
          id: 'volume-agua',
          label: 'Volume de água',
          optional: true,
          hint: 'Informe em mililitros.',
          error: 'Informe um número válido.',
          children: createElement('input', { id: 'volume-agua', name: 'volume' }),
        },
      ),
    );

    expect(html).toContain('for="volume-agua"');
    expect(html).toContain('Volume de água');
    expect(html).toContain('(opcional)');
    expect(html).toContain('Informe em mililitros.');
    expect(html).toContain('role="alert"');
    expect(html).toContain('Informe um número válido.');
  });
});

describe('formatação numérica brasileira usada nos formulários', () => {
  it.each([
    ['1,5', true],
    ['0', true],
    [' 12,75 ', true],
    ['', false],
    ['1,2,3', false],
    ['-1', false],
    ['1e3', false],
  ])('valida o valor %s sem aceitar formatos ambíguos', (value, expected) => {
    expect(decimalIsValid(value)).toBe(expected);
  });

  it('permite exigir valor estritamente positivo', () => {
    expect(decimalIsValid('0', false)).toBe(false);
    expect(decimalIsValid('0,1', false)).toBe(true);
  });

  it('mantém a apresentação numérica no padrão pt-BR', () => {
    expect(decimalText(1234.5)).toBe('1.234,5');
    expect(decimalInputText(12.5)).toBe('12,5');
  });
});


describe('datas de calendário no fuso de São Paulo', () => {
  it('calcula o limite de seis dias pelo calendário local, perto da meia-noite brasileira', () => {
    expect(dateDaysAgoInSaoPaulo(6, new Date('2026-10-13T02:30:00.000Z'))).toBe('2026-10-06');
  });

  it('não permite que dias negativos ou inválidos avancem o limite para o futuro', () => {
    const now = new Date('2026-10-13T15:00:00.000Z');
    expect(dateDaysAgoInSaoPaulo(-2, now)).toBe('2026-10-13');
    expect(dateDaysAgoInSaoPaulo(Number.NaN, now)).toBe('2026-10-13');
  });
});
