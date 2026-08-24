#!/usr/bin/env node
/* Converts FlowDroid XML findings into a portable typed graph; it never adds a legal verdict. */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const args = process.argv.slice(2);
const value = (flag) => { const index = args.indexOf(flag); return index < 0 ? undefined : args[index + 1]; };
const input = value('--input'); const output = value('--output');
const receipt = value('--receipt');
const processId = value('--process-id') || 'UNKNOWN_STATIC_PROCESS';
if (!input || !output) throw new Error('Usage: node scripts/convert-flowdroid-results-to-information-flow.js --input <flowdroid-results.xml> --output <typed-flow.json> [--process-id <id>]');
if (!fs.existsSync(input)) throw new Error(`Input is unavailable: ${input}`);

const decode = (text) => text.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
const attribute = (tag, name) => {
  const match = tag.match(new RegExp(`${name}="([^"]*)"`));
  return match ? decode(match[1]) : undefined;
};
const sourceCategory = (definition = '') => {
  if (/get(DeviceId|Imei|Meid|Line1Number|SubscriberId)\s*\(/i.test(definition)) return 'DEVICE_IDENTIFIER';
  if (/get(LastKnown)?Location\s*\(|LocationManager/i.test(definition)) return 'LOCATION';
  if (/ContactsContract|\.getContacts\s*\(/i.test(definition)) return 'CONTACTS';
  if (/Camera(Manager)?\b|openCamera\s*\(/i.test(definition)) return 'CAMERA';
  if (/AudioRecord\b|MediaRecorder\b|getAudioSource\s*\(/i.test(definition)) return 'MICROPHONE';
  if (/SensorManager\b|TYPE_(HEART_RATE|STEP_COUNTER|STEP_DETECTOR)/i.test(definition)) return 'BODY_SENSORS';
  return undefined;
};
const sinkCategory = (definition = '') => {
  if (/SmsManager.*send(Text|Data|MultipartText)Message/i.test(definition)) return 'SMS';
  if (/HttpURLConnection|okhttp|java\.net\.(URL|Socket)|WebView.*loadUrl/i.test(definition)) return 'NETWORK';
  if (/start(Activity|Service)|sendBroadcast|bindService|ContentResolver/i.test(definition)) return 'IPC';
  if (/FileOutputStream|FileWriter|openFileOutput/i.test(definition)) return 'FILE';
  if (/android\.util\.Log/i.test(definition)) return 'LOG';
  return undefined;
};
const xml = fs.readFileSync(input, 'utf8');
const sha256 = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');
const resultBlocks = [...xml.matchAll(/<Result>([\s\S]*?)<\/Result>/g)].map((match) => match[1]);
if (resultBlocks.length === 0 && !/<DataFlowResults\b/.test(xml)) throw new Error('Input is not a FlowDroid results document.');
const nodes = []; const edges = []; const unmappedResults = [];
for (const [index, block] of resultBlocks.entries()) {
  const sinkTag = block.match(/<Sink\b[^>]*>/)?.[0];
  const sourceTags = [...block.matchAll(/<Source\b[^>]*>/g)].map((match) => match[0]);
  const sinkDefinition = sinkTag && attribute(sinkTag, 'MethodSourceSinkDefinition');
  const sink = sinkCategory(sinkDefinition);
  if (!sinkTag || !sink) {
    unmappedResults.push({ resultIndex: index, reason: 'UNSUPPORTED_OR_MISSING_SINK', sinkDefinition });
    continue;
  }
  for (const [sourceIndex, sourceTag] of sourceTags.entries()) {
    const sourceDefinition = attribute(sourceTag, 'MethodSourceSinkDefinition');
    const source = sourceCategory(sourceDefinition);
    if (!source) {
      unmappedResults.push({ resultIndex: index, sourceIndex, reason: 'UNSUPPORTED_OR_MISSING_SOURCE', sourceDefinition, sinkDefinition });
      continue;
    }
    const prefix = `flow_${index}_source_${sourceIndex}`;
    const sourceId = `${prefix}_source`; const sinkId = `${prefix}_sink`;
    nodes.push({ id: sourceId, processId, source, provenance: { kind: 'FLOWDROID_METHOD_DEFINITION', definition: sourceDefinition } });
    nodes.push({ id: sinkId, processId, sink, provenance: { kind: 'FLOWDROID_METHOD_DEFINITION', definition: sinkDefinition } });
    edges.push({ from: sourceId, to: sinkId, mechanism: 'DIRECT', provenance: 'FLOWDROID_POTENTIAL_STATIC_FLOW' });
  }
}
const typed = {
  schema: 'privacy-lens.flowdroid-information-flow-graph.v1',
  evidenceKind: 'STATIC_ANALYSIS',
  sourceTool: 'FlowDroid',
  provenance: {
    inputXmlSha256: sha256(Buffer.from(xml, 'utf8')),
    sourceReceiptPath: receipt || null,
    sourceReceiptSha256: receipt ? sha256(fs.readFileSync(receipt)) : null,
  },
  nodes, edges, unmappedResults,
  caveat: 'Nodes represent only FlowDroid potential static source-to-sink results whose method definitions map to the public typed vocabulary. UNKNOWN_STATIC_PROCESS is not evidence of a process boundary. This conversion neither executes an APK nor establishes a transfer, recipient, processing purpose, lawful basis, or GDPR infringement.',
};
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(typed, null, 2)}\n`);
console.log(`Converted ${nodes.length / 2} typed FlowDroid potential flows; unmapped=${unmappedResults.length}.`);
