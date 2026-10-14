begin;

select plan(13);

select ok(
  not has_table_privilege('anon', 'public.ai_usage', 'SELECT'),
  'anon cannot read AI usage records directly'
);
select ok(
  not has_table_privilege('anon', 'public.ai_usage', 'INSERT'),
  'anon cannot insert AI usage records directly'
);
select ok(
  not has_table_privilege('anon', 'public.ai_usage', 'UPDATE'),
  'anon cannot update AI usage records directly'
);
select ok(
  not has_table_privilege('anon', 'public.ai_usage', 'DELETE'),
  'anon cannot delete AI usage records directly'
);
select ok(
  not has_table_privilege('authenticated', 'public.ai_usage', 'SELECT'),
  'authenticated users cannot read AI usage records directly'
);
select ok(
  not has_table_privilege('authenticated', 'public.ai_usage', 'INSERT'),
  'authenticated users cannot insert AI usage records directly'
);
select ok(
  not has_table_privilege('authenticated', 'public.ai_usage', 'UPDATE'),
  'authenticated users cannot update AI usage records directly'
);
select ok(
  not has_table_privilege('authenticated', 'public.ai_usage', 'DELETE'),
  'authenticated users cannot delete AI usage records directly'
);
select ok(
  not has_function_privilege('anon', 'public.consume_ai_quota()', 'EXECUTE'),
  'anon cannot call the quota function'
);
select ok(
  has_function_privilege('authenticated', 'public.consume_ai_quota()', 'EXECUTE'),
  'authenticated users can consume quota through the function'
);
select ok(
  has_function_privilege('service_role', 'public.consume_ai_quota()', 'EXECUTE'),
  'service role can call the quota function'
);
select ok(
  (select c.relrowsecurity
   from pg_class c
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname = 'ai_usage'),
  'RLS remains enabled on ai_usage'
);
select ok(
  (select coalesce(p.proconfig, array[]::text[]) @> array['search_path=""']
   from pg_proc p
   join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'consume_ai_quota'
     and p.pronargs = 0),
  'quota function has an empty search_path'
);

select * from finish();
rollback;