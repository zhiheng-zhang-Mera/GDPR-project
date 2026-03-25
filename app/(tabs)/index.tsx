import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedView } from '@/components/themed-view';
import { StyleSheet } from 'react-native';
// 引入您的 V16 动态仪表盘组件
import { DynamicDashboard } from '@/components/DynamicDashboard';

export default function HomeScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={<ThemedView style={styles.headerSpacer} />}
    >
      <ThemedView style={styles.container}>
        {/* 渲染隐私控制中间件的前端交互层 */}
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