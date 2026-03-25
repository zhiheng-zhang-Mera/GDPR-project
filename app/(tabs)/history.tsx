import { ScrollView, StyleSheet, Text, View } from 'react-native';
import LargeChartCard from '../../components/health/LargeChartCard';
import { useHealth } from '../../src/context/HealthContext';

const MOCK_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function HistoryScreen() {
  const { todayData } = useHealth();

  // 这里的 data 最后一个点会自动映射到 Storage 里的实时数据
  const stepsHistory = [6000, 7500, 9000, 4000, 11000, 8400, todayData.steps];
  const waterHistory = [1800, 2000, 1500, 2200, 1900, 1500, todayData.water];
  const tempHistory = [36.5, 36.7, 36.6, 36.8, 36.6, 36.6, todayData.temp || 36.6];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.header}>Weekly Analysis</Text>

      <LargeChartCard 
        label="Steps History" 
        value={todayData.steps} 
        unit="steps" 
        color="#4CAF50" 
        data={stepsHistory} 
        labels={MOCK_LABELS}
      />

      <LargeChartCard 
        label="Water Intake History" 
        value={todayData.water} 
        unit="ml" 
        color="#2196F3" 
        data={waterHistory} 
        labels={MOCK_LABELS}
      />

      <LargeChartCard 
        label="Avg Body Temp" 
        value={todayData.temp || 36.6} 
        unit="°C" 
        color="#FF9800" 
        data={tempHistory} 
        labels={MOCK_LABELS}
      />

      <View style={{ height: 80 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  scrollContent: { padding: 20 },
  header: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 20, marginTop: 10 },
});