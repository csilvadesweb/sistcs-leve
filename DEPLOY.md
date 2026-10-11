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
