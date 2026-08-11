const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const artifactDirectory = process.argv[2];
if (!artifactDirectory) {
  console.error('Usage: node scripts/verify-source-content-manifest.js <artifact-directory>');
  process.exit(2);
}

const { EU_GDPR_SOURCE_CONTENT_MANIFEST: manifest } = require('../.compliance-test-build/src/regulations/manifests/euGdprSourceContent.js');
const results = manifest.entries.map((entry) => {
  const filePath = path.resolve(artifactDirectory, entry.artifactId);
  if (!fs.existsSync(filePath)) return { artifactId: entry.artifactId, state: 'MISSING' };
  const bytes = fs.readFileSync(filePath);
  const sha256 = crypto.createHash('sha256').update(bytes).digest('hex');
  const state = bytes.byteLength !== entry.byteLength ? 'LENGTH_MISMATCH' : sha256 !== entry.sha256 ? 'HASH_MISMATCH' : 'VERIFIED';
  return { artifactId: entry.artifactId, state, byteLength: bytes.byteLength, sha256 };
});

console.log(JSON.stringify({ schema: manifest.schema, packVersion: manifest.packVersion, generatedAt: manifest.generatedAt, results }, null, 2));
if (results.some(({ state }) => state !== 'VERIFIED')) process.exit(1);
