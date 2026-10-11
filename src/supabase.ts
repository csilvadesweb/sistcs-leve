import { createClient } from '@supabase/supabase-js';

// A chave publicável é pública por desenho: o acesso aos dados é protegido por RLS.
const url = import.meta.env.VITE_SUPABASE_URL ?? 'https://yzcmxdbnitturlbozvqu.supabase.co';
const key =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? 'sb_publishable_8NA8UB_55isWrQJawod7OQ_tvNKEJNz';

export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true },
});
