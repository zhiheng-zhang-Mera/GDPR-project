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

console.log(`Accessibility source contracts passed for ${sourceFiles.length} files and ${sources.reduce((sum, item) => sum + [...item.text.matchAll(/<TouchableOpacity\b[\s\S]*?>/g)].length, 0)} interactive touchables.`);
