import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { PrivacyBridge } from '../src/services/PrivacyBridge';

interface Props {
    taskId: number;
    variant?: 'visual';
    onInteraction?: (result: { isCorrect: boolean, isError: boolean, latency: number }) => void;
}

export function DynamicDashboard({ taskId, onInteraction }: Props) {
  const [isLdpEnabled, setIsLdpEnabled] = useState(false);
  const [syncLatency, setSyncLatency] = useState<number | null>(null);

  const [nodes, setNodes] = useState({
      local: [
          { id: 'step_counter', label: 'Local Pedometer', color: '#4CAF50', active: true, isTrap: false },
          { id: 'sleep_monitor', label: 'Sleep Analysis', color: '#4CAF50', active: true, isTrap: false }
      ],
      domestic: [
          { id: 'cloud_backup', label: 'Encrypted Vault', color: '#81C784', active: true, isTrap: false },
          { id: 'workout_social', label: 'Social Sync', color: '#81C784', active: true, isTrap: false },
          { id: 'ai_workout', label: 'AI Coach', color: '#81C784', active: true, isTrap: false }
      ],
      thirdParty: [
          { id: 'device_analytics', label: 'Crash Reports', color: '#FFB74D', active: true, isTrap: false }
      ]
  });

  useEffect(() => {
      let initialNodes = {
        local: [
            { id: 'step_counter', label: 'Local Pedometer', color: '#4CAF50', active: taskId !== 2, isTrap: false },
            { id: 'sleep_monitor', label: 'Sleep Analysis', color: '#4CAF50', active: taskId !== 2, isTrap: false }
        ],
        domestic: [
            { id: 'cloud_backup', label: 'Encrypted Vault', color: '#81C784', active: taskId !== 2, isTrap: false },
            { id: 'workout_social', label: 'Social Sync', color: '#81C784', active: taskId !== 2, isTrap: false },
            { id: 'ai_workout', label: 'AI Coach', color: '#81C784', active: taskId !== 2, isTrap: false }
        ],
        thirdParty: [
            { id: 'device_analytics', label: 'Crash Reports', color: '#FFB74D', active: taskId !== 2, isTrap: false }
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
      }

      setNodes(initialNodes);
  }, [taskId]);

  const handleNodePress = async (node: any, category: string) => {
      let isCorrectAction = false;
      let isError = false;
      let newActiveState = !node.active;

      if (node.isTrap) {
          if ((taskId === 1 || taskId === 3 || taskId === 4) && newActiveState === false) isCorrectAction = true;
          if (taskId === 2 && newActiveState === true) isCorrectAction = true;
      } else {
          isError = true;
      }

      const response = await PrivacyBridge.invokeInterceptor(node.id, isLdpEnabled, node.isTrap);
      setSyncLatency(response.latencyMs);

      const newColor = taskId === 2 && newActiveState ? '#D32F2F' : (newActiveState ? node.color : '#E0E0E0');
      
      setNodes(prev => ({
          ...prev,
          [category]: prev[category as keyof typeof prev].map(n => 
              n.id === node.id ? { ...n, active: newActiveState, color: newColor } : n
          )
      }));

      if (onInteraction) {
         onInteraction({ isCorrect: isCorrectAction, isError: isError, latency: response.latencyMs });
      }
  };

  const renderNodeGroup = (title: string, category: keyof typeof nodes, desc: string) => (
      <View style={styles.nodeGroup}>
          <Text style={styles.groupTitle}>{title}</Text>
          <Text style={styles.groupDesc}>{desc}</Text>
          <View style={styles.nodeContainer}>
              {nodes[category].map(node => (
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
      {renderNodeGroup('Zone 3: External & Cross-Border', 'thirdParty', 'WARNING: Subject to foreign laws or third-party ADM algorithms.')}

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
  node: { width: '48%', padding: 15, borderRadius: 8, alignItems: 'center', marginBottom: 10, elevation: 2 },
  nodeText: { color: '#fff', fontWeight: 'bold', fontSize: 12, textAlign: 'center' },
  blockedText: { color: '#fff', fontSize: 10, marginTop: 4, fontWeight: '900' },
  latencyBox: { marginTop: 10, backgroundColor: '#E8F5E9', padding: 10, borderRadius: 8 },
  latencyText: { color: '#2E7D32', fontSize: 12, fontWeight: 'bold', textAlign: 'center' }
});