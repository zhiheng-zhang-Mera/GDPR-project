import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import LargeChartCard from '../../components/health/LargeChartCard';
import { useHealth } from '../../src/context/HealthContext';
import { StorageService } from '../../src/services/StorageService';

// 1. 新增：定义图表历史数据的 TypeScript 接口
interface HistoryData {
  labels: string[];
  steps: number[];
  water: number[];
  temp: number[];
}

export default function HistoryScreen() {
  // 加上 as any 防止 Context 尚未声明完整类型时的报错
  const { todayData } = useHealth() as any; 
  
  // 2. 将 useState 绑定到刚才定义的接口上，初始值为 null
  const [history, setHistory] = useState<HistoryData | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      const weekly = await StorageService.getWeeklyData();
      if (weekly) {
        // 3. 为 map 循环里的参数 d 和 i 增加类型标注 (d: any, i: number)
        const stepsHistory = weekly.data.map((d: any, i: number) => i === 6 ? todayData.steps : (d.steps || 0));
        const waterHistory = weekly.data.map((d: any, i: number) => i === 6 ? todayData.water : (d.water || 0));
        const tempHistory = weekly.data.map((d: any, i: number) => i === 6 ? (todayData.temp || 36.6) : (d.temp || 36.6));

        setHistory({
          labels: weekly.labels,
          steps: stepsHistory,
          water: waterHistory,
          temp: tempHistory
        });
      }
    };

    fetchHistory();
  }, [todayData]);

  if (!history) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.header}>Weekly Analysis</Text>

      <LargeChartCard 
        label="Steps History" 
        value={todayData.steps} 
        unit="steps" 
        color="#4CAF50" 
        data={history.steps} 
        labels={history.labels}
      />

      <LargeChartCard 
        label="Water Intake History" 
        value={todayData.water} 
        unit="ml" 
        color="#2196F3" 
        data={history.water} 
        labels={history.labels}
      />

      <LargeChartCard 
        label="Avg Body Temp" 
        value={todayData.temp || 36.6} 
        unit="°C" 
        color="#FF9800" 
        data={history.temp} 
        labels={history.labels}
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