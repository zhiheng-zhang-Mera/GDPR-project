import { Stack } from 'expo-router';
import { HealthProvider } from '../src/context/HealthContext';
// 1. 导入你的 PrivacyProvider
import { PrivacyProvider } from '../src/context/PrivacyContext';

export default function RootLayout() {
  return (
    // 2. 将 PrivacyProvider 套在最外层
    <PrivacyProvider>
      <HealthProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        </Stack>
      </HealthProvider>
    </PrivacyProvider>
  );
}