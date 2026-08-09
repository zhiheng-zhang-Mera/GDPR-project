import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomNav } from '../../components/privacy/BottomNav';
import { PrivacyTheme as T } from '../../constants/privacyTheme';
import { summarizeFindings } from '../../src/compliance/DashboardModel';
import { usePrivacy } from '../../src/context/PrivacyContext';

function formatUpdated(value?: number) {
  if (!value) return 'No review yet';
  return `Updated ${new Date(value).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`;
}

export default function OverviewScreen() {
  const { findings, selectedPack, isHydrating, isRunning, nativeCapabilityAvailable, lastUpdated, statusMessage, runDeviceAudit, runControlledEvaluation, evaluationSummary } = usePrivacy();
  const summary = summarizeFindings(findings);
  const hasAttention = summary.action + summary.evidence > 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.brandRow}>
          <View style={styles.brandMark}><Ionicons name="shield-checkmark" size={22} color="#FFFFFF" /></View>
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
          <View style={styles.rulePill}><View style={styles.ruleDot} /><Text style={styles.rulePillText}>{selectedPack.shortName}</Text></View>
          <Text style={styles.heroTitle}>Understand what the evidence can—and cannot—say.</Text>
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
          <View style={styles.localRow}><Ionicons name="phone-portrait-outline" size={16} color="#C9E7DC" /><Text style={styles.localText}>Findings stay on this device</Text></View>
        </View>

        {statusMessage && <View accessibilityLiveRegion="polite" style={styles.message}><Ionicons name="information-circle" size={20} color={T.colors.info} /><Text style={styles.messageText}>{statusMessage}</Text></View>}

        <View style={styles.sectionHeadingRow}>
          <View><Text style={styles.sectionEyebrow}>CURRENT REVIEW</Text><Text style={styles.sectionTitle}>{isHydrating ? 'Loading local evidence' : hasAttention ? 'Items need your attention' : 'No unresolved signal'}</Text></View>
          <Text style={styles.updated}>{formatUpdated(lastUpdated)}</Text>
        </View>

        <View style={styles.metricsRow}>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel={`${summary.action} items need review`} onPress={() => router.push('/privacy')} style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: T.colors.dangerSoft }]}><Ionicons name="alert-circle" size={20} color={T.colors.danger} /></View>
            <Text style={styles.metricValue}>{summary.action}</Text><Text style={styles.metricLabel}>Needs review</Text>
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel={`${summary.evidence} evidence gaps`} onPress={() => router.push('/privacy')} style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: T.colors.infoSoft }]}><Ionicons name="document-text" size={20} color={T.colors.info} /></View>
            <Text style={styles.metricValue}>{summary.evidence}</Text><Text style={styles.metricLabel}>Evidence gaps</Text>
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel={`${summary.noConcern} items with no technical concern`} onPress={() => router.push('/privacy')} style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: T.colors.successSoft }]}><Ionicons name="checkmark-circle" size={20} color={T.colors.success} /></View>
            <Text style={styles.metricValue}>{summary.noConcern}</Text><Text style={styles.metricLabel}>No concern</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.capabilityCard}>
          <View style={styles.capabilityTop}>
            <View style={styles.capabilityIcon}><Ionicons name={nativeCapabilityAvailable ? 'hardware-chip' : 'lock-closed'} size={22} color={T.colors.primary} /></View>
            <View style={styles.capabilityCopy}><Text style={styles.cardTitle}>Evidence reach</Text><Text style={styles.cardSubtitle}>{nativeCapabilityAvailable ? 'Native Android audit bridge detected' : 'Restricted by this build or platform'}</Text></View>
            <View style={[styles.statusPill, nativeCapabilityAvailable ? styles.statusAvailable : styles.statusLimited]}><Text style={styles.statusPillText}>{nativeCapabilityAvailable ? 'Bridge ready' : 'Limited'}</Text></View>
          </View>
          <Text style={styles.cardBody}>Stock Android often prevents ordinary apps from reading unrestricted activity from other apps. A blank result is not proof that no access occurred.</Text>
        </View>

        <View style={styles.demoCard}>
          <View style={styles.demoCopy}><Text style={styles.sectionEyebrow}>SAFE DEMONSTRATION</Text><Text style={styles.cardTitle}>Explore with labelled synthetic data</Text><Text style={styles.cardBody}>Run 50 deterministic rounds to see how the active rule pack classifies evidence. Demo events never claim to be observed device activity.</Text></View>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Run controlled synthetic demo" accessibilityState={{ disabled: isRunning }} disabled={isRunning} onPress={runControlledEvaluation} style={styles.demoButton}>
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: T.colors.canvas }, container: { flex: 1 }, content: { paddingHorizontal: 18, paddingBottom: 34 },
  brandRow: { minHeight: 76, flexDirection: 'row', alignItems: 'center' }, brandMark: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: T.colors.primary }, brandCopy: { flex: 1, marginLeft: 11 }, brand: { color: T.colors.ink, fontSize: 20, lineHeight: 25, fontWeight: '900' }, brandTagline: { color: T.colors.muted, fontSize: 12, lineHeight: 17 }, settingsButton: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: T.colors.line },
  hero: { overflow: 'hidden', padding: 22, borderRadius: T.radius.large, backgroundColor: T.colors.primaryDark }, heroGlow: { position: 'absolute', right: -35, top: -48, width: 170, height: 170, borderRadius: 85, backgroundColor: '#176F65', opacity: 0.72 }, rulePill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 11, paddingVertical: 7, borderRadius: T.radius.pill, backgroundColor: 'rgba(255,255,255,0.12)' }, ruleDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#7DE0BC' }, rulePillText: { color: '#E9FFF6', fontSize: 12, fontWeight: '800' }, heroTitle: { maxWidth: 320, color: '#FFFFFF', fontSize: 28, lineHeight: 34, fontWeight: '900', marginTop: 20 }, heroBody: { color: '#D3E8E1', fontSize: 15, lineHeight: 22, marginTop: 12 }, primaryButton: { minHeight: 56, marginTop: 21, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, borderRadius: 16, backgroundColor: '#168174' }, primaryButtonText: { color: '#FFFFFF', fontSize: 16, lineHeight: 21, fontWeight: '800' }, disabled: { opacity: 0.58 }, localRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12 }, localText: { color: '#C9E7DC', fontSize: 12, lineHeight: 17, fontWeight: '600' },
  message: { marginTop: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 9, padding: 13, borderRadius: 14, backgroundColor: T.colors.infoSoft }, messageText: { flex: 1, color: '#284D6E', fontSize: 13, lineHeight: 19 }, sectionHeadingRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginTop: 27, marginBottom: 13 }, sectionEyebrow: { color: T.colors.primary, fontSize: 11, lineHeight: 15, fontWeight: '900', letterSpacing: 0.9 }, sectionTitle: { color: T.colors.ink, fontSize: 20, lineHeight: 26, fontWeight: '900', marginTop: 4 }, updated: { flexShrink: 1, color: T.colors.muted, fontSize: 11, lineHeight: 16, textAlign: 'right' },
  metricsRow: { flexDirection: 'row', gap: 9 }, metricCard: { flex: 1, minHeight: 132, padding: 13, borderRadius: T.radius.medium, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: T.colors.line }, metricIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, metricValue: { color: T.colors.ink, fontSize: 26, lineHeight: 32, fontWeight: '900', marginTop: 12 }, metricLabel: { color: T.colors.muted, fontSize: 11, lineHeight: 15, fontWeight: '700', marginTop: 2 },
  capabilityCard: { marginTop: 16, padding: 17, borderRadius: T.radius.medium, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: T.colors.line }, capabilityTop: { flexDirection: 'row', alignItems: 'center', gap: 11 }, capabilityIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: T.colors.mint }, capabilityCopy: { flex: 1 }, cardTitle: { color: T.colors.ink, fontSize: 16, lineHeight: 21, fontWeight: '900' }, cardSubtitle: { color: T.colors.muted, fontSize: 12, lineHeight: 17, marginTop: 2 }, statusPill: { paddingHorizontal: 9, paddingVertical: 6, borderRadius: T.radius.pill }, statusAvailable: { backgroundColor: T.colors.successSoft }, statusLimited: { backgroundColor: T.colors.warningSoft }, statusPillText: { color: T.colors.ink, fontSize: 10, lineHeight: 13, fontWeight: '800' }, cardBody: { color: '#49615E', fontSize: 13, lineHeight: 20, marginTop: 12 },
  demoCard: { marginTop: 16, padding: 18, borderRadius: T.radius.medium, backgroundColor: T.colors.mint, borderWidth: 1, borderColor: T.colors.mintStrong }, demoCopy: { flex: 1 }, demoButton: { minHeight: 48, marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, backgroundColor: '#FFFFFF' }, demoButtonText: { color: T.colors.primary, fontSize: 14, lineHeight: 19, fontWeight: '900' }, resultText: { color: T.colors.primaryDark, fontSize: 12, lineHeight: 18, fontWeight: '700', marginTop: 11, textAlign: 'center' }, trustRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 22 }, trustText: { color: T.colors.muted, fontSize: 12, lineHeight: 17, fontWeight: '600' },
});
