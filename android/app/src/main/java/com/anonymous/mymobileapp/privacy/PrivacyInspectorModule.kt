package com.anonymous.mymobileapp.privacy

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.facebook.react.bridge.Arguments

class PrivacyInspectorModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "PrivacyInspector"
    }

    /**
     * 纯被动审计：原生层 AppOpsManager 监察到 API 调用时，单向抛给 JS 层。
     * 无阻塞，不占用主线程，实现最低耗电。
     */
    @ReactMethod
    fun dispatchAuditLog(apiName: String, frequency: Int, destination: String, eventType: String) {
        val params = Arguments.createMap().apply {
            putString("apiName", apiName)
            putInt("frequency", frequency)
            putString("destination", destination)
            putString("eventType", eventType)
            putDouble("timestamp", System.currentTimeMillis().toDouble())
        }
        
        // 异步将监察数据推送到前端合规引擎
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("ON_PASSIVE_AUDIT_EVENT", params)
    }
}
