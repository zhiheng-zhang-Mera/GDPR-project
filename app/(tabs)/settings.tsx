import { Ionicons } from '@expo/vector-icons';
import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomNav } from '../../components/privacy/BottomNav';
import { PrivacyTheme as T } from '../../constants/privacyTheme';
import { RegulationId } from '../../src/compliance/types';
import { usePrivacy } from '../../src/context/PrivacyContext';
import { packGovernanceLabel } from '../../src/regulations/governance';

const SOURCE_STATUS_LABEL = {
  BINDING_LAW: 'Binding law',
  FINAL_GUIDANCE: 'Final guidance',
  CONSULTATION_MATERIAL: 'Consultation',
} as const;

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
        <View style={styles.headerRow}><View style={styles.headerCopy}><Text style={styles.eyebrow}>CONTROL & TRANSPARENCY</Text><Text accessibilityRole="header" style={styles.title}>Settings</Text></View><View style={styles.headerGlyph}><Ionicons name="options" size={24} color={T.colors.primary} /></View></View>
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
                  <View style={styles.governanceRow}><View style={styles.governanceDot} /><Text style={styles.governanceState}>{packGovernanceLabel(pack)}</Text></View>
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
          <View style={styles.divider} />
          <Fact icon="text-outline" title="Readable structure" body="System text scaling is supported. Dense horizontal groups reflow at larger text sizes, and status remains readable without colour alone." />
        </View>

        <Text style={styles.sectionTitle}>About the evidence</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoHeading}><View style={styles.infoIcon}><Ionicons name="information-circle" size={21} color={T.colors.warning} /></View><Text style={styles.cardTitle}>Android access is constrained</Text></View>
          <Text style={styles.cardText}>Ordinary applications may not see unrestricted AppOps history for other apps. WorkManager execution is deferrable. Synthetic events are always labelled and kept distinct from observed activity.</Text>
          <Text style={styles.governanceNote}>{selectedPack.governance.reviewAuthority.scope}</Text>
        </View>

        <View style={styles.sourceHeading}><View style={styles.sourceHeadingCopy}><Text style={styles.sectionTitleCompact}>Source register</Text><Text style={styles.sectionHelp}>Authority status is part of the pack—not inferred from visual prominence.</Text></View><View style={styles.sourceCount}><Text style={styles.sourceCountText}>{selectedPack.sources.length}</Text></View></View>
        {selectedPack.sources.length > 0 ? (
          <View style={styles.sourceList}>
            {selectedPack.sources.map((source) => {
              const badgeStyle = source.status === 'BINDING_LAW' ? styles.bindingBadge : source.status === 'FINAL_GUIDANCE' ? styles.guidanceBadge : styles.consultationBadge;
              return (
                <TouchableOpacity key={source.url} accessibilityRole="link" accessibilityLabel={`Open ${SOURCE_STATUS_LABEL[source.status]} source: ${source.title}`} accessibilityHint="Opens the official source in your browser" onPress={() => void Linking.openURL(source.url)} style={styles.sourceCard}>
                  <View style={styles.sourceTop}><View style={[styles.sourceBadge, badgeStyle]}><Text style={styles.sourceBadgeText}>{SOURCE_STATUS_LABEL[source.status]}</Text></View><Ionicons name="open-outline" size={17} color={T.colors.primary} /></View>
                  <Text style={styles.sourceTitle}>{source.title}</Text>
                  <Text style={styles.sourceMeta}>{source.authority} · checked {source.checkedAt}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.noSources}><Ionicons name="beaker-outline" size={20} color={T.colors.warning} /><Text style={styles.noSourcesText}>This research baseline has no legal-source register and must not be treated as law.</Text></View>
        )}

        <Text style={styles.sectionTitle}>Local data</Text>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Clear ${findings.length} local findings`} accessibilityState={{ disabled: findings.length === 0 }} disabled={findings.length === 0} onPress={confirmClear} style={[styles.clearButton, findings.length === 0 && styles.disabled]}>
          <Ionicons name="trash-outline" size={20} color={T.colors.danger} /><View style={styles.clearCopy}><Text style={styles.clearTitle}>Clear local findings</Text><Text style={styles.clearBody}>{findings.length} finding{findings.length === 1 ? '' : 's'} stored</Text></View><Ionicons name="chevron-forward" size={20} color="#879894" />
        </TouchableOpacity>

        <Text style={styles.version}>Privacy Lens 1.6.0 · Cognitive-accessibility research candidate</Text>
      </ScrollView>
      <BottomNav active="settings" />
    </SafeAreaView>
  );
}

function Fact({ icon, title, body }: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string }) {
  return <View style={styles.fact}><View style={styles.factIcon}><Ionicons name={icon} size={21} color={T.colors.primary} /></View><View style={styles.factCopy}><Text style={styles.factTitle}>{title}</Text><Text style={styles.factBody}>{body}</Text></View></View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: T.colors.canvas }, container: { flex: 1 }, content: { paddingHorizontal: 18, paddingTop: 22, paddingBottom: 40 }, headerRow: { flexDirection: 'row', alignItems: 'center', gap: 14 }, headerCopy: { flex: 1 }, headerGlyph: { width: 54, height: 54, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: T.colors.mint, borderWidth: 1, borderColor: T.colors.mintStrong }, eyebrow: { color: T.colors.primary, fontSize: 11, lineHeight: 15, fontWeight: '900', letterSpacing: 1 }, title: { color: T.colors.ink, fontSize: 31, lineHeight: 37, fontWeight: '900', letterSpacing: -0.7, marginTop: 5 }, subtitle: { color: T.colors.muted, fontSize: 14, lineHeight: 21, marginTop: 10, maxWidth: 360 }, sectionTitle: { color: T.colors.ink, fontSize: 18, lineHeight: 23, fontWeight: '900', marginTop: 29 }, sectionTitleCompact: { color: T.colors.ink, fontSize: 18, lineHeight: 23, fontWeight: '900' }, sectionHelp: { color: T.colors.muted, fontSize: 13, lineHeight: 19, marginTop: 5 },
  packList: { gap: 11, marginTop: 14 }, packCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 17, borderRadius: T.radius.medium, borderWidth: 1, borderColor: T.colors.line, backgroundColor: '#FFFFFF', ...T.shadow.card }, packCardSelected: { borderWidth: 2, borderColor: T.colors.primary, backgroundColor: '#F7FCFA' }, radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#8DA09B', alignItems: 'center', justifyContent: 'center', marginTop: 1 }, radioSelected: { borderColor: T.colors.primary }, radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: T.colors.primary }, packCopy: { flex: 1 }, packTitleRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }, packTitle: { color: T.colors.ink, fontSize: 16, lineHeight: 21, fontWeight: '900' }, kindBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: T.radius.pill }, legalBadge: { backgroundColor: T.colors.mint }, researchBadge: { backgroundColor: T.colors.warningSoft }, kindText: { color: T.colors.ink, fontSize: 9, lineHeight: 12, fontWeight: '900', textTransform: 'uppercase' }, packJurisdiction: { color: T.colors.primary, fontSize: 12, lineHeight: 17, fontWeight: '700', marginTop: 4 }, packDescription: { color: T.colors.inkSoft, fontSize: 13, lineHeight: 19, marginTop: 7 }, governanceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }, governanceDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: T.colors.primaryBright }, governanceState: { flex: 1, color: T.colors.primaryDark, fontSize: 11, lineHeight: 16, fontWeight: '800' }, packVersion: { color: '#7A8D89', fontSize: 11, lineHeight: 15, marginTop: 3 },
  addPackCard: { flexDirection: 'row', gap: 12, padding: 16, borderRadius: T.radius.medium, backgroundColor: T.colors.mint, marginTop: 11 }, addIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' }, addCopy: { flex: 1 }, cardTitle: { color: T.colors.ink, fontSize: 15, lineHeight: 20, fontWeight: '900' }, cardText: { color: '#49615E', fontSize: 13, lineHeight: 20, marginTop: 5 },
  factCard: { marginTop: 12, paddingHorizontal: 16, borderRadius: T.radius.medium, borderWidth: 1, borderColor: T.colors.line, backgroundColor: '#FFFFFF', ...T.shadow.card }, fact: { flexDirection: 'row', gap: 12, paddingVertical: 16 }, factIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: T.colors.mint }, factCopy: { flex: 1 }, factTitle: { color: T.colors.ink, fontSize: 14, lineHeight: 19, fontWeight: '900' }, factBody: { color: T.colors.muted, fontSize: 12, lineHeight: 18, marginTop: 3 }, divider: { height: 1, backgroundColor: T.colors.line }, infoCard: { marginTop: 12, padding: 18, borderRadius: T.radius.medium, backgroundColor: T.colors.warningSoft, borderWidth: 1, borderColor: '#EAD9B2' }, infoHeading: { flexDirection: 'row', alignItems: 'center', gap: 9 }, infoIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' }, governanceNote: { color: '#705826', fontSize: 12, lineHeight: 18, fontWeight: '700', marginTop: 13 },
  sourceHeading: { marginTop: 29, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }, sourceHeadingCopy: { flex: 1 }, sourceCount: { minWidth: 34, height: 34, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: T.colors.mint }, sourceCountText: { color: T.colors.primaryDark, fontSize: 13, fontWeight: '900' }, sourceList: { gap: 9, marginTop: 13 }, sourceCard: { minHeight: 112, padding: 15, borderRadius: 17, borderWidth: 1, borderColor: T.colors.line, backgroundColor: '#FFFFFF', ...T.shadow.card }, sourceTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, sourceBadge: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: T.radius.pill }, bindingBadge: { backgroundColor: T.colors.mint }, guidanceBadge: { backgroundColor: T.colors.infoSoft }, consultationBadge: { backgroundColor: T.colors.warningSoft }, sourceBadgeText: { color: T.colors.ink, fontSize: 9, lineHeight: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.35 }, sourceTitle: { color: T.colors.ink, fontSize: 14, lineHeight: 19, fontWeight: '900', marginTop: 10 }, sourceMeta: { color: T.colors.muted, fontSize: 11, lineHeight: 16, marginTop: 4 }, noSources: { minHeight: 74, marginTop: 13, padding: 15, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 17, backgroundColor: T.colors.warningSoft, borderWidth: 1, borderColor: '#EAD9B2' }, noSourcesText: { flex: 1, color: '#705826', fontSize: 12, lineHeight: 18, fontWeight: '700' },
  clearButton: { minHeight: 66, marginTop: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: T.radius.medium, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: T.colors.line }, clearCopy: { flex: 1 }, clearTitle: { color: T.colors.danger, fontSize: 14, lineHeight: 19, fontWeight: '900' }, clearBody: { color: T.colors.muted, fontSize: 12, lineHeight: 17, marginTop: 2 }, disabled: { opacity: 0.45 }, version: { color: '#7A8D89', fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 28 },
});
