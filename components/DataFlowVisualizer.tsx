import React from 'react';
import { StyleSheet, View } from 'react-native';
import { usePrivacy } from '../src/context/PrivacyContext';
import { ThemedText } from './themed-text';
import { IconSymbol } from './ui/icon-symbol';

export function DataFlowVisualizer() {
  const { consents } = usePrivacy();

  return (
    <View style={styles.container}>
      <ThemedText type="defaultSemiBold">数据实时流向图</ThemedText>
      <View style={styles.flowContainer}>
        <View style={styles.node}><ThemedText>设备传感器</ThemedText></View>

        {/* 连接线逻辑：基于同意状态改变颜色 */}
        <View style={[styles.line, consents.heart_rate ? styles.lineActive : styles.lineInactive]} />

        <View style={styles.node}>
          <IconSymbol name="shield.fill" size={24} color={consents.heart_rate ? "#4CAF50" : "#ccc"} />
          <ThemedText>应用数据库</ThemedText>
        </View>

        <View style={[styles.line, consents.third_party_sync ? styles.lineActive : styles.lineInactive]} />

        <View style={styles.node}><ThemedText>外部机构</ThemedText></View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 12, marginVertical: 10 },
  flowContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 15 },
  node: { alignItems: 'center', flex: 1 },
  line: { height: 2, flex: 1, marginHorizontal: 5 },
  lineActive: { backgroundColor: '#4CAF50' },
  lineInactive: { backgroundColor: '#ccc', borderStyle: 'dashed', borderWidth: 1 },
});