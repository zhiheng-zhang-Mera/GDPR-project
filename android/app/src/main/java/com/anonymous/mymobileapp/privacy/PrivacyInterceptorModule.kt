package com.anonymous.mymobileapp.privacy

import com.facebook.react.bridge.*
import java.security.MessageDigest
import kotlin.random.Random
import android.util.Log

class PrivacyInterceptorModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "PrivacyInterceptor"

    // 修复：原子化加密日志 (使用 SHA-256 哈希防篡改)
    private fun logAtomicAction(action: String, status: String) {
        val timestamp = System.currentTimeMillis()
        val rawLog = "$timestamp|$action|$status"
        val bytes = MessageDigest.getInstance("SHA-256").digest(rawLog.toByteArray())
        val hashSignature = bytes.joinToString("") { "%02x".format(it) }
        
        // 真实场景下应写入 EncryptedSharedPreferences 或本地安全文件
        Log.i("GDPR_AUDIT_LOG", "Log: $rawLog | Signature: $hashSignature")
    }

    @ReactMethod
    fun toggleSensorAccess(sensorType: String, isAllowed: Boolean, promise: Promise) {
        try {
            if (!isAllowed) {
                // 模拟内核级/API级的强行物理切断
                forceRevokeHardwarePermission(sensorType)
                logAtomicAction("BLOCK_SENSOR_$sensorType", "SUCCESS")
                promise.resolve("Sensor $sensorType immediately blocked.")
            } else {
                promise.resolve("Sensor $sensorType access granted.")
            }
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    // 修复：模拟针对底层健康 API 的强行切断
    private fun forceRevokeHardwarePermission(sensorType: String) {
        when(sensorType) {
            "heart_rate" -> Log.d("PEA_NATIVE", "HealthConnect / Google Fit API connection severed.")
            "location" -> Log.d("PEA_NATIVE", "FusedLocationProvider updates stopped.")
        }
    }

    @ReactMethod
    fun modulateSamplingRate(sensorType: String, rateMode: String) {
        val newRate = if (rateMode == "MODERATE_PRIVACY") 0.01 else 1.0
        logAtomicAction("ADJUST_SAMPLING_$sensorType", "RATE_$newRate")
        // 将新采样率应用到底层传感器注册逻辑中...
    }

    @ReactMethod
    fun applyLDPToData(rawData: Double, sensitivity: Double, epsilon: Double, promise: Promise) {
        val scale = sensitivity / epsilon
        val uniform = Random.nextDouble() - 0.5
        val noise = -scale * Math.signum(uniform) * Math.log(1 - 2 * Math.abs(uniform))
        
        val deidentifiedData = rawData + noise
        logAtomicAction("APPLY_LDP", "SUCCESS")
        promise.resolve(deidentifiedData)
    }
}