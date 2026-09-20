package com.zhihengzhang.privacylens.privacy

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * JVM unit tests for the passive-audit bridge mapping rules.
 *
 * These run on the host with `gradlew :app:testDebugUnitTest` and require no
 * emulator or physical device. They cover the point where an untrusted native
 * event becomes a typed privacy observation, which is the provenance boundary
 * the whole evidence pipeline depends on.
 */
class ObservationMapperTest {

    // ---- Permission family mapping -----------------------------------------

    @Test
    fun `event classes map to the permission family they belong to`() {
        assertEquals("MICROPHONE", ObservationMapper.resolvePermissionType("SENSITIVE_LEAK_RISK"))
        assertEquals("CONTACTS", ObservationMapper.resolvePermissionType("UNAUTHORIZED_CROSS_BORDER"))
        assertEquals("LOCATION", ObservationMapper.resolvePermissionType("ANY_OTHER_EVENT"))
        assertEquals("LOCATION", ObservationMapper.resolvePermissionType(""))
    }

    // ---- Observation type mapping ------------------------------------------

    @Test
    fun `api names map to the documented observation type`() {
        val cases = mapOf(
            "android.hardware.Sensor: getBodySensors" to "BODY_SENSORS",
            "health.connect: readHeartRate" to "BODY_SENSORS",
            "android.hardware.Sensor: getActivityRecognition" to "ACTIVITY_RECOGNITION",
            "android.hardware.camera2: openCamera" to "CAMERA",
            "android.content.ClipboardManager: getPrimaryClip" to "CLIPBOARD_READ",
            "android.telephony.TelephonyManager: getDeviceId" to "DEVICE_IDENTIFIER",
            // The rules match uppercase substrings of the API name, so the
            // underscore-delimited platform tokens are what reach them.
            "android.telephony.TelephonyManager: PHONE_STATE" to "DEVICE_IDENTIFIER",
            "android.provider.MediaStore: EXTRA_MEDIA_LOCATION" to "MEDIA_LOCATION",
            "android.provider.MediaStore: readMediaImages" to "MEDIA_IMAGES",
            "android.graphics.Bitmap: decodeImage" to "MEDIA_IMAGES",
            // The background rule is reached only when no earlier rule matches;
            // `ActivityManager` would match ACTIVITY first.
            "android.app.ProcessLifecycleOwner: APP_BACKGROUND" to "APP_BACKGROUNDED",
        )
        for ((apiName, expected) in cases) {
            assertEquals(
                "api name $apiName",
                expected,
                ObservationMapper.resolveObservationType(apiName, "local", "LOCATION"),
            )
        }
    }

    /**
     * Documents the consequence of first-match substring ordering: an API name
     * containing an earlier rule's token is classified by that earlier rule even
     * when a later rule also matches. `ActivityManager...onAppBackgrounded`
     * contains `ACTIVITY`, so it resolves to ACTIVITY_RECOGNITION rather than
     * APP_BACKGROUNDED. This is recorded as observed behaviour, not as a
     * desirable property; changing the order is a behavioural change.
     */
    @Test
    fun `an earlier substring rule wins over a later one`() {
        assertEquals(
            "ACTIVITY_RECOGNITION",
            ObservationMapper.resolveObservationType("android.app.ActivityManager: onAppBackgrounded", "local", "LOCATION"),
        )
        assertEquals(
            "APP_BACKGROUNDED",
            ObservationMapper.resolveObservationType("android.app.ProcessLifecycleOwner: APP_BACKGROUND", "local", "LOCATION"),
        )
    }

    /**
     * Documents a real coverage limit of the substring rules rather than
     * asserting ideal behaviour: a camel-case API name that lacks the
     * underscore-delimited platform token does not reach its specific rule.
     * `getMediaLocation` uppercases to `GETMEDIALOCATION`, which does not
     * contain `MEDIA_LOCATION`, so it falls to the broader `MEDIA` rule.
     * Callers therefore pass platform constants. Changing this mapping is a
     * behavioural change that would require a separate review.
     */
    @Test
    fun `underscore-delimited tokens are required for location-bearing media rules`() {
        assertEquals(
            "MEDIA_LOCATION",
            ObservationMapper.resolveObservationType("MediaStore.EXTRA_MEDIA_LOCATION", "local", "LOCATION"),
        )
        assertEquals(
            "MEDIA_IMAGES",
            ObservationMapper.resolveObservationType("MediaStore: getMediaLocation", "local", "LOCATION"),
        )
    }

    @Test
    fun `api matching is case insensitive`() {
        assertEquals("CAMERA", ObservationMapper.resolveObservationType("android.CAMERA.open", "local", "LOCATION"))
        assertEquals("CAMERA", ObservationMapper.resolveObservationType("android.camera.open", "local", "LOCATION"))
        assertEquals("BODY_SENSORS", ObservationMapper.resolveObservationType("android.body.sensor", "local", "LOCATION"))
    }

    /**
     * Regression guard: `MEDIA_LOCATION` contains `MEDIA`, so reordering the
     * rules would silently downgrade location-bearing media access to a weaker
     * observation type. This is the exact failure a naive refactor introduces.
     */
    @Test
    fun `media location is not downgraded to media images`() {
        val resolved = ObservationMapper.resolveObservationType(
            "android.provider.MediaStore.EXTRA_MEDIA_LOCATION",
            "local",
            "LOCATION",
        )
        assertEquals("MEDIA_LOCATION", resolved)
        assertTrue("MEDIA_LOCATION must not collapse into MEDIA_IMAGES", resolved != "MEDIA_IMAGES")
    }

    @Test
    fun `a non-local destination becomes a data transfer observation`() {
        assertEquals(
            "DATA_TRANSFER",
            ObservationMapper.resolveObservationType("android.app.Service: unknownCall", "network", "LOCATION"),
        )
        assertEquals(
            "DATA_TRANSFER",
            ObservationMapper.resolveObservationType("android.app.Service: unknownCall", "remote", "MICROPHONE"),
        )
    }

    @Test
    fun `a local unmatched api keeps its permission-family fallback`() {
        assertEquals("LOCATION", ObservationMapper.resolveObservationType("android.unknown: call", "local", "LOCATION"))
        assertEquals("MICROPHONE", ObservationMapper.resolveObservationType("android.unknown: call", "local", "MICROPHONE"))
        assertEquals("CONTACTS", ObservationMapper.resolveObservationType("android.unknown: call", "local", "CONTACTS"))
    }

    @Test
    fun `a specific api match outranks the destination fallback`() {
        // A camera call that also leaves the device must stay a camera
        // observation; the destination is carried separately.
        assertEquals(
            "CAMERA",
            ObservationMapper.resolveObservationType("android.hardware.camera2: openCamera", "network", "LOCATION"),
        )
    }

    // ---- Channel mapping ---------------------------------------------------

    @Test
    fun `observation type maps to the transport channel it was observed through`() {
        assertEquals("DATA_TRANSFER", ObservationMapper.resolveObservationChannel("DATA_TRANSFER"))
        assertEquals("APP_STATE", ObservationMapper.resolveObservationChannel("APP_BACKGROUNDED"))
        for (type in listOf("CLIPBOARD_READ", "DEVICE_IDENTIFIER", "MEDIA_IMAGES", "MEDIA_LOCATION", "CONTACTS")) {
            assertEquals("DATA_ACCESS", ObservationMapper.resolveObservationChannel(type))
        }
        for (type in listOf("LOCATION", "MICROPHONE", "CAMERA", "BODY_SENSORS", "ACTIVITY_RECOGNITION")) {
            assertEquals("SENSOR_CALL", ObservationMapper.resolveObservationChannel(type))
        }
    }

    @Test
    fun `every supported observation type resolves to a supported channel`() {
        val channels = setOf("SENSOR_CALL", "DATA_ACCESS", "DATA_TRANSFER", "APP_STATE")
        for (type in ObservationMapper.SUPPORTED_OBSERVATION_TYPES) {
            val channel = ObservationMapper.resolveObservationChannel(type)
            assertTrue("$type resolved to unknown channel $channel", channel in channels)
        }
    }

    @Test
    fun `resolveDestination normalises only the exact local value`() {
        assertEquals("LOCAL", ObservationMapper.resolveDestination("local"))
        assertEquals("NETWORK", ObservationMapper.resolveDestination("network"))
        assertEquals("NETWORK", ObservationMapper.resolveDestination("LOCAL"))
        assertEquals("NETWORK", ObservationMapper.resolveDestination(""))
    }

    // ---- Supported sets ----------------------------------------------------

    @Test
    fun `the mapping only emits types the engine admits`() {
        val apiNames = listOf(
            "android.CAMERA.open", "android.CLIPBOARD.read", "android.DEVICE.id",
            "android.PHONE_STATE.read", "android.MEDIA_LOCATION.read", "android.MEDIA.read",
            "android.IMAGE.read", "android.BACKGROUND.enter", "android.ACTIVITY.read",
            "android.BODY.read", "android.HEALTH.read", "android.unknown.call",
        )
        for (apiName in apiNames) {
            for (destination in listOf("local", "network")) {
                val type = ObservationMapper.resolveObservationType(apiName, destination, "LOCATION")
                assertTrue(
                    "$apiName/$destination produced unsupported type $type",
                    type in ObservationMapper.SUPPORTED_OBSERVATION_TYPES,
                )
            }
        }
    }

    @Test
    fun `the three sensitive permission families remain the admitted set`() {
        assertEquals(setOf("LOCATION", "MICROPHONE", "CONTACTS"), ObservationMapper.SUPPORTED_PERMISSION_TYPES)
    }

    // ---- Controlled-fixture validation -------------------------------------

    private fun validate(
        controlledDemo: Boolean = true,
        evidenceKind: String = "CONTROLLED_DEMO",
        source: String = "NATIVE_BRIDGE",
        permissionType: String = "LOCATION",
        packageName: String = "com.zhihengzhang.privacylens.controlled-demo",
        eventTypes: List<String> = listOf("LOCATION", "BODY_SENSORS", "ACTIVITY_RECOGNITION"),
    ) = ObservationMapper.validateControlledFixture(
        controlledDemo, evidenceKind, source, permissionType, packageName, eventTypes,
    )

    @Test
    fun `a correctly labelled controlled fixture validates`() {
        val result = validate()
        assertTrue("expected a valid fixture but got $result", result is ObservationMapper.FixtureValidation.Valid)
        result as ObservationMapper.FixtureValidation.Valid
        assertEquals("LOCATION", result.permissionType)
        assertEquals(3, result.eventTypes.size)
    }

    @Test
    fun `an unlabelled fixture is rejected so synthetic evidence cannot pass as observed`() {
        assertTrue(validate(controlledDemo = false) is ObservationMapper.FixtureValidation.Invalid)
    }

    @Test
    fun `an inconsistent evidence kind is rejected`() {
        assertTrue(validate(evidenceKind = "OBSERVED") is ObservationMapper.FixtureValidation.Invalid)
        assertTrue(validate(evidenceKind = "") is ObservationMapper.FixtureValidation.Invalid)
    }

    @Test
    fun `a fixture that does not declare the native bridge is rejected`() {
        assertTrue(validate(source = "IMPORTED") is ObservationMapper.FixtureValidation.Invalid)
        assertTrue(validate(source = "SIMULATOR") is ObservationMapper.FixtureValidation.Invalid)
    }

    @Test
    fun `an unsupported permission family is rejected`() {
        assertTrue(validate(permissionType = "CAMERA") is ObservationMapper.FixtureValidation.Invalid)
        assertTrue(validate(permissionType = "") is ObservationMapper.FixtureValidation.Invalid)
    }

    @Test
    fun `a malformed package name is rejected`() {
        for (packageName in listOf("", "has space", "semi;colon", "a".repeat(256), "../escape")) {
            assertTrue(
                "package name $packageName must be rejected",
                validate(packageName = packageName) is ObservationMapper.FixtureValidation.Invalid,
            )
        }
    }

    @Test
    fun `the accepted package name shape is preserved`() {
        val allowed = listOf("a", "com.example.app", "com.example-app", "com.example_app", "a.b.c-D_1")
        for (packageName in allowed) {
            assertTrue(
                "package name $packageName must be accepted",
                validate(packageName = packageName) is ObservationMapper.FixtureValidation.Valid,
            )
        }
    }

    @Test
    fun `an empty fixture and an oversized fixture are both rejected`() {
        assertTrue(validate(eventTypes = emptyList()) is ObservationMapper.FixtureValidation.Invalid)
        assertTrue(
            validate(eventTypes = List(ObservationMapper.MAX_CONTROLLED_FIXTURE_EVENTS + 1) { "LOCATION" })
                is ObservationMapper.FixtureValidation.Invalid,
        )
        assertTrue(
            validate(eventTypes = List(ObservationMapper.MAX_CONTROLLED_FIXTURE_EVENTS) { "LOCATION" })
                is ObservationMapper.FixtureValidation.Valid,
        )
    }

    @Test
    fun `an unsupported observation type is rejected`() {
        assertTrue(validate(eventTypes = listOf("LOCATION", "NOT_A_REAL_TYPE")) is ObservationMapper.FixtureValidation.Invalid)
    }

    @Test
    fun `every rejection carries a non-empty reason`() {
        val rejections = listOf(
            validate(controlledDemo = false),
            validate(evidenceKind = "OBSERVED"),
            validate(source = "IMPORTED"),
            validate(permissionType = "CAMERA"),
            validate(packageName = ""),
            validate(eventTypes = emptyList()),
            validate(eventTypes = listOf("NOPE")),
        )
        for (rejection in rejections) {
            assertTrue(rejection is ObservationMapper.FixtureValidation.Invalid)
            rejection as ObservationMapper.FixtureValidation.Invalid
            assertTrue("rejection reason must not be blank", rejection.reason.isNotBlank())
        }
    }
}
