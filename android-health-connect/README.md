# SISTCS Leve — companion Android Health Connect

**Status: sincronização manual autenticada; não é sincronização automática nem em segundo plano.**

Este aplicativo Android complementar solicita consentimento para ler passos agregados e sessões de exercício do Health Connect. Ao tocar em **Conectar e sincronizar**, autentica a conta SISTCS e envia os registros do dia à conta do usuário usando uma sessão autenticada e a chave pública do Supabase. Nenhuma chave de serviço privilegiada é embutida no APK.

## Abrir e executar

1. Abra a pasta `android-health-connect/` no Android Studio.
2. Use JDK 17 e permita que o Android Studio sincronize o projeto Gradle.
3. Instale/atualize o Health Connect no aparelho Android.
4. Execute o app em um aparelho com dados disponíveis no Health Connect.
5. Entre com a conta SISTCS, conceda as permissões solicitadas para passos e sessões de exercício e toque em **Conectar e sincronizar**.
6. Abra o Perfil no SISTCS Leve para verificar os dados importados.

O identificador do aplicativo é `com.sistcs.leve.activitysync`. A leitura é limitada ao dia atual no fuso horário do aparelho. A leitura de sessões acompanha os tokens de paginação do Health Connect para não parar silenciosamente nos primeiros 500 registros.

## Limitações e segurança

- A sincronização é iniciada manualmente; não há sincronização em segundo plano nem promessa de tempo real.
- Após o primeiro login, o app guarda só o refresh token (nunca a senha), cifrado com AES-256 no Android Keystore, e entra direto nas próximas aberturas. "Sair desta conta" apaga a sessão salva. Se a sessão expirar, o app pede o login de novo.
- A leitura depende dos dados que o Samsung Health ou outro aplicativo compatível disponibiliza ao Health Connect e das permissões concedidas pelo usuário.
- Distância e calorias não são mostradas, pois precisam de contrato e validação de unidades/fonte.
- O app não apaga, modifica ou escreve dados no Health Connect.
- Não há assinatura de release nem configuração de Play Store.

## Validação antes de distribuição

Executar testes unitários e build Android, testar permissões concedidas/negadas/revogadas, falhas de rede e isolamento entre contas em ambiente controlado. Testar em dispositivo físico Samsung Galaxy e confirmar separadamente que o Galaxy Watch compartilha dados com o Health Connect. Não aplicar ou reparar migrations remotamente sem reconciliar primeiro o histórico de migrations do projeto Supabase.
