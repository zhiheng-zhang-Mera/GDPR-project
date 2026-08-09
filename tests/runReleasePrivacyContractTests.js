/* global __dirname */
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

function read(relative) {
  return fs.readFileSync(path.join(root, relative), 'utf8');
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const packageJson = JSON.parse(read('package.json'));
const appJson = JSON.parse(read('app.json'));
const buildGradle = read('android/app/build.gradle');
const manifest = read('android/app/src/main/AndroidManifest.xml');
const sourceRoots = ['app', 'components', 'src'];

assert(packageJson.version === appJson.expo.version, 'package.json and app.json versions must match.');
assert(buildGradle.includes(`versionName "${packageJson.version}"`), 'Android versionName must match package.json.');
assert(/android\.permission\.INTERNET"\s+tools:node="remove"/.test(manifest), 'Release manifest must explicitly remove INTERNET.');
assert(/android\.permission\.ACCESS_NETWORK_STATE"\s+tools:node="remove"/.test(manifest), 'Release manifest must explicitly remove ACCESS_NETWORK_STATE.');
assert(manifest.includes('android:allowBackup="false"'), 'Android backup must remain disabled for local findings.');
assert(manifest.includes('expo.modules.updates.ENABLED" android:value="false"'), 'Remote Expo updates must remain disabled.');

const sourceFiles = [];
function collect(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) collect(full);
    else if (/\.(?:js|jsx|ts|tsx)$/.test(entry.name)) sourceFiles.push(full);
  }
}
for (const relative of sourceRoots) collect(path.join(root, relative));
const source = sourceFiles.map((file) => fs.readFileSync(file, 'utf8')).join('\n');
assert(!/\bfetch\s*\(|\bXMLHttpRequest\b|\bWebSocket\b|\baxios\b/.test(source), 'Application source introduces a network client while network permissions are denied.');

console.log(`Release privacy contracts passed for version ${packageJson.version} across ${sourceFiles.length} source files.`);
