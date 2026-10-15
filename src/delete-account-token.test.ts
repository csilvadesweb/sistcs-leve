import { describe, expect, it } from 'vitest';
import { extractBearerToken } from '../supabase/functions/delete-account/token';

describe('extractBearerToken', () => {
  it('extrai token Bearer válido sem alterar o JWT', () => {
    expect(extractBearerToken('Bearer eyJhbGciOiJIUzI1NiJ9.payload.signature'))
      .toBe('eyJhbGciOiJIUzI1NiJ9.payload.signature');
  });

  it('aceita esquema Bearer sem diferenciar maiúsculas e espaços externos', () => {
    expect(extractBearerToken('  bEaReR   token-123  ')).toBe('token-123');
  });

  it.each([null, '', '   ', 'Basic token-123', 'Bearer', 'Bearer token extra'])(
    'rejeita cabeçalho inválido: %s',
    (header) => {
      expect(extractBearerToken(header)).toBeNull();
    },
  );
});
