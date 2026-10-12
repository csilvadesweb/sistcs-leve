-- Personalização aditiva do menu por usuário.
-- Não altera rotas, dados existentes nem nomes internos das funcionalidades.
alter table public.profiles
  add column if not exists navigation_preferences jsonb not null
  default '{"order":["/","/alimentacao","/registros","/jejum","/medicamentos","/relatorios","/perfil"],"labels":{}}'::jsonb;
