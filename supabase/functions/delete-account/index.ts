// Fonte da Edge Function `delete-account`.
// Valida o token do usuário, apaga todos os objetos privados e remove a conta.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { extractBearerToken } from './token.ts';

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
  const maxBatches = 100;

  async function clearFolder(prefix: string, depth = 0): Promise<void> {
    if (depth > 20) throw new Error('storage_cleanup_depth_limit');
    for (let batch = 0; batch < maxBatches; batch += 1) {
      // Re-read from offset zero after deletion so the next batch is not skipped.
      const { data: entries, error: listError } = await storage.list(prefix, {
        limit: pageSize,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' },
      });
      if (listError) throw listError;
      if (!entries?.length) return;

      const files = entries
        .filter((entry) => Boolean(entry.id) && Boolean(entry.name))
        .map((entry) => `${prefix}/${entry.name}`);
      const folders = entries.filter((entry) => !entry.id && Boolean(entry.name));

      for (const folder of folders) {
        await clearFolder(`${prefix}/${folder.name}`, depth + 1);
      }
      if (files.length) {
        const { error: removeError } = await storage.remove(files);
        if (removeError) throw removeError;
      } else if (!folders.length) {
        return;
      }
    }
    throw new Error('storage_cleanup_limit');
  }

  await clearFolder(userId);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: responseHeaders(req) });
  if (req.method !== 'POST') return json(req, { error: 'method_not_allowed' }, 405);

  const url = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const token = extractBearerToken(req.headers.get('Authorization'));
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
      bucket: 'avatars or progress-photos',
      message: error instanceof Error ? error.message : 'unknown_error',
    });
    return json(req, { error: 'delete_failed' }, 500);
  }

  const { error } = await admin.auth.admin.deleteUser(auth.user.id);
  if (error) {
    console.error('account deletion failed', { message: error.message });
    return json(req, { error: 'delete_failed' }, 500);
  }
  return json(req, { ok: true });
});
