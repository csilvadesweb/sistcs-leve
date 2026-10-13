package com.sistcs.leve.activitysync

import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.records.ExerciseSessionRecord
import androidx.health.connect.client.records.Record
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.request.AggregateRequest
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import androidx.health.connect.client.permission.HealthPermission
import java.time.Instant
import java.time.ZonedDateTime
import kotlin.reflect.KClass

data class ExerciseSummary(val type: String, val start: Instant, val end: Instant) {
    val durationMinutes: Long
        get() = ((end.toEpochMilli() - start.toEpochMilli()).coerceAtLeast(0L) / 60_000L)
}

data class DailyActivitySummary(
    val date: String,
    val zoneId: String,
    val steps: Long,
    val exercises: List<ExerciseSummary>,
)

class HealthConnectReader(private val client: HealthConnectClient) {
    suspend fun readToday(now: ZonedDateTime = ZonedDateTime.now()): DailyActivitySummary {
        val zone = now.zone
        val start = now.toLocalDate().atStartOfDay(zone).toInstant()
        val end = minOf(now.toLocalDate().plusDays(1).atStartOfDay(zone).toInstant(), now.toInstant())
        val stepResult = client.aggregate(
            AggregateRequest(
                metrics = setOf(StepsRecord.COUNT_TOTAL),
                timeRangeFilter = TimeRangeFilter.between(start, end),
            ),
        )
        val exerciseResult = client.readRecords(
            ReadRecordsRequest(
                recordType = ExerciseSessionRecord::class,
                timeRangeFilter = TimeRangeFilter.between(start, end),
                ascendingOrder = false,
                pageSize = 500,
            ),
        )
        return DailyActivitySummary(
            date = now.toLocalDate().toString(),
            zoneId = zone.id,
            steps = stepResult[StepsRecord.COUNT_TOTAL] ?: 0L,
            exercises = exerciseResult.records.map {
                ExerciseSummary(it.exerciseType.toString(), it.startTime, it.endTime)
            },
        )
    }

    companion object {
        fun requiredPermissions(): Set<String> = setOf(
            HealthPermission.getReadPermission(StepsRecord::class as KClass<out Record>),
            HealthPermission.getReadPermission(ExerciseSessionRecord::class as KClass<out Record>),
        )
    }
}
