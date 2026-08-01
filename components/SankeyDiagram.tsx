import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ScrollView } from 'react-native';
import Svg, { Path, Rect, Text as SvgText, G } from 'react-native-svg';

export interface SankeyNode {
  id: string;
  name: string;
  column: 0 | 1 | 2; // 0: Data Source, 1: Purpose, 2: Recipient
  color: string;
}

export interface SankeyLink {
  source: string;
  target: string;
  value: number; // Data transfer frequency / weight
  enabled: boolean;
  categoryRisk: 'LOW' | 'MEDIUM' | 'HIGH';
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DIAG_WIDTH = SCREEN_WIDTH - 32;
const DIAG_HEIGHT = 380;
const NODE_WIDTH = 18;

const INITIAL_NODES: SankeyNode[] = [
  // Column 0: Data Sources
  { id: 'src_hr', name: 'Heart Rate', column: 0, color: '#FF4D4F' },
  { id: 'src_geo', name: 'Geolocation', column: 0, color: '#1890FF' },
  { id: 'src_geno', name: 'Genomics', column: 0, color: '#722ED1' },
  { id: 'src_sleep', name: 'Sleep', column: 0, color: '#52C41A' },

  // Column 1: Processing Purpose
  { id: 'purp_diag', name: 'Diagnosis', column: 1, color: '#FA8C16' },
  { id: 'purp_emerg', name: 'Emergency', column: 1, color: '#F5222D' },
  { id: 'purp_res', name: 'Research', column: 1, color: '#13C2C2' },
  { id: 'purp_mkt', name: 'Marketing', column: 1, color: '#EB2F96' },

  // Column 2: Data Recipients
  { id: 'rec_doc', name: 'Physician', column: 2, color: '#2F54EB' },
  { id: 'rec_cloud', name: 'Secure Cloud', column: 2, color: '#FAAD14' },
  { id: 'rec_lab', name: 'Lab A', column: 2, color: '#A0D911' },
  { id: 'rec_ad', name: 'Ad Network', column: 2, color: '#FF7A45' },
];

const INITIAL_LINKS: SankeyLink[] = [
  { source: 'src_hr', target: 'purp_diag', value: 45, enabled: true, categoryRisk: 'LOW' },
  { source: 'src_hr', target: 'purp_res', value: 20, enabled: false, categoryRisk: 'MEDIUM' },
  { source: 'src_geo', target: 'purp_emerg', value: 30, enabled: true, categoryRisk: 'LOW' },
  { source: 'src_geo', target: 'purp_mkt', value: 50, enabled: false, categoryRisk: 'HIGH' },
  { source: 'src_geno', target: 'purp_diag', value: 15, enabled: true, categoryRisk: 'HIGH' },
  { source: 'src_sleep', target: 'purp_res', value: 25, enabled: true, categoryRisk: 'LOW' },

  { source: 'purp_diag', target: 'rec_doc', value: 60, enabled: true, categoryRisk: 'LOW' },
  { source: 'purp_emerg', target: 'rec_cloud', value: 30, enabled: true, categoryRisk: 'LOW' },
  { source: 'purp_res', target: 'rec_lab', value: 45, enabled: true, categoryRisk: 'MEDIUM' },
  { source: 'purp_mkt', target: 'rec_ad', value: 50, enabled: false, categoryRisk: 'HIGH' },
];

export const SankeyDiagram: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [links, setLinks] = useState<SankeyLink[]>(INITIAL_LINKS);

  const colX = [10, DIAG_WIDTH / 2 - NODE_WIDTH / 2, DIAG_WIDTH - NODE_WIDTH - 10];

  const getNodePos = (nodeId: string) => {
    const node = INITIAL_NODES.find((n) => n.id === nodeId);
    if (!node) return { x: 0, y: 0, height: 40 };

    const colNodes = INITIAL_NODES.filter((n) => n.column === node.column);
    const index = colNodes.findIndex((n) => n.id === nodeId);
    const spacing = 18;
    const availableHeight = DIAG_HEIGHT - 40 - colNodes.length * spacing;
    const h = availableHeight / colNodes.length;
    const y = 20 + index * (h + spacing);

    return { x: colX[node.column], y, height: h };
  };

  const createBezierPath = (srcId: string, tgtId: string) => {
    const src = getNodePos(srcId);
    const tgt = getNodePos(tgtId);

    const x0 = src.x + NODE_WIDTH;
    const y0 = src.y + src.height / 2;
    const x1 = tgt.x;
    const y1 = tgt.y + tgt.height / 2;
    const xi = (x0 + x1) / 2;

    return `M ${x0} ${y0} C ${xi} ${y0}, ${xi} ${y1}, ${x1} ${y1}`;
  };

  const toggleLinkFlow = (source: string, target: string) => {
    setLinks((prev) =>
      prev.map((l) => (l.source === source && l.target === target ? { ...l, enabled: !l.enabled } : l))
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>GDPR Dynamic Data Flow Mapping</Text>
      <Text style={styles.subtitle}>
        Visualizing health data trajectories from sources to processing purposes and third-party recipients.
      </Text>

      <View style={styles.diagramWrapper}>
        <Svg width={DIAG_WIDTH} height={DIAG_HEIGHT}>
          {links.map((link) => {
            const isSelected = selectedNode && (link.source === selectedNode || link.target === selectedNode);
            const pathData = createBezierPath(link.source, link.target);
            const strokeColor = link.enabled
              ? link.categoryRisk === 'HIGH'
                ? '#FF4D4F'
                : link.categoryRisk === 'MEDIUM'
                ? '#FAAD14'
                : '#1890FF'
              : '#D9D9D9';

            return (
              <G key={`${link.source}-${link.target}`}>
                <Path
                  d={pathData}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={Math.max(3, link.value / 4)}
                  strokeOpacity={link.enabled ? (isSelected ? 0.9 : 0.6) : 0.2}
                  strokeDasharray={link.enabled ? undefined : '4, 4'}
                  onPress={() => toggleLinkFlow(link.source, link.target)}
                />
              </G>
            );
          })}

          {INITIAL_NODES.map((node) => {
            const pos = getNodePos(node.id);
            const isSelected = selectedNode === node.id;

            return (
              <G key={node.id} onPress={() => setSelectedNode(isSelected ? null : node.id)}>
                <Rect
                  x={pos.x}
                  y={pos.y}
                  width={NODE_WIDTH}
                  height={pos.height}
                  fill={node.color}
                  rx={4}
                  stroke={isSelected ? '#000' : 'none'}
                  strokeWidth={2}
                />
                <SvgText
                  x={node.column === 2 ? pos.x - 8 : pos.x + NODE_WIDTH + 8}
                  y={pos.y + pos.height / 2 + 4}
                  fill="#262626"
                  fontSize="11"
                  fontWeight="600"
                  textAnchor={node.column === 2 ? 'end' : 'start'}
                >
                  {node.name}
                </SvgText>
              </G>
            );
          })}
        </Svg>
      </View>

      <View style={styles.labelRow}>
        <Text style={styles.colLabel}>1. Data Sources</Text>
        <Text style={styles.colLabel}>2. Processing Purpose</Text>
        <Text style={styles.colLabel}>3. Data Recipient</Text>
      </View>

      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.badge, { backgroundColor: '#1890FF' }]} />
          <Text style={styles.legendText}>Low Risk Flow</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.badge, { backgroundColor: '#FAAD14' }]} />
          <Text style={styles.legendText}>Medium Risk</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.badge, { backgroundColor: '#FF4D4F' }]} />
          <Text style={styles.legendText}>High Risk (Sharing)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.badge, { backgroundColor: '#D9D9D9' }]} />
          <Text style={styles.legendText}>Revoked (Off)</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#FFFFFF', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: '#1F1F1F', marginBottom: 4, alignSelf: 'flex-start' },
  subtitle: { fontSize: 12, color: '#8C8C8C', marginBottom: 16, alignSelf: 'flex-start' },
  diagramWrapper: { backgroundColor: '#FAFAFA', borderRadius: 8, paddingVertical: 10, borderWidth: 1, borderColor: '#F0F0F0' },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', width: DIAG_WIDTH, marginTop: 12, paddingHorizontal: 8 },
  colLabel: { fontSize: 11, fontWeight: '700', color: '#595959' },
  legendContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', width: DIAG_WIDTH, marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginRight: 12, marginBottom: 6 },
  badge: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  legendText: { fontSize: 11, color: '#595959' },
});