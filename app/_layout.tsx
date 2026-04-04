import { Stack } from 'expo-router';
import { ExperimentProvider } from '../src/context/ExperimentContext';
import { HealthProvider } from '../src/context/HealthContext';
import { PrivacyProvider } from '../src/context/PrivacyContext';

export default function RootLayout() {
  return (
    // 2. 将 ExperimentProvider 套在最外层，确保全局可收集打分和耗时数据
    <ExperimentProvider>
      <PrivacyProvider>
        <HealthProvider>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
          </Stack>
        </HealthProvider>
      </PrivacyProvider>
    </ExperimentProvider>
  );
}