#!/usr/bin/env node
/* Dismisses only a deny button for notification prompts belonging to the supplied authorised corpus. */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const value = (flag) => { const index = args.indexOf(flag); return index < 0 ? undefined : args[index + 1]; };
const serial = value('--serial'); const catalogPath = value('--catalog'); const output = value('--output'); const durationSeconds = Number(value('--duration-seconds') || 3600);
if (!serial || !catalogPath || !output || !Number.isInteger(durationSeconds) || durationSeconds < 1 || durationSeconds > 7200) throw new Error('Usage: node scripts/dismiss-authorized-notification-prompts.js --serial <adb-serial> --catalog <catalog.json> --output <dismissals.json> [--duration-seconds 1..7200]');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
if (catalog?.schema !== 'privacy-lens.android-store-corpus.v1' || !Array.isArray(catalog.apps)) throw new Error('An authorised corpus catalog is required.');
const authorisedNames = new Set(catalog.apps.flatMap((app) => [app.displayName, app.packageName]).filter((value) => typeof value === 'string' && value.trim()));
const adb = (argumentsList, timeout = 20_000) => execFileSync('adb', ['-s', serial, ...argumentsList], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout }).trim();
const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const attributes = (node) => Object.fromEntries([...node.matchAll(/([\w:-]+)="([^"]*)"/g)].map((match) => [match[1], match[2]]));
const report = { schema: 'privacy-lens.authorised-notification-prompt-dismissals.v1', serial, startedAt: new Date().toISOString(), catalogId: catalog.corpusId, dismissals: [], caveat: 'Only the exact Oplus notification-manager denial button is eligible. The watcher never presses an allow/grant button and only accepts titles matching an application in the supplied authorised catalog.' };
async function inspectAndDismiss() {
  let xml;
  try { xml = adb(['exec-out', 'uiautomator', 'dump', '/dev/tty']); } catch { return; }
  if (!xml.includes('package="com.oplus.notificationmanager"')) return;
  const nodes = (xml.match(/<node\b[^>]*>/g) ?? []).map(attributes);
  const title = nodes.find((node) => node['resource-id'] === 'com.oplus.notificationmanager:id/alertTitle')?.text || '';
  const quotedName = /(?:允许|Allow)[“"]?(.+?)[”"]?(?:发送通知| to send you notifications)/.exec(title)?.[1]?.trim();
  if (!quotedName || !authorisedNames.has(quotedName)) return;
  const deny = nodes.find((node) => node['resource-id'] === 'android:id/button2' && ['拒绝', 'Deny', "Don't allow", 'Don’t allow'].includes(node.text) && /^\[\d+,\d+\]\[\d+,\d+\]$/.test(node.bounds || ''));
  const bounds = deny?.bounds?.match(/^\[(\d+),(\d+)\]\[(\d+),(\d+)\]$/);
  if (!bounds) return;
  const x = Math.round((Number(bounds[1]) + Number(bounds[3])) / 2); const y = Math.round((Number(bounds[2]) + Number(bounds[4])) / 2);
  adb(['shell', 'input', 'tap', String(x), String(y)]);
  report.dismissals.push({ at: new Date().toISOString(), app: quotedName, action: 'DENY_NOTIFICATION_PERMISSION' });
  fs.mkdirSync(path.dirname(output), { recursive: true }); fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
}
(async () => {
  const deadline = Date.now() + durationSeconds * 1_000;
  while (Date.now() < deadline) { await inspectAndDismiss(); await sleep(750); }
  report.completedAt = new Date().toISOString(); fs.mkdirSync(path.dirname(output), { recursive: true }); fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`Dismissed ${report.dismissals.length} authorised notification prompts without granting permissions.`);
})().catch((error) => { process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`); process.exitCode = 1; });
