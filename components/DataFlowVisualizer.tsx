import { BlurMask, Canvas, Path, Skia } from '@shopify/react-native-skia';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface DataFlowProps {
  isHighRisk: boolean; // 是否是高风险跨境传输
  isLdpEnabled: boolean; // 是否开启了本地差分隐私 (The Blurry Path)
  onBlockAction: () => void;
}

export default function DataFlowVisualizer({ isHighRisk, isLdpEnabled, onBlockAction }: DataFlowProps) {
  // 构建从左侧(App)到右侧(第三方)的桑基图曲线
  const path = Skia.Path.Make();
  path.moveTo(50, 100);
  path.cubicTo(150, 100, 150, 200, 250, 200);

  // 根据高风险预警改变颜色 (RQ1要求: Green -> Orange)
  const pathColor = isHighRisk && !isLdpEnabled ? "#FF9800" : "#4CAF50";

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Data Flow: App ➔ Third-Party API</Text>
      
      <View style={styles.canvasWrapper}>
        <Canvas style={{ flex: 1 }}>
          <Path
            path={path}
            color={pathColor}
            style="stroke"
            strokeWidth={15}
          >
            {/* LDP 差分隐私的视觉反馈：模糊路径 (The Blurry Path) */}
            {isLdpEnabled && <BlurMask blur={8} style="normal" />}
          </Path>
        </Canvas>
        
        {/* 节点标签 */}
        <View style={[styles.node, { top: 75, left: 10 }]}><Text style={styles.nodeText}>Local</Text></View>
        <View style={[styles.node, { top: 175, left: 240 }]}><Text style={styles.nodeText}>Overseas</Text></View>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity 
          style={[styles.btn, isHighRisk && !isLdpEnabled ? styles.btnAlert : styles.btnSafe]} 
          onPress={onBlockAction}
        >
          <Text style={styles.btnText}>
            {isHighRisk && !isLdpEnabled ? "Block High-Risk Flow" : "Flow Secured"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginVertical: 10, elevation: 2 },
  title: { fontSize: 16, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  canvasWrapper: { height: 250, backgroundColor: '#F8F9FA', borderRadius: 8, position: 'relative' },
  node: { position: 'absolute', backgroundColor: '#333', padding: 8, borderRadius: 8 },
  nodeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  controls: { marginTop: 15, alignItems: 'center' },
  btn: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, width: '100%', alignItems: 'center' },
  btnAlert: { backgroundColor: '#FF5252' },
  btnSafe: { backgroundColor: '#4CAF50' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});