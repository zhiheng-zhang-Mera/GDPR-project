package com.anonymous.mymobileapp.privacy

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters

class ViolationSimulatorWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {
    override suspend fun doWork(): Result {
        applicationContext.getSharedPreferences("gdpr_audit", Context.MODE_PRIVATE)
            .edit()
            .putString("latest_simulation", inputData.getString("config") ?: "{}")
            .putLong("latest_simulation_at", System.currentTimeMillis())
            .apply()
        return Result.success()
    }
}
