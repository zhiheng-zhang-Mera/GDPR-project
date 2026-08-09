package com.zhihengzhang.privacylens.privacy

import android.app.AppOpsManager
import android.content.Context
import android.os.Build
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import org.json.JSONArray
import org.json.JSONObject

/**
 * Low-frequency, read-only audit. The worker never blocks or changes another app's data flow.
 *
 * Android exposes full access-count history only to privileged/device-owner builds on many OEM
 * devices. We therefore record capability and last-access evidence and let the JS compliance
 * engine evaluate counts when historical data is available from a compatible build.
 */
class PermissionAuditWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {
    override suspend fun doWork(): Result {
        val manager = applicationContext.getSystemService(AppOpsManager::class.java)
            ?: return Result.retry()
        val packageName = applicationContext.packageName
        val uid = applicationContext.applicationInfo.uid
        val operations = listOf(
            AppOpsManager.OPSTR_FINE_LOCATION to "LOCATION",
            AppOpsManager.OPSTR_RECORD_AUDIO to "MICROPHONE",
            AppOpsManager.OPSTR_READ_CONTACTS to "CONTACTS"
        )
        val findings = JSONArray()

        operations.forEach { (operation, permission) ->
            val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                manager.unsafeCheckOpNoThrow(operation, uid, packageName)
            } else {
                @Suppress("DEPRECATION")
                manager.checkOpNoThrow(operation, uid, packageName)
            }
            findings.put(
                JSONObject()
                    .put("packageName", packageName)
                    .put("permissionType", permission)
                    .put("mode", mode)
                    .put("auditedAt", System.currentTimeMillis())
                    .put("historicalAccessSupported", Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q)
            )
        }

        applicationContext.getSharedPreferences("gdpr_audit", Context.MODE_PRIVATE)
            .edit()
            .putString("latest_capability_audit", findings.toString())
            .putLong("last_audit_at", System.currentTimeMillis())
            .apply()
        return Result.success()
    }
}
