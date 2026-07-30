package com.anonymous.mymobileapp.privacy

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class PrivacyInspectorPackage : ReactPackage {
    override fun createNativeModules(context: ReactApplicationContext): List<NativeModule> =
        listOf(PrivacyInspectorModule(context))

    override fun createViewManagers(
        context: ReactApplicationContext
    ): List<ViewManager<*, *>> = emptyList()
}
