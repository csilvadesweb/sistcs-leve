package com.sistcs.leve.activitysync

import android.content.Context
import androidx.health.connect.client.HealthConnectClient
import androidx.work.Constraints
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.NetworkType
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.util.concurrent.TimeUnit

/** Sincroniza passos e exercícios de hoje em segundo plano, usando a conta salva no aparelho. */
class SyncWorker(context: Context, params: WorkerParameters) : CoroutineWorker(context, params) {
    override suspend fun doWork(): Result {
        val store = SecureSessionStore(applicationContext)
        val saved = store.load() ?: return Result.success()
        if (HealthConnectClient.getSdkStatus(applicationContext) != HealthConnectClient.SDK_AVAILABLE) return Result.success()
        return try {
            val client = HealthConnectClient.getOrCreate(applicationContext)
            val granted = client.permissionController.getGrantedPermissions()
            if (!granted.containsAll(HealthConnectReader.requiredPermissions())) return Result.success()
            val api = SupabaseActivitySync()
            val session = withContext(Dispatchers.IO) { api.refresh(saved.refreshToken, saved.email) }
            store.save(session.email, session.refreshToken)
            val summary = HealthConnectReader(client).readToday()
            withContext(Dispatchers.IO) { api.upload(session, summary) }
            Result.success()
        } catch (_: SecurityException) {
            // Sem a permissão de leitura em segundo plano o Android recusa; a sincronização ao abrir o app continua.
            Result.success()
        } catch (error: SupabaseActivitySync.HttpFailure) {
            if (error.code in 400..499 && error.code != 429) {
                store.clear()
                Result.success()
            } else {
                Result.retry()
            }
        } catch (_: Exception) {
            Result.retry()
        }
    }

    companion object {
        private const val UNIQUE_NAME = "sistcs-leve-sync-atividade"

        fun schedule(context: Context) {
            val request = PeriodicWorkRequestBuilder<SyncWorker>(15, TimeUnit.MINUTES)
                .setConstraints(Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build())
                .build()
            WorkManager.getInstance(context).enqueueUniquePeriodicWork(UNIQUE_NAME, ExistingPeriodicWorkPolicy.KEEP, request)
        }

        fun cancel(context: Context) {
            WorkManager.getInstance(context).cancelUniqueWork(UNIQUE_NAME)
        }
    }
}
