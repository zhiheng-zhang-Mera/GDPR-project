import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { DeviceEventEmitter, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ComplianceFinding, ProcessingContext } from '../../src/compliance/types';
import { DashboardFilter, filterFindings, STATUS_PRESENTATION, summarizeFindings } from '../../src/compliance/DashboardModel';
import { ComplianceEngine } from '../../services/ComplianceEngine';
import { AuditEvent, PrivacyBridge } from '../../src/services/PrivacyBridge';
import { GDPRComplianceEngine } from '../../src/compliance/GDPRComplianceEngine';
import { calculateMetrics } from '../../src/compliance/Evaluation';
import { createEvaluationConfig, simulationToAudit } from '../../src/compliance/ViolationSimulator';

const TEST_CONTEXT: ProcessingContext = {
  purpose: 'Controlled local compliance evaluation', lawfulBasis: 'LEGITIMATE_INTERESTS',
  controllerIdentity: 'Research prototype operator', retentionDays: 1, userInitiated: true,
};

const STATUS_STYLE = {
  LIKELY_NON_COMPLIANT: { backgroundColor: '#FDE7E7', color: '#7A1111', borderColor: '#B42318' },
  REVIEW_REQUIRED: { backgroundColor: '#FFF2CC', color: '#5C4300', borderColor: '#8A6100' },
  INSUFFICIENT_EVIDENCE: { backgroundColor: '#E8EEFF', color: '#173B7A', borderColor: '#315EA8' },
  NO_TECHNICAL_CONCERN: { backgroundColor: '#E5F5EB', color: '#14532D', borderColor: '#237A43' },
} as const;

const SIGNAL_LABEL = { DAILY_TOTAL: 'daily total', BURST_RATE: 'burst rate', CROSS_WINDOW: 'cross-window' } as const;

const METRIC_STYLE = {
  action: { icon: 'alert-circle-outline', color: '#9F2D20', backgroundColor: '#FFF1EF' },
  evidence: { icon: 'document-text-outline', color: '#8A6100', backgroundColor: '#FFF8E1' },
  noConcern: { icon: 'checkmark-circle-outline', color: '#237A43', backgroundColor: '#EDF8F1' },
} as const;

const FindingCard = memo(function FindingCard({ finding }: { finding: ComplianceFinding }) {
  const [expanded, setExpanded] = useState(false);
  const status = STATUS_PRESENTATION[finding.compliance.status];
  const tone = STATUS_STYLE[finding.compliance.status];
  return (
    <TouchableOpacity
      accessibilityRole="button" accessibilityState={{ expanded }}
      accessibilityLabel={`${status.label}. ${finding.permissionType}. ${finding.packageName}`}
      accessibilityHint={expanded ? 'Collapses audit evidence' : 'Shows audit evidence and recommended action'}
      activeOpacity={0.86} onPress={() => setExpanded((value) => !value)}
      style={[styles.card, { borderLeftColor: tone.borderColor }]}
    >
      <View style={styles.cardTop}>
        <View style={styles.cardHeading}>
          <Text style={styles.cardTitle}>{finding.permissionType}</Text>
          <Text style={styles.packageName} numberOfLines={1}>{finding.packageName}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: tone.backgroundColor }]}>
          <Text style={[styles.statusText, { color: tone.color }]}>{status.marker} {status.label}</Text>
        </View>
      </View>
      <Text style={styles.summaryText}>{finding.communication.summary}</Text>
      <Text style={styles.actionText}>Next: {finding.communication.recommendedAction}</Text>
      {expanded && (
        <View style={styles.details}>
          <Text style={styles.detailTitle}>Technical evidence</Text>
          <Text style={styles.detailText}>Daily {finding.evidence.dailyCount} · Peak/min {finding.evidence.peakCallsPerMinute} · Rolling {finding.evidence.rollingCount}</Text>
          <Text style={styles.detailText}>Signals: {finding.signals.length ? finding.signals.map((signal) => SIGNAL_LABEL[signal]).join(', ') : 'none'}</Text>
          <Text style={styles.detailTitle}>Compliance context</Text>
          <Text style={styles.detailText}>{finding.gdprArticle}</Text>
          <Text style={styles.detailText}>Evidence gaps: {finding.compliance.missingEvidence.join(', ') || 'none recorded'}</Text>
          <Text style={styles.caveat}>{finding.compliance.legalCaveat}</Text>
        </View>
      )}
      <Text style={styles.expandText}>{expanded ? 'Hide evidence' : 'View evidence'}</Text>
    </TouchableOpacity>
  );
});

export default function PrivacyDashboard() {
  const [findings, setFindings] = useState<ComplianceFinding[]>([]);
  const [filter, setFilter] = useState<DashboardFilter>('ALL');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationSummary, setSimulationSummary] = useState<string>();

  useEffect(() => {
    PrivacyBridge.scheduleDailyAudit();
    const bridge = PrivacyBridge.initializePassiveAuditing((event: AuditEvent) => {
      if (event.permissionType) ComplianceEngine.processAudit(event);
      else if (event.eventType && event.apiName) ComplianceEngine.processAuditEvent(event.eventType, event.apiName, event.destination ?? 'unknown', event.frequency ?? 1);
    });
    const logs = DeviceEventEmitter.addListener('ON_NEW_LOG_STREAM', (finding: ComplianceFinding) =>
      setFindings((previous) => [finding, ...previous].slice(0, 50)));
    return () => { bridge?.remove(); logs.remove(); };
  }, []);

  const runEvaluation = useCallback(async () => {
    setIsSimulating(true);
    setSimulationSummary(undefined);
    const engine = new GDPRComplianceEngine();
    const samples = [];
    const latest = new Map<string, ComplianceFinding>();
    for (let round = 0; round < 50; round += 1) {
      const config = createEvaluationConfig(round);
      const audit = { ...simulationToAudit(config), source: 'SIMULATOR' as const, processingContext: TEST_CONTEXT };
      const finding = engine.evaluate(audit);
      samples.push({ expectedViolation: config.expectedViolation, detectedViolation: finding.isActive });
      latest.set(finding.permissionType, finding);
      PrivacyBridge.scheduleSimulation(config);
      if ((round + 1) % 10 === 0) await new Promise((resolve) => setTimeout(resolve, 0));
    }
    const metrics = calculateMetrics(samples);
    setFindings((previous) => [...latest.values(), ...previous].slice(0, 50));
    setSimulationSummary(`50 rounds complete · TP ${metrics.truePositive} · FP ${metrics.falsePositive} · FN ${metrics.falseNegative} · Precision ${(metrics.precision * 100).toFixed(1)}% · Recall ${(metrics.recall * 100).toFixed(1)}%`);
    setIsSimulating(false);
  }, []);

  const summary = useMemo(() => summarizeFindings(findings), [findings]);
  const visibleFindings = useMemo(() => filterFindings(findings, filter), [findings, filter]);
  const renderFinding = useCallback(({ item }: { item: ComplianceFinding }) => <FindingCard finding={item} />, []);
  const filters: { key: DashboardFilter; label: string }[] = [
    { key: 'ALL', label: `All ${summary.total}` }, { key: 'ACTION', label: `Action ${summary.action}` }, { key: 'EVIDENCE', label: `Evidence ${summary.evidence}` },
  ];

  const header = (
    <View>
      <View style={styles.header}>
        <View style={styles.eyebrowRow}>
          <View style={styles.heroIcon}><Ionicons name="shield-checkmark" size={20} color="#D9F3EE" /></View>
          <Text style={styles.eyebrow}>ON-DEVICE PRIVACY REVIEW</Text>
        </View>
        <Text accessibilityRole="header" style={styles.title}>Privacy accountability</Text>
        <Text style={styles.subtitle}>Local technical evidence with human-review safeguards</Text>
      </View>
      <View style={styles.notice}>
        <Ionicons name="information-circle-outline" size={22} color="#173B7A" />
        <Text style={styles.noticeText}>A warning is not a legal verdict. Data availability depends on deployment authority and Android platform access.</Text>
      </View>
      <View style={styles.metrics}>
        <View style={styles.metric}><View style={[styles.metricIcon, { backgroundColor: METRIC_STYLE.action.backgroundColor }]}><Ionicons name={METRIC_STYLE.action.icon} size={18} color={METRIC_STYLE.action.color} /></View><Text style={styles.metricValue}>{summary.action}</Text><Text style={styles.metricLabel}>Needs action</Text></View>
        <View style={styles.metric}><View style={[styles.metricIcon, { backgroundColor: METRIC_STYLE.evidence.backgroundColor }]}><Ionicons name={METRIC_STYLE.evidence.icon} size={18} color={METRIC_STYLE.evidence.color} /></View><Text style={styles.metricValue}>{summary.evidence}</Text><Text style={styles.metricLabel}>Evidence gaps</Text></View>
        <View style={styles.metric}><View style={[styles.metricIcon, { backgroundColor: METRIC_STYLE.noConcern.backgroundColor }]}><Ionicons name={METRIC_STYLE.noConcern.icon} size={18} color={METRIC_STYLE.noConcern.color} /></View><Text style={styles.metricValue}>{summary.noConcern}</Text><Text style={styles.metricLabel}>No concern</Text></View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Run permission audit now" style={styles.secondaryButton} onPress={PrivacyBridge.runAuditNow}>
          <Ionicons name="scan-outline" size={20} color="#084B63" />
          <Text style={styles.secondaryButtonText}>Run audit now</Text>
        </TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Run 50-round controlled evaluation" accessibilityState={{ disabled: isSimulating }} disabled={isSimulating} style={[styles.primaryButton, isSimulating && styles.disabledButton]} onPress={runEvaluation}>
          <Ionicons name="flask-outline" size={20} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>{isSimulating ? 'Running 50 rounds…' : 'Run 50-round evaluation'}</Text>
        </TouchableOpacity>
        {simulationSummary && <Text accessibilityLiveRegion="polite" style={styles.evaluationSummary}>{simulationSummary}</Text>}
      </View>
      <View accessibilityRole="tablist" style={styles.filters}>
        {filters.map((item) => (
          <TouchableOpacity key={item.key} accessibilityRole="tab" accessibilityState={{ selected: filter === item.key }} onPress={() => setFilter(item.key)} style={[styles.filterButton, filter === item.key && styles.filterSelected]}>
            <Text style={[styles.filterText, filter === item.key && styles.filterTextSelected]}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <FlatList style={styles.container} contentContainerStyle={styles.content} data={visibleFindings}
      keyExtractor={(item) => `${item.id}:${item.detectedAt}`} renderItem={renderFinding}
      ListHeaderComponent={header} ListEmptyComponent={<View style={styles.empty}><View style={styles.emptyIcon}><Ionicons name="shield-checkmark-outline" size={30} color="#0B5D7A" /></View><Text style={styles.emptyTitle}>Ready for a local review</Text><Text style={styles.emptyText}>Run an audit or controlled evaluation to populate this evidence view.</Text></View>}
      initialNumToRender={6} maxToRenderPerBatch={6} windowSize={5} removeClippedSubviews />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7FA' }, content: { paddingBottom: 32 },
  header: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 22, backgroundColor: '#123B5D' },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 12 }, heroIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(217,243,238,0.14)' }, eyebrow: { color: '#BFDDE7', fontSize: 11, lineHeight: 16, fontWeight: '800', letterSpacing: 1.1 },
  title: { color: '#FFFFFF', fontSize: 26, lineHeight: 32, fontWeight: '800' }, subtitle: { color: '#E4F0F7', marginTop: 6, fontSize: 15, lineHeight: 21 },
  notice: { margin: 14, marginBottom: 8, padding: 14, borderRadius: 12, backgroundColor: '#E8EEFF', flexDirection: 'row', gap: 10 }, noticeText: { flex: 1, color: '#173B7A', lineHeight: 20 },
  metrics: { marginHorizontal: 14, marginVertical: 6, flexDirection: 'row', gap: 8 }, metric: { flex: 1, minHeight: 104, justifyContent: 'center', padding: 10, borderRadius: 14, backgroundColor: '#FFFFFF', elevation: 1, shadowColor: '#0A2B3D', shadowOpacity: 0.07, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } }, metricIcon: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginBottom: 7 },
  metricValue: { color: '#12212E', fontSize: 24, fontWeight: '800' }, metricLabel: { color: '#465B6B', fontSize: 12, marginTop: 3 },
  actions: { margin: 14, gap: 10 }, primaryButton: { minHeight: 54, paddingHorizontal: 16, borderRadius: 14, backgroundColor: '#0B5D7A', flexDirection: 'row', gap: 9, alignItems: 'center', justifyContent: 'center', elevation: 2 }, primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  secondaryButton: { minHeight: 54, paddingHorizontal: 16, borderRadius: 14, borderWidth: 2, borderColor: '#0B5D7A', flexDirection: 'row', gap: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' }, secondaryButtonText: { color: '#084B63', fontSize: 16, fontWeight: '700' }, disabledButton: { opacity: 0.55 }, evaluationSummary: { color: '#263B4A', lineHeight: 21 },
  filters: { paddingHorizontal: 14, paddingBottom: 6, flexDirection: 'row', gap: 8 }, filterButton: { flex: 1, minHeight: 48, borderRadius: 24, borderWidth: 1, borderColor: '#7B8D9A', justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }, filterSelected: { backgroundColor: '#123B5D', borderColor: '#123B5D' }, filterText: { color: '#314A5B', fontWeight: '700', fontSize: 13 }, filterTextSelected: { color: '#FFFFFF' },
  empty: { alignItems: 'center', marginHorizontal: 28, marginTop: 34, padding: 22, borderRadius: 18, borderWidth: 1, borderColor: '#DCE6EC', backgroundColor: '#FFFFFF' }, emptyIcon: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E6F3F6', marginBottom: 12 }, emptyTitle: { color: '#12212E', fontSize: 17, fontWeight: '800' }, emptyText: { textAlign: 'center', color: '#526776', marginTop: 6, lineHeight: 21 }, card: { marginHorizontal: 14, marginTop: 12, minHeight: 120, padding: 16, borderRadius: 14, borderLeftWidth: 6, backgroundColor: '#FFFFFF' },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 }, cardHeading: { flex: 1 }, cardTitle: { color: '#12212E', fontSize: 17, fontWeight: '800' }, packageName: { color: '#526776', marginTop: 3 }, statusBadge: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 16 }, statusText: { fontSize: 12, fontWeight: '800' },
  summaryText: { color: '#253A49', lineHeight: 21, marginTop: 12 }, actionText: { color: '#12212E', fontWeight: '600', lineHeight: 21, marginTop: 8 }, details: { marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#D7E0E6' }, detailTitle: { color: '#12212E', fontWeight: '800', marginTop: 6, marginBottom: 3 }, detailText: { color: '#405766', lineHeight: 20 }, caveat: { color: '#5A4A18', lineHeight: 20, marginTop: 9, fontStyle: 'italic' }, expandText: { color: '#075A78', fontWeight: '800', marginTop: 12 },
});
