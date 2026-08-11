import forgeMd from 'node-forge/lib/md';
import { PackSourceContentAssessment, RegulationPack, SourceContentArtifacts } from './types';

const MANIFEST_SCHEMA = 'privacy-lens.source-content-manifest.v1';

function compareCodeUnits(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function bytesToBinary(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');
}

export function sha256Bytes(bytes: Uint8Array): string {
  return forgeMd.sha256.create().update(bytesToBinary(bytes), 'raw').digest().toHex().toLowerCase();
}

export function canonicalizeSourceContentManifest(pack: RegulationPack): string | undefined {
  const manifest = pack.governance.sourceContentManifest;
  if (!manifest) return undefined;
  const entries = [...manifest.entries]
    .sort((a, b) => compareCodeUnits(a.artifactId, b.artifactId))
    .map((entry) => ({
      sourceUrl: entry.sourceUrl,
      contentUrl: entry.contentUrl,
      artifactId: entry.artifactId,
      mediaType: entry.mediaType,
      byteLength: entry.byteLength,
      sha256: entry.sha256.toLowerCase(),
      retrievedAt: entry.retrievedAt,
      retrievalMethod: entry.retrievalMethod,
    }));
  return JSON.stringify({ schema: MANIFEST_SCHEMA, packId: pack.id, packVersion: manifest.packVersion, generatedAt: manifest.generatedAt, entries });
}

export function computeSourceContentManifestSha256(pack: RegulationPack): string | undefined {
  const canonical = canonicalizeSourceContentManifest(pack);
  return canonical ? forgeMd.sha256.create().update(canonical, 'utf8').digest().toHex().toLowerCase() : undefined;
}

export function assessPackSourceContent(
  pack: RegulationPack,
  artifacts: SourceContentArtifacts = {},
  assessedAt = new Date().toISOString().slice(0, 10),
): PackSourceContentAssessment {
  if (pack.kind !== 'LEGAL_FRAMEWORK') return { state: 'NOT_APPLICABLE', assessedAt, verifiedArtifactCount: 0, expectedArtifactCount: 0, affectedArtifactIds: [] };
  const manifest = pack.governance.sourceContentManifest;
  if (!manifest) return { state: 'MANIFEST_NOT_PROVIDED', assessedAt, verifiedArtifactCount: 0, expectedArtifactCount: 0, affectedArtifactIds: [], reason: 'No offline source-content manifest is recorded for this legal pack.' };
  const base = { assessedAt, manifestSha256: computeSourceContentManifestSha256(pack), expectedArtifactCount: manifest.entries.length };
  const suppliedIds = Object.keys(artifacts);
  if (suppliedIds.length === 0) return { ...base, state: 'ARTIFACTS_NOT_AVAILABLE', verifiedArtifactCount: 0, affectedArtifactIds: manifest.entries.map(({ artifactId }) => artifactId), reason: 'The manifest records official-document digests, but the evaluated app does not bundle the source bytes needed to recompute them.' };
  const missing = manifest.entries.filter(({ artifactId }) => !artifacts[artifactId]).map(({ artifactId }) => artifactId);
  if (missing.length > 0) return { ...base, state: 'ARTIFACT_MISSING', verifiedArtifactCount: manifest.entries.length - missing.length, affectedArtifactIds: missing, reason: 'One or more manifest artifacts were not supplied to the offline verifier.' };
  const lengthMismatches = manifest.entries.filter((entry) => artifacts[entry.artifactId].byteLength !== entry.byteLength).map(({ artifactId }) => artifactId);
  if (lengthMismatches.length > 0) return { ...base, state: 'ARTIFACT_LENGTH_MISMATCH', verifiedArtifactCount: 0, affectedArtifactIds: lengthMismatches, reason: 'One or more supplied artifacts have a different byte length from the signed manifest.' };
  const hashMismatches = manifest.entries.filter((entry) => sha256Bytes(artifacts[entry.artifactId]) !== entry.sha256.toLowerCase()).map(({ artifactId }) => artifactId);
  if (hashMismatches.length > 0) return { ...base, state: 'ARTIFACT_HASH_MISMATCH', verifiedArtifactCount: 0, affectedArtifactIds: hashMismatches, reason: 'One or more supplied artifacts do not match the SHA-256 digest in the signed manifest.' };
  return { ...base, state: 'VERIFIED', verifiedArtifactCount: manifest.entries.length, affectedArtifactIds: [] };
}
