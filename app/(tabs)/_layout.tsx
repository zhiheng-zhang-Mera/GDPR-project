import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#0B5D7A', tabBarInactiveTintColor: '#6C7A84', tabBarStyle: { borderTopColor: '#DCE6EC', backgroundColor: '#FFFFFF' }, headerStyle: { backgroundColor: '#F8FAFB' }, headerShadowVisible: false }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ color }) => <Ionicons name="today" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color }) => <Ionicons name="stats-chart" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="projects"
        options={{
          title: 'Projects',
          tabBarIcon: ({ color }) => <Ionicons name="flask" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="privacy"
        options={{
          title: 'Privacy',
          tabBarAccessibilityLabel: 'Privacy accountability dashboard',
          tabBarIcon: ({ color }) => <Ionicons name="shield-checkmark" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <Ionicons name="settings" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="experiment"
        options={{
        title: 'Task (RQ)',
        tabBarIcon: ({ color }) => <Ionicons name="flask" size={24} color={color} />,
      }}
      />
      <Tabs.Screen
        name="scoring"
        options={{
          title: 'Survey',
          tabBarIcon: ({ color }) => <Ionicons name="speedometer" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
