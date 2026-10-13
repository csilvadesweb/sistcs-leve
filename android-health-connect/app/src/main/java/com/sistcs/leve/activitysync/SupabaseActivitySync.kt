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

    data class Session(val userId: String, val accessToken: String)

    fun signIn(email: String, password: String): Session {
        require(email.isNotBlank() && password.isNotEmpty()) { "Informe e-mail e senha da sua conta SISTCS." }
        val response = request(
            path = "/auth/v1/token?grant_type=password",
            method = "POST",
            body = JSONObject().put("email", email.trim()).put("password", password),
        )
        val user = response.optJSONObject("user") ?: error("A autenticação não retornou um usuário válido.")
        val userId = user.optString("id")
        val token = response.optString("access_token")
        check(userId.isNotBlank() && token.isNotBlank()) { "Não foi possível iniciar uma sessão válida." }
        return Session(userId, token)
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

    private fun request(
        path: String,
        method: String,
        body: org.json.JSONStringer? = null,
        accessToken: String? = null,
        prefer: String? = null,
    ): JSONObject = request(path, method, body?.let { JSONObject(it.toString()) }, accessToken, prefer)

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
            setRequestProperty("Authorization", "Bearer ${accessToken ?: PUBLIC_KEY}")
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
                val message = runCatching { JSONObject(text).optString("message") }.getOrNull().orEmpty()
                throw IllegalStateException(message.ifBlank { "Falha no serviço de conta (HTTP $code)." })
            }
            return if (text.isBlank()) JSONObject() else JSONObject(text)
        } finally {
            connection.disconnect()
        }
    }
}
