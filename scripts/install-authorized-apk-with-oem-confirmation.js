#!/usr/bin/env node
/*
 * Installs only caller-supplied, already digest-verified APKs. Some OPPO
 * builds put ADB installation behind a visible confirmation page. This helper
 * accepts only the exact page/action shown by that installer and declines the
 * optional setting change that enables enhanced installation protection.
 */
const { execFileSync, spawn, spawnSync } = require('child_process');

const args = process.argv.slice(2);
const value = (flag) => { const index = args.indexOf(flag); return index < 0 ? undefined : args[index + 1]; };
const serial = value('--serial');
const apkIndex = args.indexOf('--apk');
const apks = apkIndex < 0 ? [] : args.slice(apkIndex + 1);
const installTimeoutMs = Number(value('--timeout-ms') || 75_000);
if (!serial || apks.length === 0 || !Number.isFinite(installTimeoutMs) || installTimeoutMs < 30_000 || installTimeoutMs > 120_000) throw new Error('Usage: node scripts/install-authorized-apk-with-oem-confirmation.js --serial <adb-serial> --apk <verified.apk> [additional-split.apk...] [--timeout-ms 30000..120000]');

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const attribute = (node, name) => (new RegExp(`${name}="([^"]*)"`).exec(node) ?? [])[1];
const oplusNodes = (xml) => xml.includes('package="com.oplus.appdetail"') ? (xml.match(/<node\b[^>]*>/g) ?? []) : [];
const buttonCenter = (xml, predicate) => {
  const node = oplusNodes(xml).find((candidate) => predicate({ text: attribute(candidate, 'text'), id: attribute(candidate, 'resource-id'), bounds: attribute(candidate, 'bounds') }));
  const match = node && /\[(\d+),(\d+)\]\[(\d+),(\d+)\]/.exec(attribute(node, 'bounds'));
  return match ? { x: Math.round((Number(match[1]) + Number(match[3])) / 2), y: Math.round((Number(match[2]) + Number(match[4])) / 2) } : undefined;
};
function adb(argumentsList, timeout = 5_000) {
  return execFileSync('adb', ['-s', serial, ...argumentsList], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout }).trim();
}
function currentUi() {
  try {
    // OPPO emits the XML on stderr on some builds despite `exec-out`; retain
    // both streams so confirmation detection is not shell-dependent.
    const result = spawnSync('adb', ['-s', serial, 'exec-out', 'uiautomator', 'dump', '/dev/tty'], { encoding: 'utf8', timeout: 20_000 });
    return `${result.stdout ?? ''}${result.stderr ?? ''}`;
  } catch { return ''; }
}
function tap(center) { adb(['shell', 'input', 'tap', String(center.x), String(center.y)]); }
async function handleOplusPage(counters) {
  const xml = currentUi();
  const continueInstall = buttonCenter(xml, ({ id, text }) => id === 'com.oplus.appdetail:id/btn_left' && (text === '继续安装' || text === 'Continue install'));
  if (continueInstall) { tap(continueInstall); counters.continueInstall += 1; return true; }
  const cancelEnhancedProtection = xml.includes('安装增强防护') && buttonCenter(xml, ({ id, text }) => id === 'android:id/button2' && (text === '取消' || text === 'Cancel'));
  if (cancelEnhancedProtection) { tap(cancelEnhancedProtection); counters.optionalProtectionCancelled += 1; return true; }
  const finishInstaller = buttonCenter(xml, ({ id, text }) => id === 'com.oplus.appdetail:id/done_button' && (text === '完成' || text === 'Done'));
  if (finishInstaller) { tap(finishInstaller); counters.installerCompleted += 1; return true; }
  return false;
}
async function main() {
  const install = apks.length === 1 ? ['install', '-r', apks[0]] : ['install-multiple', '-r', ...apks];
  const child = spawn('adb', ['-s', serial, ...install], { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
  const counters = { continueInstall: 0, optionalProtectionCancelled: 0, installerCompleted: 0 };
  let stdout = ''; let stderr = '';
  child.stdout.on('data', (chunk) => { stdout += chunk; });
  child.stderr.on('data', (chunk) => { stderr += chunk; });
  const started = Date.now();
  while (child.exitCode === null || child.exitCode === undefined) {
    if (Date.now() - started > installTimeoutMs) { child.kill(); throw new Error(`ADB install timed out after ${installTimeoutMs} ms.`); }
    // Package-manager rejection usually arrives before any OEM UI exists.
    // Avoid a slow UI dump for that terminal path.
    await sleep(750);
    if (child.exitCode !== null && child.exitCode !== undefined) break;
    await handleOplusPage(counters);
  }
  // Once ADB has returned, the parent owns force-stop and uninstall. Do not
  // poll a cosmetic completion page: this OEM can block that UI query while
  // the package is already installed and would serialize the full corpus.
  if (child.exitCode !== 0) throw new Error(`ADB installation failed (${child.exitCode}): ${stderr || stdout}`);
  process.stdout.write(`${JSON.stringify({ schema: 'privacy-lens.oem-install.v1', oemPrompts: counters, stdout: stdout.trim() })}\n`);
}
main().catch((error) => { process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`); process.exitCode = 1; });
