# Sincronização automática de atividade — Health Connect

**Estado:** companion Android inicial implementado para leitura local; sincronização remota automática ainda não está ativa.  
**Data:** 2026-10-12  
**Regra:** custo zero, regressão zero.

## Decisão

Implementar primeiro um companion Android nativo usando **Health Connect**, em vez de tentar acessar sensores por meio do PWA. O SISTCS Leve atual é React/Vite executado no navegador; navegadores não expõem a API Android Health Connect. Portanto, adicionar apenas uma tela ou um botão ao PWA não entregaria sincronização real.

Health Connect é a fonte unificada no Android para dados permitidos pelo usuário, inclusive dados que outros apps compatíveis gravam. Isso pode incluir Samsung Health, mas somente os tipos de dados que estejam disponíveis no Health Connect e tenham permissões concedidas.

Não iniciar uma integração nova com Google Fit REST/Android APIs: o Google anunciou a descontinuação durante 2026 e recomenda Health Connect para apps Android centrados no dispositivo. A integração direta com Samsung Health Data SDK fica como alternativa posterior, porque a distribuição pública requer registro/aprovação de parceiro Samsung.

## Escopo do MVP

1. Companion Android separado em `android-health-connect/`, sem alterar o bundle web existente. A primeira etapa de leitura local foi adicionada, mas ainda precisa de build e validação em aparelho.
2. Leitura consentida de:
   - passos agregados por dia;
   - sessões de exercício (tipo, início/fim e duração quando disponíveis);
   - distância e calorias ativas somente quando fornecidas pela fonte e com unidades/semântica validadas.
3. Sincronização idempotente: a mesma janela/dado não pode gerar duplicatas em reexecuções.
4. Indicador de última sincronização, estado de permissão, falha de conexão e sincronização manual.
5. Sincronização periódica em segundo plano somente após validar as restrições do Android, permissões de leitura em background e política de bateria. Não prometer tempo real.
6. Nenhum dado de saúde enviado antes do consentimento explícito; opção de desconectar e apagar somente os dados importados.
7. A interface web só mostra os dados depois de haver um contrato de persistência seguro, com RLS por `auth.uid()`.

## Arquitetura proposta

- **Android nativo:** Kotlin + Health Connect SDK; permissões mínimas e explícitas; usar agregação para passos a fim de evitar dupla contagem de múltiplas fontes.
- **Autenticação:** sessão Supabase vinculada ao usuário autenticado. Nunca embutir `service_role`, client secret ou tokens privados no aplicativo.
- **Persistência:** migration aditiva própria para registros de sincronização e dados diários normalizados; chave única por usuário, provedor, tipo de métrica e intervalo/data. Políticas RLS de SELECT/INSERT/UPDATE/DELETE restritas ao proprietário.
- **Web:** leitura opcional desses registros em relatórios e/ou uma tela de integrações; nenhum comportamento atual deve depender da nova tabela.
- **Observabilidade:** guardar somente status, timestamps e códigos de erro necessários; não registrar payloads de saúde em logs.
- **Idempotência:** upsert com chave natural/ID de origem quando existir; para agregados diários, chave por usuário + provedor + tipo + data + fuso.

## Dados que não devem ser inferidos

- Não calcular calorias gastas a partir de passos sem rotular claramente a estimativa.
- Não somar calorias ativas e totais sem distinguir os conceitos.
- Não deduzir frequência cardíaca, sono, distância ou treino se a fonte não fornecer o dado.
- Não misturar exercícios manuais com importados sem identificador de origem e regra de deduplicação.

## Bloqueios antes de produção

- Compilar e testar o companion Android; ainda não há evidência de build Android nem validação em aparelho real.
- Definir package ID e assinatura de release para a distribuição Android.
- Implementar e testar autenticação segura entre o companion e Supabase.
- Criar migration aditiva e testes RLS em ambiente descartável. O histórico remoto de migrations tem scripts ausentes; não executar `db push` nem aplicar alterações em produção até reconciliar esse histórico conforme `docs/SUPABASE_MIGRATION_AUDIT_2026-10-12.md`.
- Testar num aparelho real com Health Connect, incluindo permissão negada/revogada, nenhum dado, múltiplas fontes, fuso horário, falta de rede, reexecução e sincronização em segundo plano.
- Revisar Play Store/Data Safety e política de privacidade antes de distribuir o app.

## Critérios de aceite

- `npm test`, `npm run typecheck` e `npm run build` do PWA continuam passando sem mudanças de comportamento.
- Testes Android unitários e de integração precisam ser executados; validar em dispositivo físico antes de sair do estado draft.
- Reimportar o mesmo período não cria duplicatas.
- Usuário A não lê nem altera dados de usuário B (testes RLS reais, não só mocks).
- Revogar permissão interrompe leituras futuras; desconectar não apaga dados não relacionados.
- Nenhuma migration é aplicada, nenhum secret é alterado e nenhum deploy ocorre sem validação explícita do ambiente e evidência dos testes.

## Referências oficiais

- Health Connect, leitura de dados: https://developer.android.com/health-and-fitness/health-connect/read-data
- Migração de Google Fit: https://developer.android.com/health-and-fitness/health-connect/migration/fit/faq
- Samsung Health Data SDK e aprovação para distribuição: https://developer.samsung.com/health/data/guide/app-verification.html
