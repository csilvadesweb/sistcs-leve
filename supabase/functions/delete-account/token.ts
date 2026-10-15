/** Extrai apenas um token Bearer bem formado de um cabeçalho Authorization. */
export function extractBearerToken(authorization: string | null): string | null {
  if (!authorization) return null;
  const match = authorization.trim().match(/^Bearer\s+([^\s]+)$/i);
  return match?.[1] ?? null;
}
