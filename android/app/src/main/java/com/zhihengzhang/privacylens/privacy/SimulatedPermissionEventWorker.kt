package com.zhihengzhang.privacylens.privacy

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import org.json.JSONArray
import org.json.JSONObject

/** Records synthetic evidence only; it never invokes a real sensor or user-data API. */
class SimulatedPermissionEventWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {
    override suspend fun doWork(): Result {
        val simulationId = inputData.getString("simulationId") ?: return Result.failure()
        val permission = inputData.getString("permissionType") ?: return Result.failure()
        val preferences = applicationContext.getSharedPreferences("gdpr_audit", Context.MODE_PRIVATE)
        synchronized(SimulatedPermissionEventWorker::class.java) {
            val events = try {
                JSONArray(preferences.getString("simulation_events", "[]"))
            } catch (_: Exception) {
                JSONArray()
            }
            events.put(
                JSONObject()
                    .put("simulationId", simulationId)
                    .put("permissionType", permission)
                    .put("eventIndex", inputData.getInt("eventIndex", -1))
                    .put("scheduledAt", inputData.getLong("scheduledAt", 0L))
                    .put("recordedAt", System.currentTimeMillis())
            )
            val completed = preferences.getInt("latest_simulation_completed", 0) + 1
            preferences.edit()
                .putString("simulation_events", events.toString())
                .putInt("latest_simulation_completed", completed)
                .putInt("latest_simulation_total", inputData.getInt("totalCalls", 0))
                .apply()
        }
        return Result.success()
    }
}
