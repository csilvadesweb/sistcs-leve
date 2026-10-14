package com.sistcs.leve.activitysync

import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

/**
 * Uses the public Supabase publishable key and the user's own short-lived access token.
 * No service-role credential is embedded in this client.
 */
class SupabaseActivitySync {
    companion object {
        private const val BASE_URL = "https://yzcmxdbnitturlbozvqu.supabase.co"
        private const val PUBLIC_KEY = "sb_publishable_8NA8UB_55isWrQJawod7OQ_tvNKEJNz"
    }

    data class Session(
        val userId: String,
        val accessToken: String,
        val refreshToken: String = "",
        val email: String = "",
    )

    /** Erro HTTP do serviço de conta; [code] permite distinguir sessão recusada (4xx) de instabilidade (5xx). */
    class HttpFailure(val code: Int, message: String) : IllegalStateException(message)

    fun signIn(email: String, password: String): Session {
        require(email.isNotBlank() && password.isNotEmpty()) { "Informe e-mail e senha da sua conta SISTCS." }
        val response = request(
            path = "/auth/v1/token?grant_type=password",
            method = "POST",
            body = JSONObject().put("email", email.trim()).put("password", password),
        )
        return parseSession(response, email.trim())
    }

    /** Renova a sessão com o refresh token guardado (o Supabase devolve um novo refresh token a cada uso). */
    fun refresh(refreshToken: String, email: String): Session {
        require(refreshToken.isNotBlank()) { "Sessão salva inválida." }
        val response = request(
            path = "/auth/v1/token?grant_type=refresh_token",
            method = "POST",
            body = JSONObject().put("refresh_token", refreshToken),
        )
        return parseSession(response, email)
    }

    private fun parseSession(response: JSONObject, fallbackEmail: String): Session {
        val user = response.optJSONObject("user") ?: error("A autenticação não retornou um usuário válido.")
        val userId = user.optString("id")
        val token = response.optString("access_token")
        check(userId.isNotBlank() && token.isNotBlank()) { "Não foi possível iniciar uma sessão válida." }
        return Session(
            userId = userId,
            accessToken = token,
            refreshToken = response.optString("refresh_token"),
            email = user.optString("email").ifBlank { fallbackEmail },
        )
    }

    fun upload(session: Session, summary: DailyActivitySummary): Int {
        val rows = JSONArray()
        rows.put(JSONObject()
            .put("user_id", session.userId)
            .put("source", "health_connect")
            .put("record_key", "steps:${summary.date}")
            .put("record_type", "daily_steps")
            .put("record_date", summary.date)
            .put("value", summary.steps)
            .put("unit", "count")
            .put("source_metadata", JSONObject().put("zone_id", summary.zoneId)))
        summary.exercises.forEach { exercise ->
            val start = exercise.start.toString()
            val end = exercise.end.toString()
            val key = "exercise:${start}:${end}:${exercise.type}".take(200)
            rows.put(JSONObject()
                .put("user_id", session.userId)
                .put("source", "health_connect")
                .put("record_key", key)
                .put("record_type", "exercise_session")
                .put("record_date", summary.date)
                .put("start_time", start)
                .put("end_time", end)
                .put("value", exercise.durationMinutes)
                .put("unit", "minutes")
                .put("activity_name", exercise.type.take(100))
                .put("source_metadata", JSONObject().put("zone_id", summary.zoneId)))
        }
        request(
            path = "/rest/v1/health_activity_records?on_conflict=user_id,source,record_key",
            method = "POST",
            body = rows,
            accessToken = session.accessToken,
            prefer = "resolution=merge-duplicates,return=minimal",
        )
        return rows.length()
    }

    /** O GoTrue responde com `msg`/`error_code`; a API REST usa `message`. Traduz os casos comuns de login. */
    private fun friendlyError(code: Int, text: String): String {
        val json = runCatching { JSONObject(text) }.getOrNull()
        val errorCode = json?.optString("error_code").orEmpty()
        val raw = listOf("msg", "message", "error_description", "error")
            .map { json?.optString(it).orEmpty() }
            .firstOrNull { it.isNotBlank() }
            .orEmpty()
        return when {
            errorCode == "invalid_credentials" || raw.contains("Invalid login credentials", ignoreCase = true) ->
                "E-mail ou senha incorretos. Use o mesmo e-mail e senha com que você entra no app."
            errorCode == "email_not_confirmed" -> "Confirme seu e-mail antes de entrar."
            code == 429 || errorCode.contains("rate_limit") -> "Muitas tentativas. Aguarde alguns minutos e tente de novo."
            code in 500..599 -> "Serviço de conta indisponível no momento (HTTP $code). Tente de novo em instantes."
            raw.isNotBlank() -> "$raw (HTTP $code)"
            else -> "Falha no serviço de conta (HTTP $code)."
        }
    }

    private fun request(
        path: String,
        method: String,
        body: JSONObject,
        accessToken: String? = null,
        prefer: String? = null,
    ): JSONObject = request(path, method, body as Any, accessToken, prefer)

    private fun request(
        path: String,
        method: String,
        body: JSONArray,
        accessToken: String? = null,
        prefer: String? = null,
    ): JSONObject = request(path, method, body as Any, accessToken, prefer)

    private fun request(
        path: String,
        method: String,
        body: Any,
        accessToken: String? = null,
        prefer: String? = null,
    ): JSONObject {
        val connection = (URL(BASE_URL + path).openConnection() as HttpURLConnection).apply {
            requestMethod = method
            connectTimeout = 15000
            readTimeout = 20000
            setRequestProperty("apikey", PUBLIC_KEY)
            if (accessToken != null) setRequestProperty("Authorization", "Bearer $accessToken")
            setRequestProperty("Content-Type", "application/json")
            if (prefer != null) setRequestProperty("Prefer", prefer)
            doOutput = true
        }
        try {
            connection.outputStream.use { it.write(body.toString().toByteArray(Charsets.UTF_8)) }
            val code = connection.responseCode
            val stream = if (code in 200..299) connection.inputStream else connection.errorStream
            val text = stream?.bufferedReader(Charsets.UTF_8)?.use { it.readText() }.orEmpty()
            if (code !in 200..299) {
                throw HttpFailure(code, friendlyError(code, text))
            }
            return if (text.isBlank()) JSONObject() else JSONObject(text)
        } finally {
            connection.disconnect()
        }
    }
}
