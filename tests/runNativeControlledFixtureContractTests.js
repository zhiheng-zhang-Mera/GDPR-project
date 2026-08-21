/* global __dirname */
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const nativeModule = fs.readFileSync(path.join(root, 'android/app/src/main/java/com/zhihengzhang/privacylens/privacy/PrivacyInspectorModule.kt'), 'utf8');
const bridge = fs.readFileSync(path.join(root, 'src/services/PrivacyBridge.ts'), 'utf8');
const context = fs.readFileSync(path.join(root, 'src/context/PrivacyContext.tsx'), 'utf8');

function assert(condition, message) { if (!condition) throw new Error(message); }

assert(nativeModule.includes('fun emitControlledTemporalFixture') && nativeModule.includes('if (!BuildConfig.DEBUG)'), 'The controlled native fixture must be explicitly debug-gated.');
assert(nativeModule.includes('"CONTROLLED_DEMO"') && nativeModule.includes('"NATIVE_BRIDGE"'), 'The native fixture must preserve controlled provenance labels.');
assert(bridge.includes('typeof __DEV__') && bridge.includes('runControlledTemporalFixture'), 'The JavaScript bridge must refuse the fixture outside debug Android.');
assert(context.includes('createControlledTemporalFixture(selectedPack)') && context.includes('runControlledTemporalDemo'), 'The UI orchestration must compile a fixture from the active pack and wait for the native bridge.');
console.log('Debug-only controlled native fixture contract passed.');
