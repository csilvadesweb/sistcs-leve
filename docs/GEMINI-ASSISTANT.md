# Assistente Gemini do SISTCS Leve

O assistente é um recurso opcional. O aplicativo continua funcionando quando a chave não está configurada ou a cota gratuita é atingida.

## Configuração necessária na Cloudflare

1. Crie uma chave no [Google AI Studio](https://aistudio.google.com/).
2. Abra Cloudflare > Workers & Pages > **sistcs-leve** > Settings > Variables and Secrets.
3. Adicione **Secret** com o nome `GEMINI_API_KEY` e cole a chave criada no Google AI Studio. Nunca adicione a chave ao GitHub, ao código do navegador ou a variáveis `VITE_*`.
4. Publique uma nova versão do Worker com o secret disponível e confira `https://leve.sistcs.com/api/ai/status`. A resposta deve indicar `available: true`; ela nunca revela a chave.
5. Teste o menu **Assistente IA** com uma conta autenticada.

O modelo inicial é `gemini-2.5-flash-lite`, configurado em `wrangler.jsonc`. A disponibilidade da camada gratuita e os limites podem mudar no Google AI Studio. Não habilite faturamento pago para esta implementação.

## Segurança e privacidade

- O endpoint exige sessão válida do Supabase e valida o token no endpoint de autenticação do projeto existente.
- A chave do Gemini é lida exclusivamente do secret do Worker.
- Entradas limitadas a 4.000 caracteres; histórico enviado limitado a 8 mensagens; respostas limitadas a 700 tokens.
- Erros do provedor não são repassados com detalhes internos ao usuário.
- Não envie dados de saúde identificáveis. O nível gratuito do Gemini pode usar conteúdo enviado para melhorar os produtos do Google; consulte os termos atuais antes de disponibilizar amplamente.
- A IA oferece educação alimentar geral. Não diagnostica nem prescreve tratamento e não substitui nutricionista ou médico.
- A IA não calcula os valores oficiais dos alimentos: os dados nutricionais devem continuar vindo da base existente no app.

## Testes

`npm test`, `npm run typecheck` e `npm run build`. O deploy final só deve acontecer depois de os testes passarem e o secret ser configurado.
