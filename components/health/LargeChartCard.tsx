import { useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get("window").width;
const TOOLTIP_WIDTH = 64; // 固定气泡宽度以便精确对齐
const CHART_OFFSET_LEFT = -15; // 对应图表样式的 marginLeft

export default function LargeChartCard({ label, value, unit, color, data, labels }) {
  const chartWidth = screenWidth - 40;
  const [tooltip, setTooltip] = useState({ visible: false, value: 0, x: 0, y: 0 });

  const handlePointClick = (dataPoint) => {
    // 如果重复点击同一点，则关闭气泡
    if (tooltip.visible && tooltip.value === dataPoint.value) {
      setTooltip({ ...tooltip, visible: false });
    } else {
      setTooltip({
        visible: true,
        value: dataPoint.value,
        x: dataPoint.x,
        y: dataPoint.y
      });
    }
  };

  return (
    <View style={[styles.card, { borderLeftColor: color }]}>
      <View style={styles.textRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value} <Text style={styles.unit}>{unit}</Text></Text>
      </View>

      <View style={styles.chartWrapper}>
        <LineChart
          data={{ labels: labels, datasets: [{ data: data }] }}
          width={chartWidth}
          height={200}
          onDataPointClick={handlePointClick}
          withDots={true}
          withInnerLines={false}
          withOuterLines={false}
          chartConfig={{
            backgroundGradientFrom: "#fff",
            backgroundGradientTo: "#fff",
            color: (opacity = 1) => color,
            labelColor: (opacity = 1) => `rgba(100, 100, 100, ${opacity})`,
            strokeWidth: 3,
            propsForDots: { r: "6", strokeWidth: "2", stroke: "#fff" } // 略微放大圆点提高点击率
          }}
          bezier
          style={styles.chart}
        />

        {tooltip.visible && (
          <View 
            style={[
              styles.tooltip, 
              { 
                // 顶部对齐：y 坐标 - 气泡高度 - 额外间距
                top: tooltip.y - 42, 
                // 核心对齐逻辑：x 坐标 + 偏移量 - (气泡宽度 / 2)
                left: tooltip.x + CHART_OFFSET_LEFT - (TOOLTIP_WIDTH / 2),
                backgroundColor: color 
              }
            ]}
          >
            <Text style={styles.tooltipText}>{tooltip.value}{unit}</Text>
            {/* 尖角对齐：固定在气泡底部正中间 */}
            <View style={[styles.triangle, { borderTopColor: color }]} />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#FFF', width: '100%', padding: 15, borderRadius: 16, marginBottom: 20, borderLeftWidth: 5, elevation: 3, minHeight: 280 },
  textRow: { marginBottom: 10 },
  label: { fontSize: 13, color: '#666' },
  value: { fontSize: 24, fontWeight: 'bold' },
  unit: { fontSize: 14, fontWeight: 'normal', color: '#999' },
  chartWrapper: { position: 'relative' }, // 确保 Tooltip 以此为基准定位
  chart: { marginRight: 0, paddingRight: 40, marginTop: 10, marginLeft: CHART_OFFSET_LEFT },
  tooltip: {
    position: 'absolute',
    width: TOOLTIP_WIDTH,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    // 阴影让气泡更显眼
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  tooltipText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },
  triangle: {
    position: 'absolute',
    bottom: -6,
    left: (TOOLTIP_WIDTH / 2) - 6, // 居中显示尖角
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  }
});