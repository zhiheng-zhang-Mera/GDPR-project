import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomNav } from '../../components/privacy/BottomNav';
import { PrivacyTheme as T } from '../../constants/privacyTheme';
import { summarizeFindings } from '../../src/compliance/DashboardModel';
import { usePrivacy } from '../../src/context/PrivacyContext';

function formatUpdated(value?: number) {
  if (!value) return 'No review yet';
  return `Updated ${new Date(value).toLocaleString('en-GB', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`;
}

export default function OverviewScreen() {
  const { fontScale } = useWindowDimensions();
  const largeTextLayout = fontScale >= 1.4;
  const { findings, selectedPack, isHydrating, isRunning, nativeCapabilityAvailable, lastUpdated, statusMessage, runDeviceAudit, runControlledEvaluation, evaluationSummary } = usePrivacy();
  const summary = summarizeFindings(findings);
  const hasAttention = summary.action + summary.evidence > 0;
  const confirmControlledEvaluation = () => Alert.alert(
    'Run a synthetic demonstration?',
    'This adds labelled demo findings to the local ledger. It does not inspect other apps, and you can clear the findings in Settings.',
    [{ text: 'Cancel', style: 'cancel' }, { text: 'Run labelled demo', onPress: () => void runControlledEvaluation() }],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.brandRow}>
          <View style={styles.brandMark}><View style={styles.brandMarkInner}><Ionicons name="shield-checkmark" size={20} color="#FFFFFF" /></View></View>
          <View style={styles.brandCopy}>
            <Text accessibilityRole="header" style={styles.brand}>Privacy Lens</Text>
            <Text style={styles.brandTagline}>Evidence before conclusions</Text>
          </View>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Open settings" onPress={() => router.push('/settings')} style={styles.settingsButton}>
            <Ionicons name="options-outline" size={22} color={T.colors.ink} />
          </TouchableOpacity>
        </View>

        <View style={styles.hero}>
          <View style={styles.heroGlow} />
          <View style={styles.heroOrbit} />
          <View style={styles.heroMetaRow}>
            <View style={styles.rulePill}><View style={styles.ruleDot} /><Text style={styles.rulePillText}>{selectedPack.shortName}</Text></View>
            <View style={styles.candidatePill}><Text style={styles.candidatePillText}>RESEARCH CANDIDATE</Text></View>
          </View>
          <Text style={styles.heroTitle}>See the evidence.{`\n`}Keep the conclusion human.</Text>
          <Text style={styles.heroBody}>Review permission activity on this device, separate observed data from synthetic demos, and prepare questions for a human privacy review.</Text>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Review device activity"
            accessibilityState={{ disabled: isRunning }}
            disabled={isRunning}
            onPress={runDeviceAudit}
            style={[styles.primaryButton, isRunning && styles.disabled]}
          >
            {isRunning ? <ActivityIndicator color="#FFFFFF" /> : <Ionicons name="scan" size={21} color="#FFFFFF" />}
            <Text style={styles.primaryButtonText}>{isRunning ? 'Preparing review…' : 'Review device activity'}</Text>
          </TouchableOpacity>
          <View style={styles.heroTrustRow}>
            <View style={styles.localRow}><Ionicons name="phone-portrait-outline" size={15} color="#D7EFE6" /><Text style={styles.localText}>On-device ledger</Text></View>
            <View style={styles.localRow}><Ionicons name="cloud-offline-outline" size={15} color="#D7EFE6" /><Text style={styles.localText}>No evidence upload</Text></View>
          </View>
        </View>

        {statusMessage && <View accessibilityLiveRegion="polite" style={styles.message}><Ionicons name="information-circle" size={20} color={T.colors.info} /><Text style={styles.messageText}>{statusMessage}</Text></View>}

        <View style={[styles.sectionHeadingRow, largeTextLayout && styles.sectionHeadingColumn]}>
          <View><Text style={styles.sectionEyebrow}>CURRENT REVIEW</Text><Text style={styles.sectionTitle}>{isHydrating ? 'Loading local evidence' : hasAttention ? 'Items need your attention' : 'No unresolved signal'}</Text></View>
          <Text style={[styles.updated, largeTextLayout && styles.updatedLargeText]}>{formatUpdated(lastUpdated)}</Text>
        </View>

        <View style={styles.reviewPanel}>
          <View style={styles.reviewPanelTop}><Text style={styles.reviewPanelLabel}>REVIEW SNAPSHOT</Text><Ionicons name="arrow-forward" size={17} color={T.colors.muted} /></View>
          <View style={[styles.metricsRow, largeTextLayout && styles.metricsColumn]}>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel={`${summary.action} items need review`} onPress={() => router.push('/privacy')} style={[styles.metricCard, largeTextLayout && styles.metricCardLargeText]}>
              <View style={[styles.metricAccent, { backgroundColor: T.colors.danger }]} />
              <View style={[styles.metricIcon, { backgroundColor: T.colors.dangerSoft }]}><Ionicons name="alert-circle" size={19} color={T.colors.danger} /></View>
              <Text style={styles.metricValue}>{summary.action}</Text><Text style={styles.metricLabel}>Needs review</Text>
            </TouchableOpacity>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel={`${summary.evidence} evidence gaps`} onPress={() => router.push('/privacy')} style={[styles.metricCard, largeTextLayout && styles.metricCardLargeText]}>
              <View style={[styles.metricAccent, { backgroundColor: T.colors.info }]} />
              <View style={[styles.metricIcon, { backgroundColor: T.colors.infoSoft }]}><Ionicons name="document-text" size={19} color={T.colors.info} /></View>
              <Text style={styles.metricValue}>{summary.evidence}</Text><Text style={styles.metricLabel}>Evidence gaps</Text>
            </TouchableOpacity>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel={`${summary.noConcern} items with no technical concern`} onPress={() => router.push('/privacy')} style={[styles.metricCard, largeTextLayout && styles.metricCardLargeText]}>
              <View style={[styles.metricAccent, { backgroundColor: T.colors.success }]} />
              <View style={[styles.metricIcon, { backgroundColor: T.colors.successSoft }]}><Ionicons name="checkmark-circle" size={19} color={T.colors.success} /></View>
              <Text style={styles.metricValue}>{summary.noConcern}</Text><Text style={styles.metricLabel}>No concern</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.readingCard}>
          <View style={styles.readingHeader}><View style={styles.readingIcon}><Ionicons name="compass-outline" size={21} color={T.colors.primary} /></View><View style={styles.readingHeading}><Text style={styles.sectionEyebrow}>HOW TO READ THIS</Text><Text style={styles.readingTitle}>Pause between signal and action.</Text></View></View>
          <View style={styles.readingSteps}>
            <ReadingStep number="1" title="Notice the signal" body="Start with the recorded source, time window, and rule-owned status." />
            <ReadingStep number="2" title="Check what is missing" body="A count cannot establish purpose, legal basis, necessity, or the full device history." />
            <ReadingStep number="3" title="Choose a proportionate next step" body="Gather context or ask a qualified reviewer before changing access or confronting a developer." last />
          </View>
        </View>

        <View style={styles.capabilityCard}>
          <View style={styles.capabilityRail} />
          <View style={styles.capabilityTop}>
            <View style={styles.capabilityIcon}><Ionicons name={nativeCapabilityAvailable ? 'hardware-chip' : 'lock-closed'} size={22} color={T.colors.primary} /></View>
            <View style={styles.capabilityCopy}><Text style={styles.cardTitle}>Evidence reach</Text><Text style={styles.cardSubtitle}>{nativeCapabilityAvailable ? 'Native Android audit bridge detected' : 'Restricted by this build or platform'}</Text></View>
            <View style={[styles.statusPill, nativeCapabilityAvailable ? styles.statusAvailable : styles.statusLimited]}><Text style={styles.statusPillText}>{nativeCapabilityAvailable ? 'Bridge ready' : 'Limited'}</Text></View>
          </View>
          <Text style={styles.cardBody}>Stock Android often prevents ordinary apps from reading unrestricted activity from other apps. A blank result is not proof that no access occurred.</Text>
        </View>

        <View style={styles.demoCard}>
          <View style={styles.demoTop}><View style={styles.demoGlyph}><Ionicons name="flask" size={20} color={T.colors.primary} /></View><Text style={styles.sectionEyebrow}>SAFE DEMONSTRATION</Text></View>
          <View style={styles.demoCopy}><Text style={styles.demoTitle}>Explore without confusing simulation with observation.</Text><Text style={styles.cardBody}>Run 50 deterministic rounds to see how the active rule pack classifies evidence. Demo events never claim to be observed device activity.</Text></View>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Run controlled synthetic demo" accessibilityHint="Explains what will be added before the demo begins" accessibilityState={{ disabled: isRunning }} disabled={isRunning} onPress={confirmControlledEvaluation} style={styles.demoButton}>
            <Ionicons name="flask-outline" size={20} color={T.colors.primary} /><Text style={styles.demoButtonText}>Run demo</Text>
          </TouchableOpacity>
          {evaluationSummary && <Text style={styles.resultText}>50 rounds · Precision {(evaluationSummary.precision * 100).toFixed(0)}% · Recall {(evaluationSummary.recall * 100).toFixed(0)}% · FP {evaluationSummary.falsePositive}</Text>}
        </View>

        <View style={styles.trustRow}><Ionicons name="cloud-offline-outline" size={18} color={T.colors.muted} /><Text style={styles.trustText}>No account · No advertising · No evidence upload</Text></View>
      </ScrollView>
      <BottomNav active="overview" />
    </SafeAreaView>
  );
}

function ReadingStep({ number, title, body, last = false }: { number: string; title: string; body: string; last?: boolean }) {
  return <View style={[styles.readingStep, last && styles.readingStepLast]}><View style={styles.stepNumber}><Text style={styles.stepNumberText}>{number}</Text></View><View style={styles.stepCopy}><Text style={styles.stepTitle}>{title}</Text><Text style={styles.stepBody}>{body}</Text></View></View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: T.colors.canvas }, container: { flex: 1 }, content: { paddingHorizontal: 18, paddingBottom: 36 },
  brandRow: { minHeight: 78, flexDirection: 'row', alignItems: 'center' }, brandMark: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: T.colors.mint, borderWidth: 1, borderColor: T.colors.mintStrong }, brandMarkInner: { width: 32, height: 32, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: T.colors.primary }, brandCopy: { flex: 1, marginLeft: 11 }, brand: { color: T.colors.ink, fontSize: 20, lineHeight: 25, fontWeight: '900', letterSpacing: -0.3 }, brandTagline: { color: T.colors.muted, fontSize: 12, lineHeight: 17 }, settingsButton: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: T.colors.line, ...T.shadow.card },
  hero: { overflow: 'hidden', padding: 22, borderRadius: T.radius.large, backgroundColor: T.colors.primaryDark, ...T.shadow.floating }, heroGlow: { position: 'absolute', right: -45, top: -56, width: 190, height: 190, borderRadius: 95, backgroundColor: '#167166', opacity: 0.68 }, heroOrbit: { position: 'absolute', right: 22, top: 26, width: 92, height: 92, borderRadius: 46, borderWidth: 1, borderColor: 'rgba(213,245,233,0.18)' }, heroMetaRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 7 }, rulePill: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 11, paddingVertical: 7, borderRadius: T.radius.pill, backgroundColor: 'rgba(255,255,255,0.13)' }, ruleDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#7DE0BC' }, rulePillText: { color: '#E9FFF6', fontSize: 12, fontWeight: '800' }, candidatePill: { paddingHorizontal: 9, paddingVertical: 7, borderRadius: T.radius.pill, borderWidth: 1, borderColor: 'rgba(229,250,242,0.2)' }, candidatePillText: { color: '#BFE3D7', fontSize: 9, lineHeight: 12, fontWeight: '900', letterSpacing: 0.8 }, heroTitle: { maxWidth: 330, color: '#FFFFFF', fontSize: 30, lineHeight: 35, fontWeight: '900', letterSpacing: -0.8, marginTop: 21 }, heroBody: { maxWidth: 340, color: '#D3E8E1', fontSize: 15, lineHeight: 22, marginTop: 12 }, primaryButton: { minHeight: 56, marginTop: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, borderRadius: 17, backgroundColor: T.colors.primaryBright, borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)' }, primaryButtonText: { color: '#FFFFFF', fontSize: 16, lineHeight: 21, fontWeight: '900' }, disabled: { opacity: 0.58 }, heroTrustRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 13, marginTop: 13 }, localRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 }, localText: { color: '#D7EFE6', fontSize: 11, lineHeight: 16, fontWeight: '700' },
  message: { marginTop: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 9, padding: 13, borderRadius: 14, backgroundColor: T.colors.infoSoft }, messageText: { flex: 1, color: '#284D6E', fontSize: 13, lineHeight: 19 }, sectionHeadingRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginTop: 27, marginBottom: 13 }, sectionEyebrow: { color: T.colors.primary, fontSize: 11, lineHeight: 15, fontWeight: '900', letterSpacing: 0.9 }, sectionTitle: { color: T.colors.ink, fontSize: 20, lineHeight: 26, fontWeight: '900', marginTop: 4 }, updated: { flexShrink: 1, color: T.colors.muted, fontSize: 11, lineHeight: 16, textAlign: 'right' },
  sectionHeadingColumn: { alignItems: 'flex-start', flexDirection: 'column' }, updatedLargeText: { textAlign: 'left' },
  reviewPanel: { padding: 10, borderRadius: 23, borderWidth: 1, borderColor: T.colors.line, backgroundColor: T.colors.canvasDeep }, reviewPanelTop: { minHeight: 30, paddingHorizontal: 5, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, reviewPanelLabel: { color: T.colors.muted, fontSize: 10, lineHeight: 14, fontWeight: '900', letterSpacing: 0.8 }, metricsRow: { flexDirection: 'row', gap: 8 }, metricCard: { position: 'relative', overflow: 'hidden', flex: 1, minHeight: 132, padding: 12, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: T.colors.line, ...T.shadow.card }, metricAccent: { position: 'absolute', left: 0, right: 0, top: 0, height: 3 }, metricIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }, metricValue: { color: T.colors.ink, fontSize: 27, lineHeight: 32, fontWeight: '900', marginTop: 12, letterSpacing: -0.6 }, metricLabel: { color: T.colors.muted, fontSize: 11, lineHeight: 15, fontWeight: '700', marginTop: 2 },
  metricsColumn: { flexDirection: 'column' }, metricCardLargeText: { flex: 0, minHeight: 118 },
  readingCard: { marginTop: 16, padding: 18, borderRadius: T.radius.medium, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: T.colors.line, ...T.shadow.card }, readingHeader: { flexDirection: 'row', alignItems: 'center', gap: 11 }, readingIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: T.colors.mint }, readingHeading: { flex: 1 }, readingTitle: { color: T.colors.ink, fontSize: 17, lineHeight: 22, fontWeight: '900', marginTop: 2 }, readingSteps: { marginTop: 13 }, readingStep: { minHeight: 71, flexDirection: 'row', gap: 11, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: T.colors.line }, readingStepLast: { borderBottomWidth: 0, paddingBottom: 2 }, stepNumber: { width: 28, height: 28, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: T.colors.canvasDeep, borderWidth: 1, borderColor: T.colors.mintStrong }, stepNumberText: { color: T.colors.primary, fontSize: 12, lineHeight: 16, fontWeight: '900' }, stepCopy: { flex: 1 }, stepTitle: { color: T.colors.ink, fontSize: 13, lineHeight: 18, fontWeight: '900' }, stepBody: { color: T.colors.muted, fontSize: 12, lineHeight: 18, marginTop: 2 },
  capabilityCard: { position: 'relative', overflow: 'hidden', marginTop: 16, padding: 18, paddingLeft: 21, borderRadius: T.radius.medium, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: T.colors.line, ...T.shadow.card }, capabilityRail: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: T.colors.primary }, capabilityTop: { flexDirection: 'row', alignItems: 'center', gap: 11 }, capabilityIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: T.colors.mint }, capabilityCopy: { flex: 1 }, cardTitle: { color: T.colors.ink, fontSize: 16, lineHeight: 21, fontWeight: '900' }, cardSubtitle: { color: T.colors.muted, fontSize: 12, lineHeight: 17, marginTop: 2 }, statusPill: { paddingHorizontal: 9, paddingVertical: 6, borderRadius: T.radius.pill }, statusAvailable: { backgroundColor: T.colors.successSoft }, statusLimited: { backgroundColor: T.colors.warningSoft }, statusPillText: { color: T.colors.ink, fontSize: 10, lineHeight: 13, fontWeight: '800' }, cardBody: { color: T.colors.inkSoft, fontSize: 13, lineHeight: 20, marginTop: 12 },
  demoCard: { marginTop: 16, padding: 18, borderRadius: T.radius.medium, backgroundColor: T.colors.sand, borderWidth: 1, borderColor: T.colors.sandStrong }, demoTop: { flexDirection: 'row', alignItems: 'center', gap: 9 }, demoGlyph: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' }, demoCopy: { flex: 1, marginTop: 12 }, demoTitle: { color: T.colors.ink, fontSize: 17, lineHeight: 23, fontWeight: '900', letterSpacing: -0.2 }, demoButton: { minHeight: 50, marginTop: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 15, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: T.colors.sandStrong }, demoButtonText: { color: T.colors.primary, fontSize: 14, lineHeight: 19, fontWeight: '900' }, resultText: { color: T.colors.primaryDark, fontSize: 12, lineHeight: 18, fontWeight: '700', marginTop: 11, textAlign: 'center' }, trustRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 23 }, trustText: { color: T.colors.muted, fontSize: 12, lineHeight: 17, fontWeight: '600' },
});
