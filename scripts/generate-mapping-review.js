const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const { EU_GDPR_PACK: pack } = require(path.join(root, '.compliance-test-build/src/regulations/packs/euGdpr.js'));
const quote = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
const rows = [];
for (const rule of Object.values(pack.rules)) rows.push({
  itemId: `THRESHOLD_${rule.permissionType}`, mappingType: 'THRESHOLD_RULE', technicalAntecedent: `${rule.permissionType} accessCount > ceil(${rule.baseline} * ${rule.deviationMultiplier})`, temporalCondition: 'One admitted bounded audit window', citations: rule.legalReference, missingContext: 'Pack processing-context requirements', rationale: rule.rationale, permittedOutput: 'REVIEW_REQUIRED or INSUFFICIENT_EVIDENCE', prohibitedInference: 'GDPR infringement, compliance, purpose, or necessity', counterexample: 'Capability or count without controller context cannot establish infringement',
});
for (const profile of pack.temporalProfiles) rows.push({
  itemId: `TEMPORAL_${profile.id}`, mappingType: 'TEMPORAL_PROFILE', technicalAntecedent: profile.requirements.map((x) => `${x.type}>=${x.minCount}`).join(' + '), temporalCondition: `Unordered package-scoped multiset within ${profile.windowMs} ms`, citations: profile.legalReferences.join('; '), missingContext: 'Purpose, lawful basis, necessity, controller context, and applicable exceptions', rationale: profile.rationale, permittedOutput: 'REVIEW_REQUIRED notification', prohibitedInference: 'Observed real-world behaviour, special-category status in fact, or illegality', counterexample: 'One signal alone or cross-package signals cannot satisfy the profile',
});
for (const constraint of pack.formalPolicyConstraints) rows.push({
  itemId: `FORMAL_${constraint.id}`, mappingType: 'FORMAL_POLICY', technicalAntecedent: constraint.whenAll.join(' + '), temporalCondition: 'As supplied by typed evidence receipt', citations: constraint.legalReferences.join('; '), missingContext: constraint.requiresAll.join('; '), rationale: constraint.rationale, permittedOutput: constraint.outcome, prohibitedInference: 'LEGAL_VIOLATION or LEGAL_COMPLIANCE', counterexample: 'A non-match or complete represented context is not a compliance finding',
});
for (const constraint of pack.informationFlowPolicyConstraints) rows.push({
  itemId: `FLOW_${constraint.id}`, mappingType: 'INFORMATION_FLOW', technicalAntecedent: `${constraint.sources.join('|')} reaches ${constraint.sinks.join('|')}`, temporalCondition: 'Static potential path or bounded authorised runtime trace, source-labelled', citations: constraint.legalReferences.join('; '), missingContext: constraint.requiresAll.join('; '), rationale: constraint.rationale, permittedOutput: constraint.outcome, prohibitedInference: 'Runtime transfer, recipient identity, detector accuracy, or illegality', counterexample: 'Missing XML is missing evidence, not a negative flow result',
});
rows.sort((a, b) => a.itemId.localeCompare(b.itemId));
const fields = ['itemId','mappingType','technicalAntecedent','temporalCondition','citations','missingContext','rationale','permittedOutput','prohibitedInference','counterexample'];
const csv = [fields.join(','), ...rows.map((row) => fields.map((field) => quote(row[field])).join(',')), ''].join('\n');
const target = path.join(root, 'experiments/mapping-review/v1/mapping-items.csv');
if (process.argv.includes('--write')) fs.writeFileSync(target, csv, 'utf8');
else if (!fs.existsSync(target) || fs.readFileSync(target, 'utf8').replace(/\r\n/g, '\n') !== csv) throw new Error('mapping-items.csv is stale; run with --write.');
console.log(`Mapping review packet verified: ${rows.length} atomic items.`);
