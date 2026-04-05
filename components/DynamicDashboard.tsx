import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { PrivacyBridge } from '../src/services/PrivacyBridge';
import DataFlowVisualizer from './DataFlowVisualizer'; // 引入桑基图验证组件

interface Props {
    taskId: number;
    variant?: 'visual';
    onInteraction?: (result: { isCorrect: boolean, isError: boolean, latency: number }) => void;
}

export function DynamicDashboard({ taskId, onInteraction }: Props) {
  const [isLdpEnabled, setIsLdpEnabled] = useState(false);
  const [syncLatency, setSyncLatency] = useState<number | null>(null);
  const [nodes, setNodes] = useState<any>({ local: [], domestic: [], thirdParty: [] });

  useEffect(() => {
      // 扩展至 18 节点，与 Standard Settings 保持相同的认知负荷
      let initialNodes = {
        local: [
            { id: 'step_counter', label: 'Pedometer', color: '#4CAF50', active: taskId !== 2, isTrap: false },
            { id: 'sleep_monitor', label: 'Sleep Analysis', color: '#4CAF50', active: taskId !== 2, isTrap: false },
            { id: 'water_logger', label: 'Hydration', color: '#4CAF50', active: taskId !== 2, isTrap: false },
            { id: 'menstrual_cal', label: 'Cycle Cal', color: '#4CAF50', active: taskId !== 2, isTrap: false },
            { id: 'blood_pressure', label: 'BP Log', color: '#4CAF50', active: taskId !== 2, isTrap: false },
            { id: 'local_voice', label: 'Voice Cmds', color: '#4CAF50', active: taskId !== 2, isTrap: false }
        ],
        domestic: [
            { id: 'calorie_calc', label: 'Calorie', color: '#81C784', active: taskId !== 2, isTrap: false },
            { id: 'heart_rate_var', label: 'HRV Monitor', color: '#81C784', active: taskId !== 2, isTrap: false },
            { id: 'workout_social', label: 'Social Sync', color: '#81C784', active: taskId !== 2, isTrap: false },
            { id: 'cloud_backup', label: 'Vault', color: '#81C784', active: taskId !== 2, isTrap: false },
            { id: 'device_analytics', label: 'Crash Reports', color: '#81C784', active: taskId !== 2, isTrap: false },
            { id: 'ai_workout', label: 'AI Coach', color: '#81C784', active: taskId !== 2, isTrap: false },
            { id: 'diet_plan', label: 'Dietary', color: '#81C784', active: taskId !== 2, isTrap: false },
            { id: 'med_reminders', label: 'Med Sync', color: '#81C784', active: taskId !== 2, isTrap: false }
        ],
        thirdParty: [
            { id: 'ad_network', label: 'Global Ads', color: '#FFB74D', active: taskId !== 2, isTrap: false },
            { id: 'social_meta', label: 'Social Media', color: '#FFB74D', active: taskId !== 2, isTrap: false },
            { id: 'wearable_api', label: 'External API', color: '#FFB74D', active: taskId !== 2, isTrap: false },
            { id: 'academic_pool', label: 'Research Pool', color: '#FFB74D', active: taskId !== 2, isTrap: false }
        ]
      };

      if (taskId === 1) {
          initialNodes.thirdParty.push({ id: 'hormone_eu', label: 'Hormone Analytics (EU)', color: '#E65100', active: true, isTrap: true });
      } else if (taskId === 2) {
          initialNodes.thirdParty.push({ id: 'emergency_911', label: 'Paramedic Dispatch', color: '#9E9E9E', active: false, isTrap: true });
      } else if (taskId === 3) {
          initialNodes.thirdParty.push({ id: 'genetic_registry', label: 'DNA Registry Archive', color: '#673AB7', active: true, isTrap: true });
      } else if (taskId === 4) {
          initialNodes.thirdParty.push({ id: 'adm_insurance', label: 'Insurance Broker AI', color: '#D84315', active: true, isTrap: true });
      } else if (taskId === 5) {
          initialNodes.thirdParty.push({ id: 'biometric_visual', label: 'Raw Biometric Flow', color: '#C2185B', active: true, isTrap: true });
      }

      setNodes(initialNodes);
  }, [taskId]);

  const handleNodePress = async (node: any, category: string) => {
      let isCorrectAction = false;
      let isError = false;
      let newActiveState = !node.active;

      if (node.isTrap) {
          if ((taskId === 1 || taskId === 3 || taskId === 4 || taskId === 5) && newActiveState === false) isCorrectAction = true;
          if (taskId === 2 && newActiveState === true) isCorrectAction = true;
      } else {
          isError = true;
      }

      const response = await PrivacyBridge.invokeInterceptor(node.id, isLdpEnabled, node.isTrap);
      setSyncLatency(response.latencyMs);

      const newColor = taskId === 2 && newActiveState ? '#D32F2F' : (newActiveState ? node.color : '#E0E0E0');
      
      setNodes((prev: any) => ({
          ...prev,
          [category]: prev[category].map((n: any) => 
              n.id === node.id ? { ...n, active: newActiveState, color: newColor } : n
          )
      }));

      if (onInteraction) onInteraction({ isCorrect: isCorrectAction, isError: isError, latency: response.latencyMs });
  };

  const renderNodeGroup = (title: string, category: string, desc: string) => (
      <View style={styles.nodeGroup}>
          <Text style={styles.groupTitle}>{title}</Text>
          <Text style={styles.groupDesc}>{desc}</Text>
          <View style={styles.nodeContainer}>
              {nodes[category]?.map((node: any) => (
                  <TouchableOpacity 
                      key={node.id} 
                      style={[styles.node, { backgroundColor: node.color, opacity: node.active ? 1 : 0.6 }]}
                      onPress={() => handleNodePress(node, category)}
                  >
                      <Text style={styles.nodeText}>{node.label}</Text>
                      {!node.active && <Text style={styles.blockedText}>{taskId === 3 && node.isTrap ? 'DESTROYED' : 'SEVERED'}</Text>}
                  </TouchableOpacity>
              ))}
          </View>
      </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{paddingBottom: 40}}>
      {taskId === 5 && (
              <DataFlowVisualizer
                // 使用 ?. 安全访问，防止 useEffect 还没运行完时 nodes.thirdParty 里找不到该节点
                isHighRisk={nodes.thirdParty?.find((n:any) => n.id === 'biometric_visual')?.active ?? false}
                isLdpEnabled={isLdpEnabled}
                onBlockAction={() => {
                    // 增加防御性判断，只有在节点真实存在时才触发拦截操作
                    const targetNode = nodes.thirdParty?.find((n:any) => n.id === 'biometric_visual');
                    if (targetNode) {
                        handleNodePress(targetNode, 'thirdParty');
                    }
                }}
              />
            )}

      {taskId !== 2 && (
          <View style={styles.settingRow}>
            <View style={styles.textWrapper}>
              <Text style={styles.label}>LDP Anonymization</Text>
              <Text style={styles.desc}>Apply visual 'Blurry Path' to downgrade risk.</Text>
            </View>
            <Switch value={isLdpEnabled} onValueChange={setIsLdpEnabled} />
          </View>
      )}

      {renderNodeGroup('Zone 1: Local Device', 'local', 'Data stays on your physical phone.')}
      {renderNodeGroup('Zone 2: Domestic Cloud', 'domestic', 'Data encrypted in local jurisdiction servers.')}
      {renderNodeGroup('Zone 3: External & Cross-Border', 'thirdParty', 'WARNING: Subject to foreign laws.')}

      {syncLatency !== null && (
        <View style={styles.latencyBox}>
           <Text style={styles.latencyText}>✓ Native Architecture Synced: {syncLatency}ms</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 15, elevation: 1 },
  textWrapper: { flex: 1, paddingRight: 10 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  desc: { fontSize: 11, color: '#666', marginTop: 4 },
  nodeGroup: { marginBottom: 20, backgroundColor: '#fff', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#eee' },
  groupTitle: { fontSize: 16, fontWeight: 'bold', color: '#1565C0' },
  groupDesc: { fontSize: 12, color: '#757575', marginBottom: 10 },
  nodeContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  node: { width: '31%', padding: 10, borderRadius: 8, alignItems: 'center', marginBottom: 10, elevation: 2 }, // 缩小宽度以容纳更多节点
  nodeText: { color: '#fff', fontWeight: 'bold', fontSize: 10, textAlign: 'center' },
  blockedText: { color: '#fff', fontSize: 9, marginTop: 4, fontWeight: '900' },
  latencyBox: { marginTop: 10, backgroundColor: '#E8F5E9', padding: 10, borderRadius: 8 },
  latencyText: { color: '#2E7D32', fontSize: 12, fontWeight: 'bold', textAlign: 'center' }
});