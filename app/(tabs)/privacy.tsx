import React, { useEffect, useState } from 'react';
import {
  DeviceEventEmitter,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ComplianceFinding } from '../../src/compliance/types';
import { ComplianceEngine } from '../../services/ComplianceEngine';
import { AuditEvent, PrivacyBridge } from '../../src/services/PrivacyBridge';
import { GDPRComplianceEngine } from '../../src/compliance/GDPRComplianceEngine';
import { calculateMetrics } from '../../src/compliance/Evaluation';
import {
  createEvaluationConfig,
  simulationToAudit,
} from '../../src/compliance/ViolationSimulator';

export default function PrivacyDashboard() {
  const [findings, setFindings] = useState<ComplianceFinding[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationSummary, setSimulationSummary] = useState<string>();

  useEffect(() => {
    PrivacyBridge.scheduleDailyAudit();
    const bridge = PrivacyBridge.initializePassiveAuditing((event: AuditEvent) => {
      if (event.permissionType) ComplianceEngine.processAudit(event);
      else if (event.eventType && event.apiName) {
        ComplianceEngine.processAuditEvent(
          event.eventType,
          event.apiName,
          event.destination ?? 'unknown',
          event.frequency ?? 1,
        );
      }
    });
    const logs = DeviceEventEmitter.addListener(
      'ON_NEW_LOG_STREAM',
      (finding: ComplianceFinding) =>
        setFindings((previous) => [finding, ...previous].slice(0, 50)),
    );
    return () => {
      bridge?.remove();
      logs.remove();
    };
  }, []);

  const runEvaluation = async () => {
    setIsSimulating(true);
    setSimulationSummary(undefined);
    const engine = new GDPRComplianceEngine();
    const samples = [];

    for (let round = 0; round < 50; round += 1) {
      const config = createEvaluationConfig(round);
      const finding = engine.evaluate(simulationToAudit(config));
      samples.push({
        expectedViolation: config.expectedViolation,
        detectedViolation: finding.isActive,
      });
      PrivacyBridge.scheduleSimulation(config);
      if ((round + 1) % 10 === 0) await new Promise((resolve) => setTimeout(resolve, 0));
    }

    const metrics = calculateMetrics(samples);
    setSimulationSummary(
      `50 rounds · TP ${metrics.truePositive} · FP ${metrics.falsePositive} · ` +
        `FN ${metrics.falseNegative} · Precision ${(metrics.precision * 100).toFixed(1)}% · ` +
        `Recall ${(metrics.recall * 100).toFixed(1)}%`,
    );
    setIsSimulating(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>GDPR permission audit</Text>
        <Text style={styles.subtitle}>Passive 24-hour review - no Root or VPN</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.secondaryButton} onPress={PrivacyBridge.runAuditNow}>
          <Text style={styles.secondaryButtonText}>Run audit now</Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Run 50-round compliance simulation"
          disabled={isSimulating}
          style={[styles.primaryButton, isSimulating && styles.disabledButton]}
          onPress={runEvaluation}
        >
          <Text style={styles.primaryButtonText}>
            {isSimulating ? 'Running 50 rounds…' : 'Run 50-round evaluation'}
          </Text>
        </TouchableOpacity>
        {simulationSummary && <Text style={styles.summary}>{simulationSummary}</Text>}
      </View>
      <FlatList
        data={findings}
        keyExtractor={(item) => `${item.id}:${item.detectedAt}`}
        ListEmptyComponent={<Text style={styles.empty}>No active findings.</Text>}
        renderItem={({ item }) => (
          <View style={[styles.card, item.isActive && styles.activeCard]}>
            <Text style={styles.cardTitle}>{item.packageName}</Text>
            <Text>{item.permissionType}: {item.violationCount} calls over threshold {item.threshold}</Text>
            <Text style={styles.risk}>{item.riskLevel} - {item.gdprArticle}</Text>
            <Text>{item.rationale}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  header: { padding: 20, backgroundColor: '#0b4f6c' },
  title: { color: 'white', fontSize: 20, fontWeight: '700' },
  subtitle: { color: '#d6edf7', marginTop: 4 },
  actions: { padding: 12, gap: 8, backgroundColor: 'white' },
  primaryButton: { padding: 12, borderRadius: 8, backgroundColor: '#0b4f6c', alignItems: 'center' },
  primaryButtonText: { color: 'white', fontWeight: '700' },
  secondaryButton: { padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#0b4f6c', alignItems: 'center' },
  secondaryButtonText: { color: '#0b4f6c', fontWeight: '700' },
  disabledButton: { opacity: 0.6 },
  summary: { color: '#344054', lineHeight: 20 },
  empty: { textAlign: 'center', color: '#667085', marginTop: 48 },
  card: { margin: 10, padding: 14, borderRadius: 10, backgroundColor: 'white' },
  activeCard: { borderLeftWidth: 5, borderLeftColor: '#d92d20' },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 5 },
  risk: { color: '#b42318', fontWeight: '600', marginVertical: 5 },
});
