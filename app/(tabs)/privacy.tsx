import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { PrivacyBridge, AuditEvent } from '../../src/services/PrivacyBridge';
import { ComplianceEngine } from '../../services/ComplianceEngine';
import { DeviceEventEmitter } from 'react-native';

interface LogItem {
  timestamp: number;
  apiName: string;
  issue: string;
  gdpr: string;
  pipl: string;
}

export default function PrivacyDashboard() {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [hasRisk, setHasRisk] = useState(false);

  useEffect(() => {
    // 1. 注册被动事件桥接，数据传递给合规引擎
    const bridgeSub = PrivacyBridge.initializePassiveAuditing((event: AuditEvent) => {
      ComplianceEngine.processAuditEvent(event.eventType, event.apiName, event.destination);
    });

    // 2. 监听合规引擎抛出的纯净日志流，更新UI列表
    const logSub = DeviceEventEmitter.addListener('ON_NEW_LOG_STREAM', (newLog: LogItem) => {
      setLogs(prev => [newLog, ...prev].slice(0, 50)); // 仅保留最近50条
      setHasRisk(true);
      
      // 3秒后移除强烈的视觉警告状态
      setTimeout(() => setHasRisk(false), 3000);
    });

    return () => {
      bridgeSub?.remove();
      logSub.remove();
    };
  }, []);

  const renderItem = ({ item }: { item: LogItem }) => (
    <View style={styles.logCard}>
      <Text style={styles.time}>{new Date(item.timestamp).toLocaleTimeString()}</Text>
      <Text style={styles.title}>API: {item.apiName}</Text>
      <Text style={styles.issue}>{item.issue}</Text>
      <View style={styles.regulationBox}>
        <Text style={styles.regulationText}>{item.gdpr}</Text>
        <Text style={styles.regulationText}>{item.pipl}</Text>
      </View>
    </View>
  );

  return (
    // HCI优化：数据流有危险时通过强烈的红色视觉边界(riskBorder)提示
    <View style={[styles.container, hasRisk && styles.riskBorder]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>被动合规监察运行中</Text>
        <Text style={styles.headerSub}>低能耗模式 (Android 专属)</Text>
      </View>
      
      <FlatList
        data={logs}
        keyExtractor={(_, index) => index.toString()}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.emptyText}>暂无异常审计记录</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  riskBorder: { borderWidth: 3, borderColor: 'red' }, // 强烈的红色视觉边界提示
  header: { padding: 20, backgroundColor: '#005b9f', alignItems: 'center' },
  headerTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  headerSub: { color: '#a0c4ff', fontSize: 12, marginTop: 4 },
  logCard: { backgroundColor: 'white', margin: 10, padding: 15, borderRadius: 8, elevation: 2 },
  time: { fontSize: 12, color: '#888' },
  title: { fontSize: 16, fontWeight: 'bold', marginVertical: 5 },
  issue: { fontSize: 14, color: '#e65100', marginBottom: 8 },
  regulationBox: { backgroundColor: '#ffe0b2', padding: 8, borderRadius: 4 },
  regulationText: { fontSize: 12, color: '#bf360c', marginVertical: 2 },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#999' }
});