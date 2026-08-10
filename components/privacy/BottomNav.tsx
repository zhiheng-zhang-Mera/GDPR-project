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
              style={[styles.item, selected && styles.itemSelected]}
            >
              <View style={[styles.iconWrap, selected && styles.iconWrapSelected]}>
                <Ionicons name={selected ? item.activeIcon : item.icon} size={22} color={selected ? T.colors.primary : '#70827F'} />
              </View>
              <Text style={[styles.label, selected && styles.labelSelected]}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { minHeight: 82, flexShrink: 0, backgroundColor: T.colors.canvas },
  bar: { minHeight: 68, marginHorizontal: 12, marginTop: 5, marginBottom: 7, padding: 5, flexDirection: 'row', alignItems: 'stretch', borderRadius: 24, borderWidth: 1, borderColor: T.colors.line, backgroundColor: '#FFFFFF', ...T.shadow.floating },
  item: { flex: 1, minHeight: 56, alignItems: 'center', justifyContent: 'center', gap: 1, borderRadius: 18 },
  itemSelected: { backgroundColor: T.colors.mint },
  iconWrap: { width: 34, height: 29, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  iconWrapSelected: { backgroundColor: 'rgba(255,255,255,0.68)' },
  label: { color: '#70827F', fontSize: 11, lineHeight: 15, fontWeight: '700' },
  labelSelected: { color: T.colors.primaryDark, fontWeight: '900' },
});
