import React, { useEffect, useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { useExperiment } from '../src/context/ExperimentContext';
import { PrivacyBridge } from '../src/services/PrivacyBridge';
import DataFlowVisualizer from './DataFlowVisualizer';

export function DynamicDashboard() {
  const { group, startTask, finishTask, logEvent } = useExperiment();
  
  const [isLdpEnabled, setIsLdpEnabled] = useState(false);
  const [isHighRiskFlow, setIsHighRiskFlow] = useState(true); // 初始模拟为高风险（如跨境传输）
  const [syncLatency, setSyncLatency] = useState<number | null>(null);

  // 组件加载时启动遥测计时
  useEffect(() => {
    startTask();
    return () => finishTask(); // 卸载时记录总耗时
  }, []);

  const handleBlockAction = async () => {
    logEvent('CLICK_BLOCK', 'Overseas_Flow');
    
    // 调用底层原生 API 拦截
    const response = await PrivacyBridge.invokeInterceptor('HealthKit_Steps', isLdpEnabled);
    
    // RQ2: 记录同步延迟
    setSyncLatency(response.latencyMs);
    logEvent('API_BLOCKED', 'HealthKit_Steps', response.latencyMs);

    if (response.success) {
      setIsHighRiskFlow(false); // 阻断成功，风险解除
    }
  };

  const toggleLdp = (value: boolean) => {
    setIsLdpEnabled(value);
    logEvent('TOGGLE_LDP', value ? 'ON' : 'OFF');
  };

  // 根据分组渲染不同界面 (RQ1 要求的对照组设计)
  if (group === 'A') {
    return <View><Text>Group A: Standard Setting List (Fallback)</Text></View>;
  }

  if (group === 'C') {
    return <View><Text>Group C: Static Text Based List</Text></View>;
  }

  // 默认 Group B: 动态仪表盘干预组
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Privacy Enforcement Architecture</Text>
      
      <View style={styles.settingRow}>
        <View>
          <Text style={styles.label}>Local Differential Privacy (LDP)</Text>
          <Text style={styles.desc}>Anonymize data before sharing</Text>
        </View>
        <Switch value={isLdpEnabled} onValueChange={toggleLdp} />
      </View>

      {/* Skia 可视化组件 */}
      <DataFlowVisualizer 
        isHighRisk={isHighRiskFlow} 
        isLdpEnabled={isLdpEnabled} 
        onBlockAction={handleBlockAction} 
      />

      {/* 显示物理层面的同步反馈 (RQ2 架构控制信任) */}
      {syncLatency !== null && (
        <Text style={styles.latencyText}>
          ✓ Native API status verified. Sync latency: {syncLatency}ms
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 15 },
  label: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  desc: { fontSize: 12, color: '#666', marginTop: 4 },
  latencyText: { marginTop: 10, color: '#4CAF50', fontSize: 13, fontWeight: '500', textAlign: 'center' }
});