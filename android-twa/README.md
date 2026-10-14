# SISTCS Leve — app Android (TWA)

Janela em tela cheia para o site https://leve.sistcs.com (Trusted Web Activity). Atualizar o site atualiza o app.

- Pacote: `com.sistcs.leve` · Gerar APK: Actions → "Android App (SISTCS Leve)" → artefato `sistcs-leve-app`.
- A tela cheia (sem barra de endereço) depende de `public/.well-known/assetlinks.json` conter o fingerprint SHA-256 da chave que assina o APK.
- A chave `app/sistcs-leve-twa.jks` é pública de propósito (distribuição direta, o app não guarda dados nem segredos).
- **Play Store:** gere uma chave privada própria (`keytool -genkeypair ...`), guarde-a nos secrets do GitHub, troque o `signingConfig` e atualize o fingerprint no `assetlinks.json` (ou use o App Signing do Google e adicione o fingerprint dele).
