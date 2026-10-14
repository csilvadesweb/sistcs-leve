# Pendências seguras: GLP-1, nutricionista e push

Auditoria de implementação em 14/10/2026. Nenhuma migration ou alteração de produção foi aplicada.

## 1. Modo GLP-1 — ainda não concluído
- O app já possui cadastro de medicamentos e histórico de doses (`medications`, `medication_logs`).
- O esquema consultado não comprova uma estrutura persistente e isolada para efeitos adversos, intensidade, início/fim e resolução.
- Não armazenar efeitos médicos em `medications.notes`, nem improvisar JSON em campos existentes.
- Próximo passo seguro: recuperar os scripts históricos ausentes, confirmar o esquema remoto e adicionar uma migration estritamente aditiva com RLS por proprietário, validação de entrada, política de retenção e exclusão.
- O recurso deve registrar relatos, não diagnosticar, sugerir doses ou orientar alteração de tratamento. Incluir aviso de urgência para sintomas graves.

## 2. Compartilhamento somente leitura — ainda não concluído como link
- O relatório imprimível/PDF é local e não cria um link compartilhável.
- Link seguro requer token aleatório de alta entropia, expiração, revogação, escopo mínimo de dados, endpoint que não permita mutações e proteção contra enumeração/abuso.
- Não publicar relatórios de saúde em URL pública nem usar um link permanente de Storage.
- Próximo passo seguro: migration aditiva para shares com hash do token, proprietário, expiração/revogação e campos explicitamente permitidos; endpoint que verifica token e só retorna os dados autorizados. Confirmar RLS e testes entre contas antes de habilitar.

## 3. Push com app fechado — receptor preparado, entrega ainda não habilitada
- O service worker agora processa eventos push, exibe notificação e abre apenas URLs da mesma origem.
- Para entrega real ainda são necessários: chave pública VAPID no cliente, chave privada como segredo no servidor, tabela de subscriptions com RLS por proprietário, endpoint autenticado para criar/revogar inscrição e um emissor de push com limpeza de subscriptions expiradas.
- A inscrição deve exigir consentimento e permissão explícitos; nunca incluir doses, medicamentos ou efeitos adversos no texto da notificação.
- Push exige HTTPS e suporte do navegador/sistema; não há garantia se permissões estiverem negadas ou o sistema restringir notificações.

## Bloqueio de segurança
A auditoria anterior identificou migrations aplicadas no Supabase que não existem no repositório. Não executar `db push`, reset, nem schema changes até recuperar/reconciliar os scripts históricos. A implementação de produção deve ser liberada apenas depois de testes de RLS multiusuário, revogação/expiração, permissão negada, inscrição expirada e notificações com app fechado.