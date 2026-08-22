import { RulePackComplianceEngine } from '../src/compliance/RulePackComplianceEngine';
import { evaluateInformationFlowPolicy, InformationFlowGraph, validateInformationFlowPolicyConstraints } from '../src/regulations/informationFlowPolicy';
import { getRegulationPack } from '../src/regulations/registry';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const gdpr = getRegulationPack('EU_GDPR');
const engine = new RulePackComplianceEngine(gdpr, '2026-08-22');

// Obfuscated node identifiers must not change typed source-to-sink semantics.
const obfuscatedGraph: InformationFlowGraph = {
  evidenceKind: 'STATIC_ANALYSIS',
  nodes: [
    { id: 'a.a.a', processId: 'app', source: 'LOCATION' },
    { id: 'b', processId: 'app' },
    { id: 'c.c', processId: 'app', sink: 'NETWORK' },
  ],
  edges: [{ from: 'a.a.a', to: 'b', mechanism: 'REFLECTION' }, { from: 'b', to: 'c.c', mechanism: 'CALLBACK' }],
};
const obfuscated = engine.evaluateInformationFlow(obfuscatedGraph);
assert(obfuscated.some(({ constraintId, source, sink }) => constraintId === 'SENSITIVE_DATA_TO_NETWORK_REVIEW' && source === 'LOCATION' && sink === 'NETWORK'), 'Obfuscated identifiers must not suppress a typed source-to-network review.');
assert(obfuscated.every(({ outcome }) => outcome === 'REVIEW_REQUIRED'), 'Information-flow analysis must remain advisory.');

// A runtime trace can establish that a dynamic permission was granted, without
// equating that event or a flow with GDPR compliance or infringement.
const dynamicPermissionGraph: InformationFlowGraph = {
  ...obfuscatedGraph,
  evidenceKind: 'AUTHORISED_RUNTIME_TRACE',
  observedRuntimePermissions: new Set(['LOCATION']),
};
const dynamic = engine.evaluateInformationFlow(dynamicPermissionGraph);
assert(dynamic.some(({ runtimePermissionObserved, evidenceKind }) => runtimePermissionObserved && evidenceKind === 'AUTHORISED_RUNTIME_TRACE'), 'Dynamic runtime permission evidence must be retained.');

const multiProcessGraph: InformationFlowGraph = {
  evidenceKind: 'STATIC_ANALYSIS',
  nodes: [
    { id: 'p0', processId: 'main', source: 'MICROPHONE' },
    { id: 'p1', processId: 'analytics:worker' },
    { id: 'p2', processId: 'analytics:worker', sink: 'NETWORK' },
  ],
  edges: [{ from: 'p0', to: 'p1', mechanism: 'BINDER' }, { from: 'p1', to: 'p2', mechanism: 'WORKER' }],
};
const multiProcess = engine.evaluateInformationFlow(multiProcessGraph);
assert(multiProcess.some(({ crossesProcessBoundary }) => crossesProcessBoundary), 'Binder/worker paths must retain a cross-process boundary.');

let malformedRejected = false;
try {
  evaluateInformationFlowPolicy(engine.informationFlowPolicyModel, { ...obfuscatedGraph, edges: [{ from: 'a.a.a', to: 'missing', mechanism: 'DIRECT' }] });
} catch {
  malformedRejected = true;
}
assert(malformedRejected, 'Unknown graph edges must fail closed.');
assert(validateInformationFlowPolicyConstraints([{ ...gdpr.informationFlowPolicyConstraints[0], id: 'bad' }]).some((error) => error.includes('stable identifier')), 'Malformed flow policies must fail closed.');

const oracle = [
  { graph: obfuscatedGraph, positive: true },
  { graph: dynamicPermissionGraph, positive: true },
  { graph: multiProcessGraph, positive: true },
  { graph: { ...obfuscatedGraph, nodes: [{ id: 'n0', processId: 'app', source: 'LOCATION' }, { id: 'n1', processId: 'app', sink: 'FILE' }], edges: [{ from: 'n0', to: 'n1', mechanism: 'DIRECT' }] } as InformationFlowGraph, positive: false },
];
let tp = 0; let fp = 0; let tn = 0; let fn = 0;
for (const fixture of oracle) {
  const prediction = engine.evaluateInformationFlow(fixture.graph).length > 0;
  if (prediction && fixture.positive) tp += 1;
  else if (prediction) fp += 1;
  else if (fixture.positive) fn += 1;
  else tn += 1;
}
const precision = tp / (tp + fp);
const recall = tp / (tp + fn);
const f1 = 2 * precision * recall / (precision + recall);
assert(tp === 3 && fp === 0 && tn === 1 && fn === 0 && f1 === 1, 'Fixture oracle metrics must remain stable.');
console.log(`Information-flow adversarial fixtures passed: TP=${tp}, FP=${fp}, TN=${tn}, FN=${fn}, precision=${precision.toFixed(4)}, recall=${recall.toFixed(4)}, F1=${f1.toFixed(4)}. Metrics describe the fixture oracle only.`);
