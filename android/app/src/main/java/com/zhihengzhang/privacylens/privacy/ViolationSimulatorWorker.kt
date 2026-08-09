package com.zhihengzhang.privacylens.privacy

import android.content.Context
import androidx.work.Data
import androidx.work.CoroutineWorker
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.TimeUnit
import kotlin.math.max
import kotlin.random.Random

class ViolationSimulatorWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {
    override suspend fun doWork(): Result {
        val now = System.currentTimeMillis()
        val supplied = inputData.getString("config")
        val config = try {
            if (supplied.isNullOrBlank()) randomConfig(now) else normaliseConfig(JSONObject(supplied), now)
        } catch (_: Exception) {
            return Result.failure(Data.Builder().putString("error", "INVALID_SIMULATION_CONFIG").build())
        }

        val permission = config.getString("permissionType")
        val simulationId = config.getString("id")
        val triggerTimes = config.getJSONArray("triggerTimes")
        val workManager = WorkManager.getInstance(applicationContext)
        for (index in 0 until triggerTimes.length()) {
            val triggerAt = triggerTimes.getLong(index)
            val eventData = Data.Builder()
                .putString("simulationId", simulationId)
                .putString("permissionType", permission)
                .putLong("scheduledAt", triggerAt)
                .putInt("eventIndex", index)
                .putInt("totalCalls", triggerTimes.length())
                .build()
            val event = OneTimeWorkRequestBuilder<SimulatedPermissionEventWorker>()
                .setInputData(eventData)
                .setInitialDelay(max(0L, triggerAt - now), TimeUnit.MILLISECONDS)
                .build()
            workManager.enqueue(event)
        }

        applicationContext.getSharedPreferences("gdpr_audit", Context.MODE_PRIVATE)
            .edit()
            .putString("latest_simulation", config.toString())
            .putLong("latest_simulation_at", now)
            .putInt("latest_simulation_completed", 0)
            .putInt("latest_simulation_total", triggerTimes.length())
            .putString("simulation_events", "[]")
            .apply()
        return Result.success(
            Data.Builder()
                .putString("simulationId", simulationId)
                .putInt("scheduledCalls", triggerTimes.length())
                .build()
        )
    }

    private fun randomConfig(now: Long): JSONObject {
        val permission = listOf("LOCATION", "MICROPHONE", "CONTACTS").random()
        val totalCalls = Random.nextInt(50, 201)
        val start = now
        val end = now + TimeUnit.HOURS.toMillis(24)
        val times = (0 until totalCalls)
            .map { Random.nextLong(start, end) }
            .sorted()
        return JSONObject()
            .put("id", "native-$now-$permission")
            .put("permissionType", permission)
            .put("totalCalls", totalCalls)
            .put("triggerTimes", JSONArray(times))
            .put("expectedViolation", true)
    }

    private fun normaliseConfig(source: JSONObject, now: Long): JSONObject {
        val permission = source.getString("permissionType")
        require(permission in setOf("LOCATION", "MICROPHONE", "CONTACTS"))
        val totalCalls = source.getInt("totalCalls")
        require(totalCalls in 1..200)
        val inputTimes = source.getJSONArray("triggerTimes")
        require(inputTimes.length() == totalCalls)
        val day = TimeUnit.HOURS.toMillis(24)
        val suppliedTimes = (0 until inputTimes.length()).map { inputTimes.getLong(it) }.sorted()
        require(suppliedTimes.last() - suppliedTimes.first() <= day)
        val times = if (suppliedTimes.first() < now) {
            suppliedTimes.map { now + (it - suppliedTimes.first()) }
        } else suppliedTimes
        require(times.all { it in now..(now + day) })
        return JSONObject()
            .put("id", source.optString("id", "native-$now-$permission"))
            .put("permissionType", permission)
            .put("totalCalls", totalCalls)
            .put("triggerTimes", JSONArray(times))
            .put("expectedViolation", source.optBoolean("expectedViolation", true))
    }
}
