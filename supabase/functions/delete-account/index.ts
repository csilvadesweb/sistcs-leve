// Fonte da Edge Function `delete-account`.
// Valida o token do usuário, apaga todos os objetos privados e remove a conta.
import { createClient } from 'npm:@supabase/supabase-js@2';

const ALLOWED_ORIGINS = new Set(['https://leve.sistcs.com', 'http://localhost:5173']);
const ALLOWED_HEADERS = 'authorization, x-client-info, apikey, content-type';
const ALLOWED_METHODS = 'POST, OPTIONS';

function responseHeaders(req: Request): Headers {
  const result = new Headers({
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Vary': 'Origin',
  });
  const origin = req.headers.get('Origin');
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    result.set('Access-Control-Allow-Origin', origin);
    result.set('Access-Control-Allow-Headers', ALLOWED_HEADERS);
    result.set('Access-Control-Allow-Methods', ALLOWED_METHODS);
  }
  return result;
}

const json = (req: Request, body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: responseHeaders(req) });

async function removeAllUserObjects(admin: ReturnType<typeof createClient>, bucket: string, userId: string) {
  const storage = admin.storage.from(bucket);
  const pageSize = 100;
  for (let page = 0; page < 100; page += 1) {
    const { data: files, error: listError } = await storage.list(userId, { limit: pageSize, offset: 0 });
    if (listError) throw listError;
    const names = (files ?? [])
      .filter((file) => Boolean(file.id) && Boolean(file.name))
      .map((file) => `${userId}/${file.name}`);
    if (!names.length) return;
    const { error: removeError } = await storage.remove(names);
    if (removeError) throw removeError;
  }
  throw new Error('storage_cleanup_limit');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: responseHeaders(req) });
  if (req.method !== 'POST') return json(req, { error: 'method_not_allowed' }, 405);

  const url = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '').trim();
  if (!url || !serviceRoleKey || !token) return json(req, { error: 'unauthorized' }, 401);

  const admin = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: auth, error: authError } = await admin.auth.getUser(token);
  if (authError || !auth.user) return json(req, { error: 'unauthorized' }, 401);

  try {
    for (const bucket of ['avatars', 'progress-photos']) {
      await removeAllUserObjects(admin, bucket, auth.user.id);
    }
  } catch (error) {
    console.error('account deletion storage cleanup failed', {
      userId: auth.user.id,
      message: error instanceof Error ? error.message : 'unknown_error',
    });
    return json(req, { error: 'delete_failed' }, 500);
  }

  const { error } = await admin.auth.admin.deleteUser(auth.user.id);
  if (error) {
    console.error('account deletion failed', { userId: auth.user.id, message: error.message });
    return json(req, { error: 'delete_failed' }, 500);
  }
  return json(req, { ok: true });
});
