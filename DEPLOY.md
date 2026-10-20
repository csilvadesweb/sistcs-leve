# Publicar em leve.sistcs.com (Cloudflare)

O app fica no subdomínio **leve.sistcs.com**, então nada do que já existe em sistcs.com sai do ar.
A Cloudflare recomenda hoje publicar sites novos como **Worker com arquivos estáticos**, e o projeto já vem configurado para isso (`wrangler.jsonc`).

## 1. Publicar com um comando
No terminal, dentro da pasta do projeto:
```bash
npm install
npx wrangler login      # abre o navegador para você entrar na Cloudflare (uma vez)
npm run deploy          # gera o app (dist/) e publica
```
O `wrangler.jsonc` já diz o nome do projeto (`sistcs-leve`), a pasta `dist` e o domínio `leve.sistcs.com`.
Como o DNS de sistcs.com está na mesma conta da Cloudflare, o registro DNS e o HTTPS são criados automaticamente, em alguns minutos.
O `public/_headers` vai junto e impede que o `sw.js` e o manifesto fiquem presos em cache.

Depois do primeiro `npm install`, guarde o `package-lock.json` (no Git) para os builds ficarem sempre iguais.

## 2. Publicar automaticamente a cada alteração (opcional)
Suba o projeto no GitHub. No painel: **Workers & Pages > Create > Import a repository**, escolha o repositório e use:
- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
Cada envio ao GitHub publica uma nova versão.

Se aparecer erro dizendo que `leve.sistcs.com` já tem um registro DNS, apague o registro `leve` em **DNS > Records** e rode o deploy de novo. Deixe o **Rocket Loader desligado** (Speed > Optimization).

## 3. Supabase (obrigatório para o login funcionar no domínio)
Projeto `yzcmxdbnitturlbozvqu` > **Authentication > URL Configuration**:
- **Site URL**: `https://leve.sistcs.com`
- **Redirect URLs**: adicione `https://leve.sistcs.com/**` (e `http://localhost:5173/**` para desenvolver).
Sem isso, os links dos e-mails de confirmação e de recuperação de senha apontam para o endereço errado.

## 4. E-mails com o seu domínio (recomendado antes de abrir ao público)
O e-mail padrão do Supabase tem limite de poucos envios por hora e sai com remetente genérico. Em
**Authentication > SMTP Settings**, configure um provedor (Resend, Brevo, Amazon SES) com remetente
`no-reply@sistcs.com`. No DNS de sistcs.com, adicione os registros **SPF** e **DKIM** que o provedor indicar, para os e-mails não caírem no spam.
Depois, em **Authentication > Providers > Email**, deixe "Confirm email" ligado em produção.

## 5. Conferir
- Abra `https://leve.sistcs.com`, crie uma conta e confirme o e-mail.
- No Chrome do celular: menu > "Instalar app". No iPhone, Safari > Compartilhar > "Adicionar à Tela de Início".
- Lighthouse (Chrome DevTools) > categoria PWA: deve indicar "instalável".
- Ao trocar a logo ou os ícones no futuro, aumente `VERSION` em `public/sw.js` para o app buscar os arquivos novos.

## 6. Notificações push (lembretes de dose com o app fechado)
O Worker envia o aviso a cada minuto (`triggers.crons` do `wrangler.jsonc`) para quem tem dose agendada e ainda não marcada.
Nada de dados de saúde vai no texto: o aviso diz só "Você tem uma dose agendada agora".

1. **Banco:** no Supabase (**SQL Editor**), rode `supabase/migrations/20261019140000_push_notifications.sql`.
   Cria `push_subscriptions` (um registro por aparelho, só o dono acessa) e `push_sent` (evita avisar a mesma dose duas vezes; só o servidor acessa).
2. **Chaves VAPID:** no seu computador, `node scripts/generate-vapid.mjs`. A chave **privada** é segredo: não coloque no Git nem no chat.
3. **Cloudflare:** guarde as três como **segredos** (os valores do `wrangler.jsonc` são recriados a cada deploy, os segredos não):
   ```bash
   npx wrangler secret put VAPID_PUBLIC_KEY
   npx wrangler secret put VAPID_PRIVATE_KEY
   npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY   # Supabase > Settings > API Keys > service_role (secret)
   ```
   A chave `service_role` só pode existir aqui, como segredo do Worker. Nunca no front-end, no Git ou no chat.
4. **Conferir:** abra o app > **Medicamentos > Ativar lembretes** > **Enviar teste**. Sem os segredos, o app informa que ainda não foram ativadas no servidor.
5. **iPhone:** só funciona com o app instalado na tela inicial (iOS 16.4 ou superior).

O agendador olha as doses dos últimos 10 minutos, então um atraso de execução não perde o aviso. Aparelhos que cancelam a inscrição (erro 404/410 do serviço de push) são removidos sozinhos.

## 7. Refeições salvas (aba "Seus salvos > Refeições")
Rode no Supabase (**SQL Editor**) `supabase/migrations/20261020120000_saved_meals.sql`. Cria `saved_meals` (só o dono acessa, RLS).
Sem a migração o app continua funcionando: a aba mostra um aviso e as demais abas (Recentes, Favoritos) seguem normais.
