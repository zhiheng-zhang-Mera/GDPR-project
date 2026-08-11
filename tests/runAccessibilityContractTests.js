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
assert(findingCard.includes('Do not change access or confront a developer based on this card alone.'), 'Finding details must discourage impulsive action.');
assert(overview.includes('Pause between signal and action.'), 'Overview must teach the signal-context-action sequence.');
assert(overview.includes('Run a synthetic demonstration?'), 'Synthetic demonstration must disclose its effect before execution.');
assert(overview.includes('useWindowDimensions') && overview.includes('metricsColumn') && overview.includes('sectionHeadingColumn'), 'Overview must reflow dense horizontal content at larger system text sizes.');
const settings = sources.find((item) => item.relative === 'app/(tabs)/settings.tsx').text;
assert(settings.includes('selectedPack.sources.map') && settings.includes("BINDING_LAW: 'Binding law'") && settings.includes("CONSULTATION_MATERIAL: 'Consultation material'"), 'Settings must render source-authority status without treating consultation material as final guidance.');
assert(settings.includes('sourceLifecycleLabel(source.lifecycle)') && settings.includes('source.versionLabel') && settings.includes('status checked'), 'Settings must expose each source version, lifecycle, and verification date.');
assert(settings.includes('sourceReviewState(source)') && settings.includes('source.reviewDueAt') && settings.includes('Source-review expiry research candidate'), 'Settings must expose scheduled source-review currency and deadline.');
assert(navigation.includes('itemSelected') && navigation.includes('iconWrapSelected'), 'Bottom navigation must provide a structural selected state in addition to colour.');
assert(navigation.includes('useWindowDimensions') && navigation.includes('safeLargeText') && navigation.includes('itemLargeText'), 'Bottom navigation must increase its vertical capacity at larger system text sizes.');
const privacy = sources.find((item) => item.relative === 'app/(tabs)/privacy.tsx').text;
assert(privacy.includes('useWindowDimensions') && privacy.includes('filtersLargeText') && privacy.includes('ledgerSummaryLargeText'), 'Findings filters and summary must reflow at larger system text sizes.');
assert(!findingCard.includes('numberOfLines={1}'), 'Finding identity must not be forcibly truncated at larger text sizes.');
assert(settings.includes('System text scaling is supported.') && settings.includes('status remains readable without colour alone.'), 'Settings must disclose the implemented reading-accessibility behavior.');

console.log(`Accessibility source contracts passed for ${sourceFiles.length} files and ${sources.reduce((sum, item) => sum + [...item.text.matchAll(/<TouchableOpacity\b[\s\S]*?>/g)].length, 0)} interactive touchables.`);
