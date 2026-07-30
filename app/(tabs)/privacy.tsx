import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { ComplianceFinding } from '../../src/compliance/types';
import { ComplianceEngine } from '../../services/ComplianceEngine';
import { AuditEvent, PrivacyBridge } from '../../src/services/PrivacyBridge';
import { DeviceEventEmitter } from 'react-native';

export default function PrivacyDashboard() {
  const [findings, setFindings] = useState<ComplianceFinding[]>([]);

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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>GDPR permission audit</Text>
        <Text style={styles.subtitle}>Passive 24-hour review - no Root or VPN</Text>
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
  empty: { textAlign: 'center', color: '#667085', marginTop: 48 },
  card: { margin: 10, padding: 14, borderRadius: 10, backgroundColor: 'white' },
  activeCard: { borderLeftWidth: 5, borderLeftColor: '#d92d20' },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 5 },
  risk: { color: '#b42318', fontWeight: '600', marginVertical: 5 },
});
