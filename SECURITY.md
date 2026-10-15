# Política de segurança

## Reportar uma vulnerabilidade

Não publique detalhes de uma vulnerabilidade em issue ou pull request público. Envie um reporte privado ao proprietário do repositório pelo canal de contato configurado no GitHub ou pelo endereço de segurança do projeto.

Inclua, se possível:

- descrição e impacto;
- passos mínimos para reproduzir;
- ambiente afetado;
- evidência sem dados pessoais ou segredos;
- sugestão de correção.

Não teste contra contas de terceiros, não exfiltre dados e não apague informações. A equipe deve confirmar o recebimento, avaliar o impacto, corrigir e publicar uma orientação quando apropriado.

## Segredos

Nunca faça commit de chaves Supabase `service_role`, chaves Gemini, senhas, tokens, connection strings ou passphrases de backup. Chaves públicas/publicáveis não substituem RLS e devem permanecer limitadas ao uso público previsto.
