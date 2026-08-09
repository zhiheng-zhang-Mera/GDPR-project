import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { PrivacyTheme as T } from '../../constants/privacyTheme';

export default function TabLayout() {
  return (
    <Tabs tabBar={() => null} screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: T.colors.primary,
      tabBarInactiveTintColor: '#70827F',
      tabBarLabelStyle: { fontSize: 12, fontWeight: '700' },
    }}>
      <Tabs.Screen name="index" options={{ title: 'Overview', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'shield-checkmark' : 'shield-checkmark-outline'} size={24} color={color} /> }} />
      <Tabs.Screen name="privacy" options={{ title: 'Findings', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'file-tray-full' : 'file-tray-full-outline'} size={24} color={color} /> }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'options' : 'options-outline'} size={24} color={color} /> }} />
    </Tabs>
  );
}
