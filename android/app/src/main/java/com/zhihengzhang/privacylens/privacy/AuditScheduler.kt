package com.zhihengzhang.privacylens.privacy

import android.content.Context
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import java.util.concurrent.TimeUnit

object AuditScheduler {
    private const val UNIQUE_AUDIT = "gdpr-permission-audit"

    fun scheduleDaily(context: Context) {
        val request = PeriodicWorkRequestBuilder<PermissionAuditWorker>(
            24,
            TimeUnit.HOURS
        ).build()
        WorkManager.getInstance(context).enqueueUniquePeriodicWork(
            UNIQUE_AUDIT,
            ExistingPeriodicWorkPolicy.UPDATE,
            request
        )
    }

    fun runNow(context: Context) {
        WorkManager.getInstance(context)
            .enqueue(OneTimeWorkRequestBuilder<PermissionAuditWorker>().build())
    }
}
