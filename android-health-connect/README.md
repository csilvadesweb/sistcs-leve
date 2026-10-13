# SISTCS Leve — companion Android Health Connect

**Status: fase inicial de leitura local; ainda não é sincronização automática com a conta SISTCS.**

Este projeto isolado não altera o PWA React/Vite. Ele solicita consentimento do usuário para ler passos agregados e sessões de exercício do Health Connect e mostra o resumo do dia no aparelho.

## Abrir e executar

1. Abra a pasta `android-health-connect/` no Android Studio.
2. Use JDK 17 e permita que o Android Studio sincronize o projeto Gradle.
3. Instale/atualize o Health Connect no aparelho Android.
4. Execute o app em um aparelho com dados disponíveis no Health Connect.
5. Conceda apenas as permissões solicitadas para passos e sessões de exercício.

O identificador inicial é `com.sistcs.leve.activitysync`; deve ser confirmado antes de distribuição pública. Esta fase não precisa de segredo, chave de serviço, login Supabase nem alterações no banco.

## Limitações deliberadas desta fase

- Os dados são lidos localmente e exibidos; **não são enviados nem persistidos na conta SISTCS**.
- Não há sincronização em segundo plano nem promessa de tempo real.
- Distância e calorias não são mostradas, pois precisam de contrato e validação de unidades/fonte.
- O app não apaga, modifica ou escreve dados no Health Connect.
- Não há assinatura de release nem configuração de Play Store.

## Próxima fase segura

Antes de qualquer upload, implementar vínculo autenticado entre o companion e o usuário SISTCS, adicionar persistência aditiva com RLS e chave de idempotência, testar isolamento real entre usuários em ambiente descartável e reconciliar o histórico de migrations remoto. Nunca inserir uma chave Supabase privilegiada no APK. A publicação fica bloqueada até build, testes e validação em dispositivo físico.
