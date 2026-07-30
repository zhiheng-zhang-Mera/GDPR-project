package com.anonymous.mymobileapp.privacy

import androidx.work.Data
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
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
        }
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("ON_PASSIVE_AUDIT_EVENT", params)
    }
}
