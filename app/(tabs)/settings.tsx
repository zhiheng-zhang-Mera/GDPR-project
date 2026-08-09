import { Ionicons } from '@expo/vector-icons';
import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomNav } from '../../components/privacy/BottomNav';
import { PrivacyTheme as T } from '../../constants/privacyTheme';
import { RegulationId } from '../../src/compliance/types';
import { usePrivacy } from '../../src/context/PrivacyContext';
import { packGovernanceLabel } from '../../src/regulations/governance';

export default function SettingsScreen() {
  const { availablePacks, selectedRegulationId, selectedPack, selectRegulation, clearFindings, findings } = usePrivacy();

  const confirmClear = () => Alert.alert(
    'Clear local findings?',
    'This removes the evidence ledger stored by Privacy Lens from this device. It cannot be undone.',
    [{ text: 'Cancel', style: 'cancel' }, { text: 'Clear findings', style: 'destructive', onPress: () => void clearFindings() }],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>CONTROL & TRANSPARENCY</Text>
        <Text accessibilityRole="header" style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Choose the rule pack used for new reviews and understand the boundaries of this prototype.</Text>

        <Text style={styles.sectionTitle}>Region & rule pack</Text>
        <Text style={styles.sectionHelp}>Changing packs does not relabel past findings. Every finding keeps the pack that produced it.</Text>
        <View style={styles.packList}>
          {availablePacks.map((pack) => {
            const selected = pack.id === selectedRegulationId;
            return (
              <TouchableOpacity
                key={pack.id}
                accessibilityRole="radio"
                accessibilityLabel={`${pack.shortName}. ${pack.jurisdiction}. ${packGovernanceLabel(pack)}`}
                accessibilityHint="Select this rule pack for future reviews; saved findings keep their original pack"
                accessibilityState={{ checked: selected }}
                onPress={() => void selectRegulation(pack.id as RegulationId)}
                style={[styles.packCard, selected && styles.packCardSelected]}
              >
                <View style={[styles.radio, selected && styles.radioSelected]}>{selected && <View style={styles.radioDot} />}</View>
                <View style={styles.packCopy}>
                  <View style={styles.packTitleRow}><Text style={styles.packTitle}>{pack.shortName}</Text><View style={[styles.kindBadge, pack.kind === 'LEGAL_FRAMEWORK' ? styles.legalBadge : styles.researchBadge]}><Text style={styles.kindText}>{pack.kind === 'LEGAL_FRAMEWORK' ? 'Legal framework' : 'Non-legal demo'}</Text></View></View>
                  <Text style={styles.packJurisdiction}>{pack.jurisdiction}</Text>
                  <Text style={styles.packDescription}>{pack.description}</Text>
                  <Text style={styles.governanceState}>{packGovernanceLabel(pack)}</Text>
                  <Text style={styles.packVersion}>{pack.versionLabel}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.addPackCard}><View style={styles.addIcon}><Ionicons name="extension-puzzle-outline" size={22} color={T.colors.primary} /></View><View style={styles.addCopy}><Text style={styles.cardTitle}>Designed for additional regions</Text><Text style={styles.cardText}>Rule thresholds, references, context requirements, principles, governance state, and caveats are loaded from registered packs—not from screen code.</Text></View></View>

        <Text style={styles.sectionTitle}>Privacy by design</Text>
        <View style={styles.factCard}>
          <Fact icon="phone-portrait-outline" title="On-device storage" body="Findings and your active rule-pack choice are stored locally using app-private storage." />
          <View style={styles.divider} />
          <Fact icon="cloud-offline-outline" title="No evidence upload" body="This release has no account, analytics, advertising SDK, or evidence-sync service." />
          <View style={styles.divider} />
          <Fact icon="scale-outline" title="Human review required" body="Technical signals are prompts for investigation. They are not legal advice or findings of infringement." />
        </View>

        <Text style={styles.sectionTitle}>About the evidence</Text>
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Android access is constrained</Text>
          <Text style={styles.cardText}>Ordinary applications may not see unrestricted AppOps history for other apps. WorkManager execution is deferrable. Synthetic events are always labelled and kept distinct from observed activity.</Text>
          <Text style={styles.governanceNote}>{selectedPack.governance.reviewAuthority.scope}</Text>
          {selectedPack.sourceUrl && (
            <TouchableOpacity accessibilityRole="link" accessibilityLabel={`Open official source for ${selectedPack.shortName}`} accessibilityHint="Opens the source in your browser" onPress={() => void Linking.openURL(selectedPack.sourceUrl!)} style={styles.sourceLink}>
              <Text style={styles.sourceLinkText}>Open official source</Text><Ionicons name="open-outline" size={17} color={T.colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.sectionTitle}>Local data</Text>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Clear ${findings.length} local findings`} accessibilityState={{ disabled: findings.length === 0 }} disabled={findings.length === 0} onPress={confirmClear} style={[styles.clearButton, findings.length === 0 && styles.disabled]}>
          <Ionicons name="trash-outline" size={20} color={T.colors.danger} /><View style={styles.clearCopy}><Text style={styles.clearTitle}>Clear local findings</Text><Text style={styles.clearBody}>{findings.length} finding{findings.length === 1 ? '' : 's'} stored</Text></View><Ionicons name="chevron-forward" size={20} color="#879894" />
        </TouchableOpacity>

        <Text style={styles.version}>Privacy Lens 1.2.0 · Research prototype release candidate</Text>
      </ScrollView>
      <BottomNav active="settings" />
    </SafeAreaView>
  );
}

function Fact({ icon, title, body }: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string }) {
  return <View style={styles.fact}><View style={styles.factIcon}><Ionicons name={icon} size={21} color={T.colors.primary} /></View><View style={styles.factCopy}><Text style={styles.factTitle}>{title}</Text><Text style={styles.factBody}>{body}</Text></View></View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: T.colors.canvas }, container: { flex: 1 }, content: { paddingHorizontal: 18, paddingTop: 20, paddingBottom: 38 }, eyebrow: { color: T.colors.primary, fontSize: 11, lineHeight: 15, fontWeight: '900', letterSpacing: 1 }, title: { color: T.colors.ink, fontSize: 30, lineHeight: 36, fontWeight: '900', marginTop: 5 }, subtitle: { color: T.colors.muted, fontSize: 14, lineHeight: 21, marginTop: 8, maxWidth: 360 }, sectionTitle: { color: T.colors.ink, fontSize: 18, lineHeight: 23, fontWeight: '900', marginTop: 28 }, sectionHelp: { color: T.colors.muted, fontSize: 13, lineHeight: 19, marginTop: 5 },
  packList: { gap: 10, marginTop: 13 }, packCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 16, borderRadius: T.radius.medium, borderWidth: 1, borderColor: T.colors.line, backgroundColor: '#FFFFFF' }, packCardSelected: { borderWidth: 2, borderColor: T.colors.primary, backgroundColor: '#F8FFFC' }, radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#8DA09B', alignItems: 'center', justifyContent: 'center', marginTop: 1 }, radioSelected: { borderColor: T.colors.primary }, radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: T.colors.primary }, packCopy: { flex: 1 }, packTitleRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }, packTitle: { color: T.colors.ink, fontSize: 16, lineHeight: 21, fontWeight: '900' }, kindBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: T.radius.pill }, legalBadge: { backgroundColor: T.colors.mint }, researchBadge: { backgroundColor: T.colors.warningSoft }, kindText: { color: T.colors.ink, fontSize: 9, lineHeight: 12, fontWeight: '900', textTransform: 'uppercase' }, packJurisdiction: { color: T.colors.primary, fontSize: 12, lineHeight: 17, fontWeight: '700', marginTop: 4 }, packDescription: { color: '#49615E', fontSize: 13, lineHeight: 19, marginTop: 7 }, governanceState: { color: T.colors.primaryDark, fontSize: 11, lineHeight: 16, fontWeight: '800', marginTop: 7 }, packVersion: { color: '#7A8D89', fontSize: 11, lineHeight: 15, marginTop: 3 },
  addPackCard: { flexDirection: 'row', gap: 12, padding: 16, borderRadius: T.radius.medium, backgroundColor: T.colors.mint, marginTop: 11 }, addIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' }, addCopy: { flex: 1 }, cardTitle: { color: T.colors.ink, fontSize: 15, lineHeight: 20, fontWeight: '900' }, cardText: { color: '#49615E', fontSize: 13, lineHeight: 20, marginTop: 5 },
  factCard: { marginTop: 12, paddingHorizontal: 16, borderRadius: T.radius.medium, borderWidth: 1, borderColor: T.colors.line, backgroundColor: '#FFFFFF' }, fact: { flexDirection: 'row', gap: 12, paddingVertical: 15 }, factIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: T.colors.mint }, factCopy: { flex: 1 }, factTitle: { color: T.colors.ink, fontSize: 14, lineHeight: 19, fontWeight: '900' }, factBody: { color: T.colors.muted, fontSize: 12, lineHeight: 18, marginTop: 3 }, divider: { height: 1, backgroundColor: T.colors.line }, infoCard: { marginTop: 12, padding: 17, borderRadius: T.radius.medium, backgroundColor: T.colors.warningSoft }, governanceNote: { color: '#705826', fontSize: 12, lineHeight: 18, fontWeight: '700', marginTop: 12 }, sourceLink: { minHeight: 44, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, paddingVertical: 5 }, sourceLinkText: { color: T.colors.primary, fontSize: 13, lineHeight: 18, fontWeight: '900' },
  clearButton: { minHeight: 66, marginTop: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: T.radius.medium, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: T.colors.line }, clearCopy: { flex: 1 }, clearTitle: { color: T.colors.danger, fontSize: 14, lineHeight: 19, fontWeight: '900' }, clearBody: { color: T.colors.muted, fontSize: 12, lineHeight: 17, marginTop: 2 }, disabled: { opacity: 0.45 }, version: { color: '#7A8D89', fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 28 },
});
