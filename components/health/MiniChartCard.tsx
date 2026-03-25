import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get("window").width;

export default function MiniChartCard({ label, value, unit, color, data }) {
  return (
    <View style={[styles.card, { borderLeftColor: color }]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value} <Text style={styles.unit}>{unit}</Text></Text>
      <LineChart
        data={{ datasets: [{ data: data }] }}
        width={screenWidth * 0.4} 
        height={60}
        withDots={false}
        withInnerLines={false}
        withOuterLines={false}
        withVerticalLabels={false}
        withHorizontalLabels={false}
        chartConfig={{
          backgroundGradientFrom: "#fff",
          backgroundGradientTo: "#fff",
          color: (opacity = 1) => color,
          strokeWidth: 2,
        }}
        bezier
        style={styles.chart}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#FFF', width: '48%', padding: 12, borderRadius: 12, marginBottom: 15, borderLeftWidth: 5, elevation: 2, overflow: 'hidden' },
  label: { fontSize: 12, color: '#666' },
  value: { fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  unit: { fontSize: 11, fontWeight: 'normal', color: '#999' },
  chart: { paddingRight: 0, paddingBottom: 0, marginLeft: -15 }
});