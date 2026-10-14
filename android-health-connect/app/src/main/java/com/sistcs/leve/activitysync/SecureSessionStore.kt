package com.sistcs.leve.activitysync

import android.content.Context
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

/**
 * Guarda apenas o refresh token (nunca a senha), cifrado com uma chave AES-256 do Android Keystore
 * que não sai do aparelho. Permite manter a conta conectada entre aberturas do app.
 */
class SecureSessionStore(context: Context) {
    private val prefs = context.applicationContext.getSharedPreferences("sessao_segura", Context.MODE_PRIVATE)

    data class Saved(val email: String, val refreshToken: String)

    private fun key(): SecretKey {
        val store = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
        (store.getKey(ALIAS, null) as? SecretKey)?.let { return it }
        val generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore")
        generator.init(
            KeyGenParameterSpec.Builder(ALIAS, KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT)
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .setKeySize(256)
                .build(),
        )
        return generator.generateKey()
    }

    fun save(email: String, refreshToken: String) {
        if (refreshToken.isBlank()) return
        runCatching {
            val cipher = Cipher.getInstance(TRANSFORMATION)
            cipher.init(Cipher.ENCRYPT_MODE, key())
            val encrypted = cipher.doFinal(refreshToken.toByteArray(Charsets.UTF_8))
            prefs.edit()
                .putString("email", email)
                .putString("iv", Base64.encodeToString(cipher.iv, Base64.NO_WRAP))
                .putString("token", Base64.encodeToString(encrypted, Base64.NO_WRAP))
                .apply()
        }
    }

    fun load(): Saved? = runCatching {
        val email = prefs.getString("email", null) ?: return null
        val iv = Base64.decode(prefs.getString("iv", null) ?: return null, Base64.NO_WRAP)
        val token = Base64.decode(prefs.getString("token", null) ?: return null, Base64.NO_WRAP)
        val cipher = Cipher.getInstance(TRANSFORMATION)
        cipher.init(Cipher.DECRYPT_MODE, key(), GCMParameterSpec(128, iv))
        Saved(email, String(cipher.doFinal(token), Charsets.UTF_8))
    }.getOrNull()

    fun clear() {
        prefs.edit().clear().apply()
    }

    private companion object {
        const val ALIAS = "sistcs_leve_sessao"
        const val TRANSFORMATION = "AES/GCM/NoPadding"
    }
}
