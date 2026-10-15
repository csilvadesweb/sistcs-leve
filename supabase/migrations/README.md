# Migrations e baseline

O projeto de produção foi criado antes de todo o histórico ser versionado no Git. O banco remoto possui migrations históricas que não têm scripts completos correspondentes neste diretório.

## Regra obrigatória

Não executar `supabase db push`, `supabase db reset` nem reparar versões manualmente até:

1. exportar o schema remoto;
2. recuperar ou validar os scripts históricos;
3. aplicar uma baseline em um projeto descartável;
4. comparar tabelas, constraints, índices, RLS, Storage e funções;
5. executar os testes de isolamento entre usuários.

`supabase/schema.sql` é um snapshot de recriação do estado atual do aplicativo. Ele não é autorização para marcar versões históricas como aplicadas e não substitui a reconciliação.

Toda mudança futura deve ser aditiva, revisada em pull request e testada em um projeto descartável antes de produção.
