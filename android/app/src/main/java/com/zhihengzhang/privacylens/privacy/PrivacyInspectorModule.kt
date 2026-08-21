package com.zhihengzhang.privacylens.privacy

import androidx.work.Data
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import com.zhihengzhang.privacylens.BuildConfig
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.facebook.react.modules.core.DeviceEventManagerModule

class PrivacyInspectorModule(
    private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {
    override fun getName() = "PrivacyInspector"

    @ReactMethod
    fun scheduleDailyAudit() = AuditScheduler.scheduleDaily(reactContext)

    @ReactMethod
    fun runAuditNow() = AuditScheduler.runNow(reactContext)

    @ReactMethod
    fun scheduleSimulation(config: String) {
        val data = Data.Builder().putString("config", config).build()
        val request = OneTimeWorkRequestBuilder<ViolationSimulatorWorker>()
            .setInputData(data)
            .build()
        WorkManager.getInstance(reactContext).enqueue(request)
    }

    @ReactMethod
    fun scheduleRandomSimulation() {
        WorkManager.getInstance(reactContext)
            .enqueue(OneTimeWorkRequestBuilder<ViolationSimulatorWorker>().build())
    }

    @ReactMethod
    fun getLatestAudit(promise: Promise) {
        val preferences = reactContext.getSharedPreferences("gdpr_audit", 0)
        promise.resolve(preferences.getString("latest_capability_audit", "[]"))
    }

    @ReactMethod
    fun getLatestSimulation(promise: Promise) {
        val preferences = reactContext.getSharedPreferences("gdpr_audit", 0)
        val result = Arguments.createMap().apply {
            putString("config", preferences.getString("latest_simulation", "{}"))
            putString("events", preferences.getString("simulation_events", "[]"))
            putInt("completedCalls", preferences.getInt("latest_simulation_completed", 0))
            putInt("totalCalls", preferences.getInt("latest_simulation_total", 0))
        }
        promise.resolve(result)
    }

    @ReactMethod
    fun dispatchAuditLog(
        apiName: String,
        frequency: Int,
        destination: String,
        eventType: String
    ) {
        val permissionType = when (eventType) {
            "SENSITIVE_LEAK_RISK" -> "MICROPHONE"
            "UNAUTHORIZED_CROSS_BORDER" -> "CONTACTS"
            else -> "LOCATION"
        }
        val now = System.currentTimeMillis()
        val normalizedApi = apiName.uppercase()
        val observationType = when {
            "BODY" in normalizedApi || "HEALTH" in normalizedApi -> "BODY_SENSORS"
            "ACTIVITY" in normalizedApi -> "ACTIVITY_RECOGNITION"
            "CAMERA" in normalizedApi -> "CAMERA"
            "CLIPBOARD" in normalizedApi -> "CLIPBOARD_READ"
            "DEVICE" in normalizedApi || "PHONE_STATE" in normalizedApi -> "DEVICE_IDENTIFIER"
            "MEDIA_LOCATION" in normalizedApi -> "MEDIA_LOCATION"
            "MEDIA" in normalizedApi || "IMAGE" in normalizedApi -> "MEDIA_IMAGES"
            "BACKGROUND" in normalizedApi -> "APP_BACKGROUNDED"
            destination != "local" -> "DATA_TRANSFER"
            else -> permissionType
        }
        val observationChannel = when (observationType) {
            "DATA_TRANSFER" -> "DATA_TRANSFER"
            "APP_BACKGROUNDED" -> "APP_STATE"
            "CLIPBOARD_READ", "DEVICE_IDENTIFIER", "MEDIA_IMAGES", "MEDIA_LOCATION", "CONTACTS" -> "DATA_ACCESS"
            else -> "SENSOR_CALL"
        }
        val observation = Arguments.createMap().apply {
            putString("type", observationType)
            putDouble("occurredAt", now.toDouble())
            putInt("count", frequency)
            putString("channel", observationChannel)
            putString("destination", if (destination == "local") "LOCAL" else "NETWORK")
            putString("source", "NATIVE_BRIDGE")
        }
        val observations = Arguments.createArray().apply {
            if (frequency > 0) pushMap(observation)
        }
        val params = Arguments.createMap().apply {
            putString("packageName", apiName)
            putString("permissionType", permissionType)
            putInt("accessCount", frequency)
            putDouble("windowStart", (now - 86_400_000L).toDouble())
            putDouble("windowEnd", now.toDouble())
            putString("apiName", apiName)
            putInt("frequency", frequency)
            putString("destination", destination)
            putString("eventType", eventType)
            putDouble("timestamp", now.toDouble())
            putArray("observationEvents", observations)
        }
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("ON_PASSIVE_AUDIT_EVENT", params)
    }

    /** Debug-only test seam. It accepts an already compiler-derived fixture and
     * emits the ordinary bridge event; it cannot run in release builds. */
    @ReactMethod
    fun emitControlledTemporalFixture(payload: String, promise: Promise) {
        if (!BuildConfig.DEBUG) {
            promise.reject("CONTROLLED_FIXTURE_DISABLED", "Controlled fixtures are disabled in release builds.")
            return
        }
        try {
            val fixture = org.json.JSONObject(payload)
            require(fixture.optBoolean("controlledDemo", false))
            require(fixture.optString("evidenceKind") == "CONTROLLED_DEMO")
            require(fixture.optString("source") == "NATIVE_BRIDGE")
            val permission = fixture.getString("permissionType")
            require(permission in setOf("LOCATION", "MICROPHONE", "CONTACTS"))
            val packageName = fixture.getString("packageName")
            require(packageName.matches(Regex("^[A-Za-z0-9_.-]{1,255}$")))
            val events = fixture.getJSONArray("observationEvents")
            require(events.length() in 1..100)
            val eventArray = Arguments.createArray()
            for (index in 0 until events.length()) {
                val source = events.getJSONObject(index)
                val type = source.getString("type")
                require(type in setOf("LOCATION", "MICROPHONE", "CONTACTS", "ACTIVITY_RECOGNITION", "BODY_SENSORS", "CAMERA", "CLIPBOARD_READ", "DEVICE_IDENTIFIER", "MEDIA_IMAGES", "MEDIA_LOCATION", "APP_BACKGROUNDED", "DATA_TRANSFER"))
                val occurredAt = source.getLong("occurredAt")
                require(occurredAt > 0L)
                eventArray.pushMap(Arguments.createMap().apply {
                    putString("type", type)
                    putDouble("occurredAt", occurredAt.toDouble())
                    putInt("count", source.optInt("count", 1))
                    putString("source", "NATIVE_BRIDGE")
                })
            }
            val params = Arguments.createMap().apply {
                putString("packageName", packageName)
                putString("permissionType", permission)
                putInt("accessCount", fixture.optInt("accessCount", 1))
                putDouble("windowStart", fixture.getLong("windowStart").toDouble())
                putDouble("windowEnd", fixture.getLong("windowEnd").toDouble())
                putString("source", "NATIVE_BRIDGE")
                putString("evidenceKind", "CONTROLLED_DEMO")
                putBoolean("controlledDemo", true)
                putArray("observationEvents", eventArray)
            }
            reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java).emit("ON_PASSIVE_AUDIT_EVENT", params)
            promise.resolve(true)
        } catch (error: Exception) {
            promise.reject("INVALID_CONTROLLED_FIXTURE", error.message, error)
        }
    }
}
