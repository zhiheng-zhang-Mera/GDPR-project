const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const stable = (value) => `${JSON.stringify(value, null, 2)}\n`;
const quantile = (sorted, q) => {
  if (!sorted.length) return null;
  const i = (sorted.length - 1) * q;
  const lo = Math.floor(i), hi = Math.ceil(i);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo);
};
const stats = (values) => {
  const x = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!x.length) return { observedN: 0, mean: null, sd: null, median: null, q1: null, q3: null, iqr: null, p95: null, min: null, max: null };
  const mean = x.reduce((a, b) => a + b, 0) / x.length;
  const sd = x.length > 1 ? Math.sqrt(x.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (x.length - 1)) : 0;
  const q1 = quantile(x, .25), q3 = quantile(x, .75);
  return { observedN: x.length, mean, sd, median: quantile(x, .5), q1, q3, iqr: q3 - q1, p95: quantile(x, .95), min: x[0], max: x.at(-1) };
};
const census = read('testing-report/fdroid-open-store-2026-08-22/dex-manifest-census-verified-final-495.json');
const device = read('experiments/thesis-results/device-metrics-redacted.json');
const flow = read('testing-report/academic-baseline-2026-08-22/flowdroid-wps-rerun/flowdroid-receipt.json');
const count = (fn) => census.apps.filter(fn).length;
const fdroid = { schema:'privacy-lens.fdroid-summary.v1', corpusKind:census.corpusKind, corpusId:census.corpusId, selectedN:census.apps.length, staticCompletedN:census.apps.length, sensitivePermissionN:count(a=>a.sensitiveCategories.length>0), sensitiveAndNetworkN:count(a=>a.sensitiveCategories.length>0&&a.hasNetwork), sensitiveAndBackgroundN:count(a=>a.sensitiveCategories.length>0&&a.backgroundSignals.length>0), multiProcessN:count(a=>a.multiprocessDeclared), caveat:'Purposively selected hash-pinned open-source app-store corpus; not an Android population or legal-ground-truth sample.' };
const statuses = Object.fromEntries([...new Set(device.samples.map(x=>x.terminalStatus))].sort().map(s=>[s,device.samples.filter(x=>x.terminalStatus===s).length]));
const deviceSummary = { schema:'privacy-lens.device-summary.v1', eligibleN:device.samples.length, terminalStatuses:statuses, completedN:statuses.COMPLETED||0, memoryPssKb:stats(device.samples.map(x=>x.memoryPssKb)), wallClockElapsedMs:stats(device.samples.filter(x=>x.terminalStatus==='COMPLETED').map(x=>x.wallClockElapsedMs)), caveat:'Single OPPO device bounded workflows; metrics are engineering observations, not population performance or causal overhead.' };
const missingness = { schema:'privacy-lens.missingness-summary.v1', metrics:[{metric:'terminalStatus',eligibleN:device.samples.length,observedN:device.samples.length,missingN:0,reasons:{}},{metric:'memoryPssKb',eligibleN:deviceSummary.completedN,observedN:deviceSummary.memoryPssKb.observedN,missingN:deviceSummary.completedN-deviceSummary.memoryPssKb.observedN,reasons:{TELEMETRY_UNAVAILABLE:deviceSummary.completedN-deviceSummary.memoryPssKb.observedN}},{metric:'wallClockElapsedMs',eligibleN:deviceSummary.completedN,observedN:deviceSummary.wallClockElapsedMs.observedN,missingN:deviceSummary.completedN-deviceSummary.wallClockElapsedMs.observedN,reasons:{TELEMETRY_UNAVAILABLE:deviceSummary.completedN-deviceSummary.wallClockElapsedMs.observedN}},{metric:'flowdroidXmlArtifact',eligibleN:1,observedN:flow.status==='COMPLETED_WITH_RESULT_ARTIFACT'?1:0,missingN:flow.status==='COMPLETED_WITH_RESULT_ARTIFACT'?0:1,reasons:{TOOL_NO_ARTIFACT:flow.status==='COMPLETED_WITH_RESULT_ARTIFACT'?0:1}}], caveat:'Operational reason taxonomy only; no MCAR, MAR, or MNAR mechanism is asserted.' };
const flowSummary = {schema:'privacy-lens.flowdroid-summary.v1',receiptsN:1,statuses:{[flow.status]:1},xmlArtifactsN:flow.status==='COMPLETED_WITH_RESULT_ARTIFACT'?1:0,tool:flow.tool,caveat:flow.caveat};
const tex = [`% Generated from committed receipts by scripts/summarize-thesis-results.js --write.`,`\\newcommand{\\DevicePssMedianKb}{${Math.round(deviceSummary.memoryPssKb.median)}}`,`\\newcommand{\\DevicePssQOneKb}{${Math.round(deviceSummary.memoryPssKb.q1)}}`,`\\newcommand{\\DevicePssQThreeKb}{${Math.round(deviceSummary.memoryPssKb.q3)}}`,`\\newcommand{\\DeviceTimingMedianMs}{${Math.round(deviceSummary.wallClockElapsedMs.median)}}`,`\\newcommand{\\DeviceTimingQOneMs}{${Math.round(deviceSummary.wallClockElapsedMs.q1)}}`,`\\newcommand{\\DeviceTimingQThreeMs}{${Math.round(deviceSummary.wallClockElapsedMs.q3)}}`,``].join('\n');
const outputs = {'fdroid-summary.json':stable(fdroid),'device-summary.json':stable(deviceSummary),'flowdroid-summary.json':stable(flowSummary),'missingness-summary.json':stable(missingness),'generated-results.tex':tex};
const dir = path.join(root,'output/thesis-results');
if (process.argv.includes('--write')) { fs.mkdirSync(dir,{recursive:true}); for(const [n,v] of Object.entries(outputs)) fs.writeFileSync(path.join(dir,n),v); }
else for(const [n,v] of Object.entries(outputs)){const p=path.join(dir,n);if(!fs.existsSync(p)||fs.readFileSync(p,'utf8').replace(/\r\n/g,'\n')!==v)throw new Error(`${n} is stale; run with --write.`);}
console.log(`Thesis results verified: F-Droid N=${fdroid.selectedN}, device N=${deviceSummary.eligibleN}, PSS N=${deviceSummary.memoryPssKb.observedN}.`);
