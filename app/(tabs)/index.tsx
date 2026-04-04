import { DynamicDashboard } from '@/components/DynamicDashboard';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedView } from '@/components/themed-view';
import { StyleSheet } from 'react-native';
// 1. 引入研究者打分和遥测面板
import { EvaluationTelemetry } from '@/components/EvaluationTelemetry';

export default function HomeScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={<ThemedView style={styles.headerSpacer} />}
    >
      <ThemedView style={styles.container}>
        
        {/* 2. 放在最上方，供研究人员（主试）在测试期间切换分组和受试者填表使用 */}
        <EvaluationTelemetry />
        
        {/* 3. 分割线或间距 */}
        <ThemedView style={{ height: 20, backgroundColor: 'transparent' }} />

        {/* 受试者进行测试的任务区域 */}
        <DynamicDashboard />

      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerSpacer: {
    height: 100,
    backgroundColor: '#1D3D47'
  },
  container: {
    flex: 1,
    padding: 16,
  }
});