package com.zhihengzhang.privacylens.privacy

/**
 * Pure, dependency-free mapping rules for the passive audit bridge.
 *
 * These rules previously lived inline inside `PrivacyInspectorModule.dispatchAuditLog`,
 * where they could only be exercised on a device through the React Native bridge.
 * They are the point at which an untrusted native event becomes a typed
 * privacy observation, so they carry the provenance labels the whole evidence
 * pipeline depends on. Extracting them keeps the module responsible for bridge
 * plumbing only and makes the mapping testable on the JVM.
 *
 * No Android or React Native type is referenced here on purpose.
 */
internal object ObservationMapper {

    val SUPPORTED_PERMISSION_TYPES = setOf("LOCATION", "MICROPHONE", "CONTACTS")

    val SUPPORTED_OBSERVATION_TYPES = setOf(
        "LOCATION",
        "MICROPHONE",
        "CONTACTS",
        "ACTIVITY_RECOGNITION",
        "BODY_SENSORS",
        "CAMERA",
        "CLIPBOARD_READ",
        "DEVICE_IDENTIFIER",
        "MEDIA_IMAGES",
        "MEDIA_LOCATION",
        "APP_BACKGROUNDED",
        "DATA_TRANSFER",
    )

    /** Maps a native audit event class to the permission family it belongs to. */
    fun resolvePermissionType(eventType: String): String = when (eventType) {
        "SENSITIVE_LEAK_RISK" -> "MICROPHONE"
        "UNAUTHORIZED_CROSS_BORDER" -> "CONTACTS"
        else -> "LOCATION"
    }

    /**
     * Maps a platform API name to a typed observation.
     *
     * Order is significant because the API name is matched by substring:
     * `MEDIA_LOCATION` must be tested before the broader `MEDIA` rule.
     */
    fun resolveObservationType(apiName: String, destination: String, fallbackPermissionType: String): String {
        val normalizedApi = apiName.uppercase()
        return when {
            "BODY" in normalizedApi || "HEALTH" in normalizedApi -> "BODY_SENSORS"
            "ACTIVITY" in normalizedApi -> "ACTIVITY_RECOGNITION"
            "CAMERA" in normalizedApi -> "CAMERA"
            "CLIPBOARD" in normalizedApi -> "CLIPBOARD_READ"
            "DEVICE" in normalizedApi || "PHONE_STATE" in normalizedApi -> "DEVICE_IDENTIFIER"
            "MEDIA_LOCATION" in normalizedApi -> "MEDIA_LOCATION"
            "MEDIA" in normalizedApi || "IMAGE" in normalizedApi -> "MEDIA_IMAGES"
            "BACKGROUND" in normalizedApi -> "APP_BACKGROUNDED"
            destination != "local" -> "DATA_TRANSFER"
            else -> fallbackPermissionType
        }
    }

    /** Maps a typed observation to the transport channel it was observed through. */
    fun resolveObservationChannel(observationType: String): String = when (observationType) {
        "DATA_TRANSFER" -> "DATA_TRANSFER"
        "APP_BACKGROUNDED" -> "APP_STATE"
        "CLIPBOARD_READ", "DEVICE_IDENTIFIER", "MEDIA_IMAGES", "MEDIA_LOCATION", "CONTACTS" -> "DATA_ACCESS"
        else -> "SENSOR_CALL"
    }

    /** Observations never leave the device when the destination is local. */
    fun resolveDestination(destination: String): String = if (destination == "local") "LOCAL" else "NETWORK"

    private val PACKAGE_NAME = Regex("^[A-Za-z0-9_.-]{1,255}$")

    /** Maximum observation events accepted from a single controlled fixture. */
    const val MAX_CONTROLLED_FIXTURE_EVENTS = 100

    /**
     * Result of validating a debug-only controlled temporal fixture.
     *
     * Validation is separated from `org.json` so that every rejection reason is
     * testable on the JVM; the module keeps parsing and bridge emission.
     */
    sealed interface FixtureValidation {
        data class Valid(val permissionType: String, val packageName: String, val eventTypes: List<String>) : FixtureValidation
        data class Invalid(val reason: String) : FixtureValidation
    }

    /**
     * Validates the provenance labels and bounds a controlled fixture must carry.
     *
     * A controlled fixture is synthetic debug evidence, so it must be explicitly
     * and consistently labelled: it can never be admitted as an observed event.
     */
    fun validateControlledFixture(
        controlledDemo: Boolean,
        evidenceKind: String,
        source: String,
        permissionType: String,
        packageName: String,
        eventTypes: List<String>,
    ): FixtureValidation {
        if (!controlledDemo) return FixtureValidation.Invalid("controlledDemo must be true")
        if (evidenceKind != "CONTROLLED_DEMO") return FixtureValidation.Invalid("evidenceKind must be CONTROLLED_DEMO")
        if (source != "NATIVE_BRIDGE") return FixtureValidation.Invalid("source must be NATIVE_BRIDGE")
        if (permissionType !in SUPPORTED_PERMISSION_TYPES) return FixtureValidation.Invalid("unsupported permissionType")
        if (!PACKAGE_NAME.matches(packageName)) return FixtureValidation.Invalid("invalid packageName")
        if (eventTypes.size !in 1..MAX_CONTROLLED_FIXTURE_EVENTS) return FixtureValidation.Invalid("event count out of range")
        for (type in eventTypes) {
            if (type !in SUPPORTED_OBSERVATION_TYPES) return FixtureValidation.Invalid("unsupported observation type: $type")
        }
        return FixtureValidation.Valid(permissionType, packageName, eventTypes)
    }
}
