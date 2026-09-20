'use strict';
/**
 * Resolves Android SDK tool paths for the offline analysis scripts.
 *
 * The recorded corpus runs were executed on a Windows host whose SDK lived at a
 * fixed absolute path. That path was written into several scripts as a literal
 * fallback, which made them non-portable and leaked a machine-specific location
 * into the repository.
 *
 * Resolution order is now:
 *   1. an explicit CLI flag supplied by the caller;
 *   2. `ANDROID_HOME`, then `ANDROID_SDK_ROOT`;
 *   3. a conventional per-platform default.
 *
 * Nothing here changes what the scripts do; it only changes where they look for
 * the tools when the caller has not said.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

/** Best-effort SDK root from the environment, or null when none is set. */
function sdkRoot() {
  return process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT || null;
}

/** Conventional default SDK locations per platform. */
function defaultSdkRoots() {
  const home = os.homedir();
  if (process.platform === 'win32') {
    return [
      path.join(process.env.LOCALAPPDATA || path.join(home, 'AppData', 'Local'), 'Android', 'Sdk'),
      path.join(home, 'AppData', 'Local', 'Android', 'Sdk'),
    ];
  }
  if (process.platform === 'darwin') return [path.join(home, 'Library', 'Android', 'sdk')];
  return [path.join(home, 'Android', 'Sdk'), '/usr/lib/android-sdk'];
}

/**
 * Returns the first existing candidate for a tool, or the SDK-derived path when
 * nothing exists yet so the caller still produces a meaningful error message.
 */
function resolveSdkTool(relativePath, explicit) {
  if (explicit) return explicit;
  const roots = [sdkRoot(), ...defaultSdkRoots()].filter(Boolean);
  for (const root of roots) {
    const candidate = path.join(root, relativePath);
    if (fs.existsSync(candidate)) return candidate;
  }
  return roots.length ? path.join(roots[0], relativePath) : relativePath;
}

/** Resolves a tool from the SDK `build-tools/<version>` directory. */
function resolveBuildTool(fileName, explicit, version = '36.0.0') {
  return resolveSdkTool(path.join('build-tools', version, fileName), explicit);
}

/** Resolves a command-line-tools asset by SDK-relative path. */
function resolveCmdlineTool(relativePath, explicit) {
  return resolveSdkTool(path.join('cmdline-tools', 'latest', relativePath), explicit);
}

/** Resolves an SDK-relative directory such as `platforms`. */
function resolveSdkDirectory(relativePath, explicit) {
  return resolveSdkTool(relativePath, explicit);
}

module.exports = { sdkRoot, resolveSdkTool, resolveBuildTool, resolveCmdlineTool, resolveSdkDirectory };
