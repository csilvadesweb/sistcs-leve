package com.sistcs.leve.activitysync

import java.time.Instant
import org.junit.Assert.assertEquals
import org.junit.Test

class ExerciseSummaryTest {
    @Test
    fun durationIsReportedInWholeMinutes() {
        val summary = ExerciseSummary(
            type = "RUNNING",
            start = Instant.parse("2026-10-12T10:00:00Z"),
            end = Instant.parse("2026-10-12T10:42:59Z"),
        )
        assertEquals(42L, summary.durationMinutes)
    }

    @Test
    fun negativeDurationIsClampedToZero() {
        val summary = ExerciseSummary(
            type = "UNKNOWN",
            start = Instant.parse("2026-10-12T11:00:00Z"),
            end = Instant.parse("2026-10-12T10:00:00Z"),
        )
        assertEquals(0L, summary.durationMinutes)
    }
}
