import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PrivacyProvider } from '../src/context/PrivacyContext';

export default function RootLayout() {
  return (
    <PrivacyProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </PrivacyProvider>
  );
}
