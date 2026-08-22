#!/usr/bin/env node
/* Runs the official FlowDroid CLI and records an immutable, bounded run receipt. */
const { createHash } = require('crypto');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
function value(flag) { const index = args.indexOf(flag); return index < 0 ? undefined : args[index + 1]; }
const apk = value('--apk');
const outputDir = value('--output-dir');
const jar = process.env.FLOWDROID_JAR || path.join(root, '.codex-tools', 'flowdroid', 'soot-infoflow-cmd-2.15.1.jar');
const platforms = process.env.ANDROID_PLATFORMS || 'C:\\Users\\15601\\AppData\\Local\\Android\\Sdk\\platforms';
const definitions = value('--sources-sinks') || path.join(root, 'experiments', 'baselines', 'flowdroid', 'SourcesAndSinks.txt');
if (!apk || !outputDir) throw new Error('Usage: node scripts/run-flowdroid-baseline.js --apk <file.apk> --output-dir <directory> [--sources-sinks <file>]');
for (const required of [apk, jar, platforms, definitions]) if (!fs.existsSync(required)) throw new Error(`Required input is unavailable: ${required}`);
fs.mkdirSync(outputDir, { recursive: true });
const xml = path.join(outputDir, 'flowdroid-results.xml');
const startedAt = new Date().toISOString();
const started = performance.now();
let stdout = ''; let stderr = ''; let exitCode = 0; let timedOut = false;
try {
  stdout = execFileSync('java', ['-Xmx4g', '-jar', jar, '-a', apk, '-p', platforms, '-s', definitions, '-o', xml, '-r', '-dt', '120', '-ct', '60', '-rt', '30', '-mt', '2'], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'], timeout: 240_000 });
} catch (error) {
  exitCode = typeof error.status === 'number' ? error.status : 1;
  timedOut = error?.code === 'ETIMEDOUT' || error?.signal === 'SIGTERM';
  stdout = error.stdout?.toString() ?? '';
  stderr = error.stderr?.toString() ?? error.message;
}
const elapsedMs = performance.now() - started;
const digest = (file) => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const xmlText = fs.existsSync(xml) ? fs.readFileSync(xml, 'utf8') : '';
const receipt = {
  schema: 'privacy-lens.flowdroid-baseline.v1',
  tool: { name: 'FlowDroid', version: '2.15.1', jarSha256: digest(jar) },
  startedAt,
  elapsedMs: Number(elapsedMs.toFixed(3)),
  apk: { sha256: digest(apk), byteLength: fs.statSync(apk).size },
  sourcesAndSinksSha256: digest(definitions),
  androidPlatformsDirectory: platforms,
  command: { reflectionEnabled: true, mainTimeoutSeconds: 120, callbackTimeoutSeconds: 60, resultTimeoutSeconds: 30, outerProcessTimeoutSeconds: 240, maxThreads: 2 },
  status: timedOut ? 'FAILED_OR_TIMED_OUT' : exitCode !== 0 ? 'FAILED_OR_TIMED_OUT' : fs.existsSync(xml) ? 'COMPLETED' : 'COMPLETED_NO_RESULT_ARTIFACT',
  exitCode,
  resultCount: fs.existsSync(xml) ? (xmlText.match(/<Result>/g) ?? []).length : undefined,
  resultSha256: fs.existsSync(xml) ? digest(xml) : undefined,
  caveat: 'FlowDroid reports potential static source-to-sink paths under the supplied source/sink definition. A completed invocation without an XML artifact is not interpreted as zero flows. No output proves runtime execution, recipient identity, data transfer, or GDPR infringement.',
};
fs.writeFileSync(path.join(outputDir, 'flowdroid-receipt.json'), `${JSON.stringify(receipt, null, 2)}\n`);
fs.writeFileSync(path.join(outputDir, 'flowdroid-stdout.txt'), stdout);
fs.writeFileSync(path.join(outputDir, 'flowdroid-stderr.txt'), stderr);
console.log(JSON.stringify(receipt));
process.exitCode = exitCode;
