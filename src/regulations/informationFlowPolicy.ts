import {
  FormalEvidencePredicate,
  InformationCategory,
  InformationFlowPolicyConstraint,
  InformationSink,
  RegulationPack,
} from './types';

const ID = /^[A-Z][A-Z0-9_]{2,63}$/;
const CATEGORIES = new Set<InformationCategory>(['LOCATION', 'MICROPHONE', 'CONTACTS', 'CAMERA', 'BODY_SENSORS', 'DEVICE_IDENTIFIER']);
const SINKS = new Set<InformationSink>(['NETWORK', 'SMS', 'IPC', 'FILE', 'LOG']);

export interface InformationFlowNode {
  id: string;
  processId: string;
  source?: InformationCategory;
  sink?: InformationSink;
}

export interface InformationFlowEdge {
  from: string;
  to: string;
  mechanism: 'DIRECT' | 'CALLBACK' | 'REFLECTION' | 'BINDER' | 'CONTENT_PROVIDER' | 'WORKER';
}

export interface InformationFlowGraph {
  nodes: readonly InformationFlowNode[];
  edges: readonly InformationFlowEdge[];
  observedRuntimePermissions?: ReadonlySet<InformationCategory>;
  evidenceKind: 'STATIC_ANALYSIS' | 'AUTHORISED_RUNTIME_TRACE';
}

export interface InformationFlowAssessment {
  constraintId: string;
  legalReferences: string[];
  source: InformationCategory;
  sink: InformationSink;
  path: string[];
  crossesProcessBoundary: boolean;
  runtimePermissionObserved: boolean;
  evidenceKind: InformationFlowGraph['evidenceKind'];
  missingEvidence: FormalEvidencePredicate[];
  outcome: 'REVIEW_REQUIRED';
}

export function validateInformationFlowPolicyConstraints(constraints: readonly InformationFlowPolicyConstraint[]): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const [index, constraint] of constraints.entries()) {
    const path = `informationFlowPolicyConstraints.${index}`;
    if (!ID.test(constraint.id)) errors.push(`${path}.id must be an uppercase stable identifier`);
    if (ids.has(constraint.id)) errors.push(`${path}.id duplicates another constraint`);
    ids.add(constraint.id);
    if (!constraint.title.trim() || !constraint.rationale.trim()) errors.push(`${path}.title and rationale are required`);
    if (constraint.sources.length === 0 || constraint.sinks.length === 0) errors.push(`${path}.sources and sinks must not be empty`);
    if (constraint.sources.some((source) => !CATEGORIES.has(source))) errors.push(`${path}.sources contains an unsupported category`);
    if (constraint.sinks.some((sink) => !SINKS.has(sink))) errors.push(`${path}.sinks contains an unsupported sink`);
    if (constraint.legalReferences.length === 0 || constraint.legalReferences.some((reference) => !reference.trim())) errors.push(`${path}.legalReferences must contain non-empty references`);
    if (constraint.outcome !== 'REVIEW_REQUIRED') errors.push(`${path}.outcome must remain REVIEW_REQUIRED`);
  }
  return errors;
}

export function compileInformationFlowPolicyModel(pack: RegulationPack): InformationFlowPolicyConstraint[] {
  const errors = validateInformationFlowPolicyConstraints(pack.informationFlowPolicyConstraints);
  if (errors.length > 0) throw new Error(`Invalid information-flow policy ${pack.id}: ${errors.join('; ')}`);
  return pack.informationFlowPolicyConstraints.map((constraint) => ({
    ...constraint,
    sources: [...constraint.sources],
    sinks: [...constraint.sinks],
    legalReferences: [...constraint.legalReferences],
    requiresAll: [...constraint.requiresAll],
  }));
}

function validateGraph(graph: InformationFlowGraph): void {
  const ids = new Set<string>();
  for (const node of graph.nodes) {
    if (!node.id.trim() || !node.processId.trim() || ids.has(node.id)) throw new Error('Information-flow graph has an invalid or duplicate node.');
    if (node.source && !CATEGORIES.has(node.source)) throw new Error('Information-flow graph has an unsupported source.');
    if (node.sink && !SINKS.has(node.sink)) throw new Error('Information-flow graph has an unsupported sink.');
    ids.add(node.id);
  }
  for (const edge of graph.edges) if (!ids.has(edge.from) || !ids.has(edge.to)) throw new Error('Information-flow graph edge references an unknown node.');
}

function pathsFrom(start: string, adjacency: ReadonlyMap<string, readonly string[]>): string[][] {
  const paths: string[][] = [];
  const queue: string[][] = [[start]];
  while (queue.length) {
    const path = queue.shift()!;
    const next = adjacency.get(path.at(-1)!) ?? [];
    if (path.length > 128) throw new Error('Information-flow graph exceeds the bounded path depth.');
    // A sink can itself have outgoing framework edges. Preserve every bounded
    // prefix so a reachable sink remains observable rather than only leaves.
    paths.push(path);
    for (const node of next) if (!path.includes(node)) queue.push([...path, node]);
  }
  return paths;
}

/**
 * Typed reachability is insensitive to identifier obfuscation and preserves
 * Binder/provider/worker edges, so cross-process and dynamic-permission
 * fixtures can be compared without converting a potential flow into a verdict.
 */
export function evaluateInformationFlowPolicy(
  constraints: readonly InformationFlowPolicyConstraint[],
  graph: InformationFlowGraph,
): InformationFlowAssessment[] {
  validateGraph(graph);
  const byId = new Map(graph.nodes.map((node) => [node.id, node]));
  const adjacency = new Map<string, string[]>();
  for (const edge of graph.edges) adjacency.set(edge.from, [...(adjacency.get(edge.from) ?? []), edge.to]);
  const assessments: InformationFlowAssessment[] = [];
  for (const constraint of constraints) {
    for (const start of graph.nodes.filter((node) => node.source && constraint.sources.includes(node.source))) {
      for (const path of pathsFrom(start.id, adjacency)) {
        const terminal = byId.get(path.at(-1)!)!;
        if (!terminal.sink || !constraint.sinks.includes(terminal.sink)) continue;
        assessments.push({
          constraintId: constraint.id,
          legalReferences: [...constraint.legalReferences],
          source: start.source!,
          sink: terminal.sink,
          path,
          crossesProcessBoundary: new Set(path.map((id) => byId.get(id)!.processId)).size > 1,
          runtimePermissionObserved: graph.observedRuntimePermissions?.has(start.source!) ?? false,
          evidenceKind: graph.evidenceKind,
          // Reachability evidence alone cannot discharge any legal predicate.
          missingEvidence: [...constraint.requiresAll],
          outcome: constraint.outcome,
        });
      }
    }
  }
  return assessments;
}
