/**
 * High-volume fixed-seed stress driver for the temporal evidence contract.
 *
 * This driver closes a reproducibility gap. The claim in Thesis/Final/
 * chapter-05 that a fixed-seed driver completed 150,010 assertions was
 * previously supported only by a script kept outside the repository, so no
 * reproducer could re-run it. The campaign below is implemented in-repo from
 * the same specification and is deterministic: a fixed seed, no wall-clock
 * input, and no dependency on the host.
 *
 * It deliberately does NOT import the evaluator's own counting logic. Each
 * campaign states an independent expectation and fails loudly on disagreement.
 *
 * Campaigns
 *   C1 40,000 randomised observation multisets over both registered packs,
 *      checked against an independent count-and-window oracle.
 *   C2 10,000 random partition/export/restore/resume cases, requiring the
 *      restored temporal evidence receipt to equal uninterrupted evaluation.
 *   C3 20,000 malformed-audit cases, requiring fail-closed rejection with a
 *      byte-for-byte unchanged exported temporal ledger.
 *   C4 one valid 10,001-observation snapshot, requiring bounded restoration.
 *   C5 one forged deduplication key, requiring rejection.
 *
 * All campaign sizes are overridable with CLI flags so that a fast
 * deterministic subset can run inside continuous integration while the full
 * campaign remains the thesis-facing reproduction command.
 */
import { RulePackComplianceEngine } from '../src/compliance/RulePackComplianceEngine';
import { CompiledTemporalRule } from '../src/compliance/TemporalCooccurrenceEngine';
import { compileTemporalRuleMapping } from '../src/regulations/temporalRuleMapping';
import { getRegulationPack } from '../src/regulations/registry';
import { PermissionAudit, PrivacyObservation, PrivacyObservationType, RegulationId } from '../src/compliance/types';
import { MAX_RESTORED_TEMPORAL_ENTRIES } from '../src/compliance/temporalLedgerLimits';
import { cpus, hostname, platform, release, totalmem, arch } from 'node:os';
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const root = resolve(__dirname, '..', '..');

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function argument(name: string, fallback: number): number {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) return fallback;
  const value = Number(process.argv[index + 1]);
  if (!Number.isSafeInteger(value) || value < 1) throw new Error(`--${name} must be a positive safe integer.`);
  return value;
}

function stringArgument(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? undefined : process.argv[index + 1];
}

/** Host and toolchain facts recorded alongside a receipt, never used as test input. */
function hostFacts() {
  const cpuList = cpus();
  return {
    hostname: hostname(),
    platform: platform(),
    osRelease: release(),
    arch: arch(),
    cpuModel: cpuList[0]?.model?.trim() ?? 'unknown',
    cpuLogicalCores: cpuList.length,
    totalMemoryBytes: totalmem(),
    nodeVersion: process.version,
  };
}

/** Deterministic 32-bit linear congruential generator, identical to the suite seed style. */
function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x1_0000_0000;
  };
}

const OBSERVATION_POOL: readonly PrivacyObservationType[] = [
  'LOCATION',
  'MICROPHONE',
  'CONTACTS',
  'ACTIVITY_RECOGNITION',
  'BODY_SENSORS',
  'CAMERA',
  'CLIPBOARD_READ',
  'DEVICE_IDENTIFIER',
  'MEDIA_IMAGES',
  'MEDIA_LOCATION',
  'APP_BACKGROUNDED',
  'DATA_TRANSFER',
];

const PACK_IDS: readonly RegulationId[] = ['EU_GDPR', 'GLOBAL_RESEARCH_BASELINE'];
const EVALUATED_AT = Date.parse('2026-08-20T00:00:00Z');

interface PackFixture {
  readonly regulationId: RegulationId;
  readonly rules: readonly CompiledTemporalRule[];
  readonly maxWindowMs: number;
}

const fixtures: readonly PackFixture[] = PACK_IDS.map((regulationId) => {
  const rules = compileTemporalRuleMapping(getRegulationPack(regulationId));
  return { regulationId, rules, maxWindowMs: Math.max(...rules.map(({ windowMs }) => windowMs)) };
});

/**
 * Independent oracle. Counts observations per type inside each rule's own
 * window using only its published requirement list, and reports the set of
 * rule identifiers that the multiset satisfies.
 */
function oracleMatchIds(fixture: PackFixture, observations: readonly PrivacyObservation[]): string[] {
  const matches: string[] = [];
  for (const rule of [...fixture.rules].sort((left, right) => left.id.localeCompare(right.id))) {
    const windowStart = EVALUATED_AT - rule.windowMs;
    const counts = new Map<PrivacyObservationType, number>();
    for (const observation of observations) {
      if (observation.occurredAt > EVALUATED_AT || observation.occurredAt < windowStart) continue;
      counts.set(observation.type, (counts.get(observation.type) ?? 0) + (observation.count ?? 1));
    }
    const satisfied = rule.requirements.every(({ type, minCount }: { type: PrivacyObservationType; minCount: number }) => (counts.get(type) ?? 0) >= minCount);
    if (satisfied) matches.push(rule.id);
  }
  return matches;
}

function shuffle<T>(values: readonly T[], random: () => number): T[] {
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

/**
 * Generation modes for the corpus campaign.
 *
 * `WIDE` draws from every observation type and reaches the multi-type
 * combination rules. `REPEAT` narrows the type pool to build counts.
 * `TARGETED` is derived from a selected rule's own published requirements, which
 * is the only mode that reliably reaches rules with a high `minCount` such as
 * HIGH_FREQUENCY_LOCATION (20 observations of one type inside one hour).
 */
const CORPUS_WIDE = 'WIDE' as const;
const CORPUS_REPEAT = 'REPEAT' as const;
const CORPUS_TARGETED = 'TARGETED' as const;
type CorpusMode = typeof CORPUS_WIDE | typeof CORPUS_REPEAT | typeof CORPUS_TARGETED;

function buildObservations(fixture: PackFixture, random: () => number, size: number, mode: CorpusMode, target?: CompiledTemporalRule): PrivacyObservation[] {
  const observations: PrivacyObservation[] = [];
  if (mode === CORPUS_TARGETED && target) {
    // Derive the multiset from the rule's declared requirements and shrink the
    // window to the rule's own span, so the rule must match under its own terms.
    for (const { type, minCount } of target.requirements) {
      const extra = Math.floor(random() * 3);
      for (let index = 0; index < minCount + extra; index += 1) {
        observations.push({
          type,
          occurredAt: EVALUATED_AT - Math.floor(random() * Math.max(1, target.windowMs - 1)),
          count: 1,
          source: 'IMPORTED',
        });
      }
    }
    return observations;
  }
  const poolSize = mode === CORPUS_REPEAT ? 2 + Math.floor(random() * 2) : OBSERVATION_POOL.length;
  const pool = OBSERVATION_POOL.slice(0, poolSize);
  for (let index = 0; index < size; index += 1) {
    const type = pool[Math.floor(random() * pool.length)];
    // Spread timestamps across and beyond the largest rule window so that both
    // in-window and out-of-window filtering are exercised.
    const offset = Math.floor(random() * (fixture.maxWindowMs * 1.4));
    observations.push({ type, occurredAt: EVALUATED_AT - offset, count: 1, source: 'IMPORTED' });
  }
  return observations;
}

/**
 * An admitted audit must contain its own observation timestamps, so the audit
 * window spans the widest offset any fixture can generate. The span stays well
 * inside the engine's one-day window limit.
 */
const AUDIT_WINDOW_SPAN_MS = Math.ceil(Math.max(...fixtures.map(({ maxWindowMs }) => maxWindowMs)) * 1.4);

function auditFrom(packageName: string, observations: readonly PrivacyObservation[]): PermissionAudit {
  return {
    packageName,
    permissionType: 'LOCATION',
    accessCount: observations.reduce((sum, observation) => sum + (observation.count ?? 1), 0),
    windowStart: EVALUATED_AT - AUDIT_WINDOW_SPAN_MS,
    windowEnd: EVALUATED_AT,
    source: 'IMPORTED',
    observationEvents: [...observations],
  };
}

const random = createRandom(0x5eed_2026);
let assertions = 0;
const started = Date.now();

/* ------------------------------------------------------------------ C1 --- */
const corpusRounds = argument('corpus-rounds', 40_000);
const ruleMatchCounts = new Map<string, number>();
for (let round = 0; round < corpusRounds; round += 1) {
  const fixture = fixtures[round % fixtures.length];
  // Rotate generation modes so that combination rules, count rules, and
  // rule-derived multisets are all exercised within one campaign.
  const mode: CorpusMode = round % 3 === 0 ? CORPUS_TARGETED : round % 3 === 1 ? CORPUS_WIDE : CORPUS_REPEAT;
  const target = mode === CORPUS_TARGETED ? fixture.rules[Math.floor(random() * fixture.rules.length)] : undefined;
  const size = mode === CORPUS_REPEAT ? 24 + Math.floor(random() * 16) : 1 + Math.floor(random() * 24);
  const observations = buildObservations(fixture, random, size, mode, target);
  const engine = new RulePackComplianceEngine(getRegulationPack(fixture.regulationId), '2026-08-20');
  const finding = engine.evaluate(auditFrom(`stress.corpus.${round}`, observations));
  const produced = [...new Set((finding.temporalEvidence ?? []).map(({ ruleId }) => ruleId))].sort();
  const expected = oracleMatchIds(fixture, observations);
  assert(
    produced.join('|') === expected.join('|'),
    `C1 round ${round} (${fixture.regulationId}): engine matched [${produced.join(', ')}] but the independent oracle requires [${expected.join(', ')}].`,
  );
  assertions += 1;
  for (const ruleId of produced) ruleMatchCounts.set(ruleId, (ruleMatchCounts.get(ruleId) ?? 0) + 1);

  // Order invariance: an independent shuffle must not change the receipt.
  if (produced.length > 0) {
    const shuffled = new RulePackComplianceEngine(getRegulationPack(fixture.regulationId), '2026-08-20')
      .evaluate(auditFrom(`stress.corpus.${round}`, shuffle(observations, random)));
    assert(
      (shuffled.temporalEvidence ?? []).map(({ evidenceSha256 }) => evidenceSha256).join('|') ===
        (finding.temporalEvidence ?? []).map(({ evidenceSha256 }) => evidenceSha256).join('|'),
      `C1 round ${round}: a shuffled evaluation changed the temporal evidence receipt.`,
    );
    assertions += 1;
  }
}

// Non-vacuity guard: a campaign that never reaches a rule cannot claim to have
// exercised it. Every compiled rule in every registered pack must be matched at
// least once, otherwise the corpus and this campaign have drifted apart.
for (const fixture of fixtures) {
  for (const rule of fixture.rules) {
    assert(
      (ruleMatchCounts.get(rule.id) ?? 0) > 0,
      `C1: rule ${rule.id} (${fixture.regulationId}) was never matched, so the campaign did not exercise it.`,
    );
  }
}

/* ------------------------------------------------------------------ C2 --- */
const restartCases = argument('restart-cases', 10_000);
for (let round = 0; round < restartCases; round += 1) {
  const fixture = fixtures[round % fixtures.length];
  const pack = getRegulationPack(fixture.regulationId);
  const size = 2 + Math.floor(random() * 20);
  const observations = buildObservations(fixture, random, size, CORPUS_WIDE);
  const split = 1 + Math.floor(random() * (observations.length - 1));
  const before = { ...auditFrom(`stress.restart.${round}`, observations.slice(0, split)), observationEvents: observations.slice(0, split) };
  const after = { ...auditFrom(`stress.restart.${round}`, observations.slice(split)), observationEvents: observations.slice(split) };

  const interrupted = new RulePackComplianceEngine(pack, '2026-08-20');
  interrupted.evaluate(before);
  const snapshot = interrupted.exportTemporalLedger(EVALUATED_AT);

  const resumed = new RulePackComplianceEngine(pack, '2026-08-20');
  assert(resumed.restoreTemporalLedger(snapshot, EVALUATED_AT), `C2 round ${round}: a same-pack in-window snapshot must restore.`);
  const resumedFinding = resumed.evaluate(after);

  const uninterrupted = new RulePackComplianceEngine(pack, '2026-08-20');
  const directFinding = uninterrupted.evaluate({ ...auditFrom(`stress.restart.${round}`, observations), observationEvents: [...observations] });

  assert(
    (resumedFinding.temporalEvidence ?? []).map(({ ruleId, evidenceSha256 }) => `${ruleId}:${evidenceSha256}`).join('|') ===
      (directFinding.temporalEvidence ?? []).map(({ ruleId, evidenceSha256 }) => `${ruleId}:${evidenceSha256}`).join('|'),
    `C2 round ${round} (${fixture.regulationId}): resumed evaluation diverged from uninterrupted evaluation.`,
  );
  assertions += 1;
}

/* ------------------------------------------------------------------ C3 --- */
const malformedCases = argument('malformed-cases', 20_000);
const MALFORMED_BUILDERS: readonly ((round: number) => unknown)[] = [
  (round) => ({ packageName: `stress.malformed.${round}`, permissionType: 'CAMERA', accessCount: 1, windowStart: 0, windowEnd: 1 }),
  (round) => ({ packageName: `stress.malformed.${round}`, permissionType: 'LOCATION', accessCount: Number.NaN, windowStart: 0, windowEnd: 1 }),
  (round) => ({ packageName: `stress.malformed.${round}`, permissionType: 'LOCATION', accessCount: -1, windowStart: 0, windowEnd: 1 }),
  (round) => ({ packageName: `stress.malformed.${round}`, permissionType: 'LOCATION', accessCount: 1, windowStart: 2, windowEnd: 1 }),
  (round) => ({ packageName: `stress.malformed.${round}`, permissionType: '__proto__', accessCount: 1, windowStart: 0, windowEnd: 1 }),
  (round) => ({ packageName: `stress.malformed.${round}`, permissionType: 'LOCATION', accessCount: 1, windowStart: 0, windowEnd: 1, source: 'FORGED' }),
  (round) => ({ packageName: `stress.malformed.${round}`, permissionType: 'LOCATION', accessCount: 2, windowStart: 0, windowEnd: 1, accessTimestamps: [0] }),
  (round) => ({ packageName: `stress.malformed.${round}`, permissionType: 'LOCATION', accessCount: 1, windowStart: 0, windowEnd: 1, processingContext: { retentionDays: -1 } }),
  (round) => ({ packageName: `stress.malformed.${round}`, permissionType: 'LOCATION', accessCount: 1, windowStart: 0, windowEnd: 1, evidenceKind: 'CONTROLLED_DEMO' }),
  (round) => ({ packageName: '', permissionType: 'LOCATION', accessCount: 1, windowStart: 0, windowEnd: 1 }),
  () => null,
  () => [],
];
for (let round = 0; round < malformedCases; round += 1) {
  const fixture = fixtures[round % fixtures.length];
  const engine = new RulePackComplianceEngine(getRegulationPack(fixture.regulationId), '2026-08-20');
  // Seed a small amount of legitimate state so that "unchanged ledger" is a
  // meaningful claim rather than a comparison of two empty snapshots.
  engine.evaluate(auditFrom(`stress.malformed.state.${round}`, [
    { type: 'LOCATION', occurredAt: EVALUATED_AT - 1_000, source: 'IMPORTED' },
  ]));
  const beforeLedger = JSON.stringify(engine.exportTemporalLedger(EVALUATED_AT));

  const result = engine.evaluateSafe(MALFORMED_BUILDERS[round % MALFORMED_BUILDERS.length](round));
  assert(result.accepted === false, `C3 round ${round}: a malformed audit was accepted.`);
  assertions += 1;

  const afterLedger = JSON.stringify(engine.exportTemporalLedger(EVALUATED_AT));
  assert(afterLedger === beforeLedger, `C3 round ${round}: a rejected audit mutated the temporal ledger.`);
  assertions += 1;
}

/* ------------------------------------------------------------------ C4 --- */
{
  const pack = getRegulationPack('EU_GDPR');
  // Distinct channel/context values keep every deduplication key unique, so the
  // snapshot genuinely carries more entries than the bound.
  const channels: readonly NonNullable<PrivacyObservation['channel']>[] = ['SENSOR_CALL', 'DATA_ACCESS', 'DATA_TRANSFER', 'APP_STATE'];
  const contexts: readonly NonNullable<PrivacyObservation['context']>[] = ['FOREGROUND', 'BACKGROUND', 'UNKNOWN'];
  const destinations: readonly NonNullable<PrivacyObservation['destination']>[] = ['LOCAL', 'NETWORK', 'UNKNOWN'];
  const total = MAX_RESTORED_TEMPORAL_ENTRIES + 1;
  const entries = Array.from({ length: total }, (_, index) => {
    const observation: PrivacyObservation = {
      type: OBSERVATION_POOL[index % OBSERVATION_POOL.length],
      occurredAt: EVALUATED_AT - 1_000 - index,
      count: 1,
      source: 'IMPORTED',
      channel: channels[index % channels.length],
      context: contexts[Math.floor(index / channels.length) % contexts.length],
      destination: destinations[Math.floor(index / (channels.length * contexts.length)) % destinations.length],
    };
    const dedupeKey = [
      observation.type,
      observation.occurredAt,
      observation.count ?? 1,
      observation.source ?? '',
      observation.channel ?? '',
      observation.context ?? '',
      observation.destination ?? '',
    ].join('|');
    return { packageName: `stress.bound.${index}`, observation, dedupeKey };
  });
  const uniqueKeys = new Set(entries.map(({ dedupeKey }) => dedupeKey));
  assert(uniqueKeys.size === total, `C4 fixture must carry ${total} distinct deduplication keys but built ${uniqueKeys.size}.`);

  const engine = new RulePackComplianceEngine(pack, '2026-08-20');
  assert(engine.restoreTemporalLedger({
    schema: 'privacy-lens.temporal-ledger.v1',
    regulationId: pack.id,
    packVersion: pack.versionLabel,
    savedAt: EVALUATED_AT,
    entries,
  }, EVALUATED_AT), `C4: a structurally valid ${total}-entry snapshot must restore.`);
  assertions += 1;

  const restored = engine.exportTemporalLedger(EVALUATED_AT);
  assert(
    restored.entries.length === MAX_RESTORED_TEMPORAL_ENTRIES,
    `C4: an oversized snapshot must be bounded to ${MAX_RESTORED_TEMPORAL_ENTRIES} entries but retained ${restored.entries.length}.`,
  );
  // The restore bound is applied to the snapshot's own entry order, so the
  // retained keys must equal the leading slice of the supplied snapshot rather
  // than an arbitrary subset or a silently re-ordered one.
  const expectedRetained = entries.slice(0, MAX_RESTORED_TEMPORAL_ENTRIES).map(({ dedupeKey }) => dedupeKey).sort();
  const retainedKeys = restored.entries.map(({ dedupeKey }) => dedupeKey).sort();
  assert(
    retainedKeys.length === expectedRetained.length && retainedKeys.every((key, index) => key === expectedRetained[index]),
    'C4: bounded restoration must retain exactly the leading in-window entries of the supplied snapshot.',
  );
  assertions += 1;
}

/* ------------------------------------------------------------------ C5 --- */
{
  const pack = getRegulationPack('EU_GDPR');
  const engine = new RulePackComplianceEngine(pack, '2026-08-20');
  engine.evaluate(auditFrom('stress.forged.source', [{ type: 'LOCATION', occurredAt: EVALUATED_AT - 1_000, source: 'IMPORTED' }]));
  const snapshot = engine.exportTemporalLedger(EVALUATED_AT);
  assert(snapshot.entries.length > 0, 'C5: the forged-key fixture requires at least one ledger entry.');

  const forged = { ...snapshot, entries: [{ ...snapshot.entries[0], dedupeKey: 'forged' }] };
  assert(
    !new RulePackComplianceEngine(pack, '2026-08-20').restoreTemporalLedger(forged, EVALUATED_AT),
    'C5: a forged deduplication key must be rejected.',
  );
  assertions += 1;

  const crossPack = new RulePackComplianceEngine(getRegulationPack('GLOBAL_RESEARCH_BASELINE'), '2026-08-20');
  assert(!crossPack.restoreTemporalLedger(snapshot, EVALUATED_AT), 'C5: a snapshot must not cross regulation-pack boundaries.');
  assertions += 1;

  const expired = new RulePackComplianceEngine(pack, '2026-08-20');
  assert(
    !expired.restoreTemporalLedger(snapshot, EVALUATED_AT + Math.max(...compileTemporalRuleMapping(pack).map(({ windowMs }) => windowMs)) + 1),
    'C5: an expired snapshot must not restore.',
  );
  assertions += 1;
}

const elapsedMs = Date.now() - started;
const total = assertions;
const ruleMatchSummary = Object.fromEntries([...ruleMatchCounts.entries()].sort(([left], [right]) => left.localeCompare(right)));

/**
 * The deterministic outcome of the full default campaign is pinned in the
 * evidence manifest so that the thesis figure cannot drift away from the driver.
 * A campaign run at reduced sizes is a smoke check: it exercises every campaign
 * and every rule but cannot reproduce the full-campaign counts, so only the
 * upper bound is enforced against the pin.
 */
const DEFAULT_CAMPAIGN = corpusRounds === 40_000 && restartCases === 10_000 && malformedCases === 20_000;
const manifestPath = join(root, 'docs', 'research', 'thesis-evidence-manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const pinned = manifest.stressCampaign ?? {};
if (!process.argv.includes('--measure')) {
  assert(typeof pinned.assertions === 'number' && typeof pinned.elapsedMsObservedOnBaselineHost === 'number', 'The manifest stressCampaign block must record the observed assertion total and baseline elapsed time.');
  if (DEFAULT_CAMPAIGN) {
    assert(pinned.assertions === total, `The manifest stressCampaign assertion total is stale: manifest=${pinned.assertions} campaign=${total}.`);
    assert(JSON.stringify(pinned.ruleMatches) === JSON.stringify(ruleMatchSummary), `The manifest stressCampaign rule matches are stale: manifest=${JSON.stringify(pinned.ruleMatches)} campaign=${JSON.stringify(ruleMatchSummary)}.`);
  } else {
    assert(pinned.assertions >= total, `A reduced campaign (${total} assertions) cannot exceed the pinned full-campaign total (${pinned.assertions}).`);
    for (const ruleId of Object.keys(pinned.ruleMatches)) {
      assert(ruleId in ruleMatchSummary, `The reduced campaign did not reach pinned rule ${ruleId}.`);
    }
  }
}
if (process.argv.includes('--measure')) {
  console.log(`MEASURED assertions=${total} ruleMatches=${JSON.stringify(ruleMatchSummary)} elapsedMs=${elapsedMs}`);
}

const receipt = {
  schema: 'privacy-lens.temporal-stress-campaign.v1',
  seed: '0x5eed2026',
  evaluatedAt: '2026-08-20T00:00:00Z',
  campaign: { corpusRounds, restartCases, malformedCases, boundedSnapshotEntries: MAX_RESTORED_TEMPORAL_ENTRIES + 1, forgedSnapshotCases: 1 },
  matchesPinnedCampaign: DEFAULT_CAMPAIGN,
  observed: { assertions: total, elapsedMs, ruleMatches: ruleMatchSummary },
  pinned: { assertions: pinned.assertions, ruleMatches: pinned.ruleMatches },
  host: hostFacts(),
  generatedAt: new Date().toISOString(),
  caveat: 'Deterministic logical campaign only. It establishes conformance and fail-closed behaviour for the generated inputs; it is not a performance benchmark, field evidence, population estimate, or legal validation. The host block records provenance and is not a test input.',
};
const receiptPath = stringArgument('receipt');
if (receiptPath) {
  mkdirSync(dirname(receiptPath), { recursive: true });
  writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`, 'utf8');
}
console.log(
  `Temporal stress campaign passed: ${total} assertions in ${(elapsedMs / 1_000).toFixed(1)}s ` +
  `(corpus=${corpusRounds}, restart=${restartCases}, malformed=${malformedCases}, bound=${MAX_RESTORED_TEMPORAL_ENTRIES + 1}, forged=1).`,
);
if (receiptPath) console.log(`Receipt written: ${receiptPath}`);
