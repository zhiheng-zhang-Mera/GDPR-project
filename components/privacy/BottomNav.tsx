import { Ionicons } from '@expo/vector-icons';
import { Href, router } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrivacyTheme as T } from '../../constants/privacyTheme';

type NavKey = 'overview' | 'findings' | 'settings';

const ITEMS: { key: NavKey; label: string; route: Href; icon: keyof typeof Ionicons.glyphMap; activeIcon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'overview', label: 'Overview', route: '/', icon: 'shield-checkmark-outline', activeIcon: 'shield-checkmark' },
  { key: 'findings', label: 'Findings', route: '/privacy', icon: 'file-tray-full-outline', activeIcon: 'file-tray-full' },
  { key: 'settings', label: 'Settings', route: '/settings', icon: 'options-outline', activeIcon: 'options' },
];

export function BottomNav({ active }: { active: NavKey }) {
  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <View accessibilityRole="tablist" style={styles.bar}>
        {ITEMS.map((item) => {
          const selected = active === item.key;
          return (
            <TouchableOpacity
              key={item.key}
              accessibilityRole="tab"
              accessibilityLabel={item.label}
              accessibilityState={{ selected }}
              activeOpacity={0.7}
              onPress={() => { if (!selected) router.replace(item.route); }}
              style={styles.item}
            >
              <Ionicons name={selected ? item.activeIcon : item.icon} size={24} color={selected ? T.colors.primary : '#70827F'} />
              <Text style={[styles.label, selected && styles.labelSelected]}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { height: 80, flexShrink: 0, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: T.colors.line },
  bar: { flex: 1, flexDirection: 'row', alignItems: 'stretch' },
  item: { flex: 1, minHeight: 56, alignItems: 'center', justifyContent: 'center', gap: 3 },
  label: { color: '#70827F', fontSize: 12, lineHeight: 16, fontWeight: '700' },
  labelSelected: { color: T.colors.primary },
});
