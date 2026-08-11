/* global __dirname */
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const sourceFiles = [
  'app/(tabs)/index.tsx',
  'app/(tabs)/privacy.tsx',
  'app/(tabs)/settings.tsx',
  'components/privacy/BottomNav.tsx',
  'components/privacy/FindingCard.tsx',
];
const sources = sourceFiles.map((relative) => ({ relative, text: fs.readFileSync(path.join(root, relative), 'utf8') }));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

for (const { relative, text } of sources) {
  assert(!text.includes('allowFontScaling={false}'), `${relative} disables system font scaling.`);
  assert(!/[\uFFFD\u8DEF\u9225]/u.test(text), `${relative} contains a replacement or known mojibake character.`);
  const touchables = [...text.matchAll(/<TouchableOpacity\b[\s\S]*?>/g)];
  for (const [index, match] of touchables.entries()) {
    assert(match[0].includes('accessibilityRole='), `${relative} touchable ${index + 1} has no accessibility role.`);
    assert(match[0].includes('accessibilityLabel='), `${relative} touchable ${index + 1} has no explicit accessibility label.`);
  }
}

for (const screen of ['app/(tabs)/index.tsx', 'app/(tabs)/privacy.tsx', 'app/(tabs)/settings.tsx']) {
  const text = sources.find((item) => item.relative === screen).text;
  assert(text.includes('accessibilityRole="header"'), `${screen} has no programmatic screen heading.`);
}

const overview = sources.find((item) => item.relative === 'app/(tabs)/index.tsx').text;
assert(overview.includes('accessibilityLiveRegion="polite"'), 'Overview status updates must be announced politely.');
const navigation = sources.find((item) => item.relative === 'components/privacy/BottomNav.tsx').text;
assert(navigation.includes('accessibilityRole="tablist"') && navigation.includes('accessibilityState={{ selected }}'), 'Bottom navigation must expose tab semantics and selection state.');
const findingCard = sources.find((item) => item.relative === 'components/privacy/FindingCard.tsx').text;
assert(findingCard.includes('accessibilityState={{ expanded }}') && findingCard.includes('accessibilityHint='), 'Expandable findings must expose expansion state and a hint.');
assert(findingCard.includes('presentation.marker') && findingCard.includes('statusRail'), 'Finding status must use a text marker and structural rail in addition to colour.');
assert(findingCard.includes('minHeight: 44'), 'The dedicated evidence disclosure control must retain a 44-pixel minimum target.');
assert(findingCard.includes('What is not established'), 'Expanded findings must separate uncertainty from observation.');
assert(findingCard.includes('SOURCE_REVIEW_LABEL') && findingCard.includes('finding.compliance.sourceReview.state') && findingCard.includes('next due'), 'Findings must expose the source-review state used for their legal mapping.');
assert(findingCard.includes('SOURCE_CONTENT_LABEL') && findingCard.includes('finding.compliance.sourceContent.state') && findingCard.includes('artifacts verified here'), 'Findings must distinguish recorded source digests from locally verified source bytes.');
assert(findingCard.includes('LEGAL_REVIEW_LABEL') && findingCard.includes('finding.compliance.legalReview.state') && findingCard.includes('Legal review not recorded'), 'Findings must expose the independent legal-review gate at the decision point.');
assert(findingCard.includes('TRUST_STORE_LABEL') && findingCard.includes('finding.compliance.legalReview.trustStoreState'), 'Findings must preserve a failed trust-store assessment when a signed legal review is evaluated.');
assert(findingCard.includes('Do not change access or confront a developer based on this card alone.'), 'Finding details must discourage impulsive action.');
assert(overview.includes('Pause between signal and action.'), 'Overview must teach the signal-context-action sequence.');
assert(overview.includes('Run a synthetic demonstration?'), 'Synthetic demonstration must disclose its effect before execution.');
assert(overview.includes('useWindowDimensions') && overview.includes('metricsColumn') && overview.includes('sectionHeadingColumn'), 'Overview must reflow dense horizontal content at larger system text sizes.');
const settings = sources.find((item) => item.relative === 'app/(tabs)/settings.tsx').text;
assert(settings.includes('selectedPack.sources.map') && settings.includes("BINDING_LAW: 'Binding law'") && settings.includes("CONSULTATION_MATERIAL: 'Consultation material'"), 'Settings must render source-authority status without treating consultation material as final guidance.');
assert(settings.includes('sourceLifecycleLabel(source.lifecycle)') && settings.includes('source.versionLabel') && settings.includes('status checked'), 'Settings must expose each source version, lifecycle, and verification date.');
assert(settings.includes('sourceReviewState(source)') && settings.includes('source.reviewDueAt'), 'Settings must expose scheduled source-review currency and deadline.');
assert(settings.includes('assessPackLegalReview(selectedPack)') && settings.includes('Legal review gate') && settings.includes('not a GDPR certification or statutory four-eyes requirement') && settings.includes('Signed monotonic trust-store candidate') && settings.includes('Ed25519 signature') && settings.includes('valid non-revoked trusted key'), 'Settings must disclose the signed project attestation gate without presenting it as a statutory certification.');
assert(settings.includes('assessPackSourceContent(selectedPack)') && settings.includes('Evidence chain') && settings.includes('Official document bytes') && settings.includes('A recorded digest is not a fresh download check.'), 'Settings must explain the offline content-verification chain and its residual trust boundary.');
assert(settings.includes('trustStoreAssessment: trustStore') && settings.includes('sequence + predecessor-digest rollback checks') && settings.includes('Rollback resistance depends on local history') && settings.includes('uninstall, app-data clearing, or device compromise') && settings.includes('not a transparency log'), 'Settings must disclose the assessed signed trust store and the limits of its persisted rollback-state dependency.');
assert(navigation.includes('itemSelected') && navigation.includes('iconWrapSelected'), 'Bottom navigation must provide a structural selected state in addition to colour.');
assert(navigation.includes('useWindowDimensions') && navigation.includes('safeLargeText') && navigation.includes('itemLargeText'), 'Bottom navigation must increase its vertical capacity at larger system text sizes.');
const privacy = sources.find((item) => item.relative === 'app/(tabs)/privacy.tsx').text;
assert(privacy.includes('useWindowDimensions') && privacy.includes('filtersLargeText') && privacy.includes('ledgerSummaryLargeText'), 'Findings filters and summary must reflow at larger system text sizes.');
assert(!findingCard.includes('numberOfLines={1}'), 'Finding identity must not be forcibly truncated at larger text sizes.');
assert(settings.includes('System text scaling is supported.') && settings.includes('status remains readable without colour alone.'), 'Settings must disclose the implemented reading-accessibility behavior.');

console.log(`Accessibility source contracts passed for ${sourceFiles.length} files and ${sources.reduce((sum, item) => sum + [...item.text.matchAll(/<TouchableOpacity\b[\s\S]*?>/g)].length, 0)} interactive touchables.`);
