# Backup e restauração

O workflow `.github/workflows/backup.yml` roda todo domingo (06:30 UTC) e também manualmente (Actions → backup → Run workflow).
Ele usa o secret `SUPABASE_DB_URL` (Session pooler, porta 5432) e gera o artefato `backup-<id>` (formato custom do pg_dump, schema `public`, retenção de 30 dias).

## Baixar
Actions → backup → execução → Artifacts → `backup-<id>` (zip com `backup.dump`).

## Restaurar (teste ou desastre)
1. Crie um projeto Supabase novo (ou use um local) e pegue a connection string (Session pooler).
2. Instale o cliente Postgres 17 (`pg_restore --version` deve ser 17+).
3. Rode:
   `pg_restore --no-owner --no-privileges --clean --if-exists -d "<URI_DO_NOVO_PROJETO>" backup.dump`
4. Aplique as migrations de `supabase/migrations` caso o projeto novo esteja vazio e o dump não traga algo (policies/funções ficam no schema public e vêm no dump).
5. Usuários (auth.users) NÃO estão no dump: o backup cobre os dados do app. Cada pessoa precisaria recriar a conta; para backup completo de auth use o Supabase CLI (`supabase db dump`) com o schema `auth`.
6. Reimplante a Edge Function `delete-account` e os secrets.

## Cuidados
- O artefato contém dados pessoais: mantenha o repositório privado ou com acesso restrito.
- Teste a restauração pelo menos uma vez.
