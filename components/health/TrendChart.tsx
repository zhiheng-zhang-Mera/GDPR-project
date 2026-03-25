import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get("window").width;

export default function TrendChart({ title, data, labels, color }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <LineChart
        data={{ labels, datasets: [{ data }] }}
        width={screenWidth - 40}
        height={180}
        chartConfig={{
          backgroundGradientFrom: "#fff",
          backgroundGradientTo: "#fff",
          color: (opacity = 1) => color(opacity),
          decimalPlaces: 1,
        }}
        bezier
        style={styles.chart}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#FFF', borderRadius: 16, padding: 15, marginBottom: 20, elevation: 2 },
  title: { fontSize: 16, fontWeight: '600', marginBottom: 10 },
  chart: { marginLeft: -20, borderRadius: 16 }
});