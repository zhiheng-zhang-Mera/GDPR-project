import { Ionicons } from '@expo/vector-icons';
import { ComponentProps } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// 1. 定义传入属性的类型，带 ? 的表示可选属性
interface MetricCardProps {
  label: string;
  value: string | number;
  unit: string;
  color: string;
  isWide?: boolean;
  onPressIcon?: () => void;
  iconName?: ComponentProps<typeof Ionicons>['name'];
}

// 2. 为组件应用这个类型
export default function MetricCard({ 
  label, 
  value, 
  unit, 
  color, 
  isWide, 
  onPressIcon, 
  iconName 
}: MetricCardProps) {
  return (
    <View style={[styles.card, isWide ? styles.wide : styles.narrow, { borderLeftColor: color }]}>
      <View style={styles.row}>
        <View>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.value}>{value} <Text style={styles.unit}>{unit}</Text></Text>
        </View>
        {/* 只有当传入了 onPressIcon 时才渲染图标按钮 */}
        {onPressIcon && (
          <TouchableOpacity onPress={onPressIcon} style={styles.iconBtn}>
            <Ionicons name={iconName || "add-circle"} size={28} color={color} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#FFF', padding: 15, borderRadius: 12, marginBottom: 15, borderLeftWidth: 5, elevation: 2 },
  narrow: { width: '48%' },
  wide: { width: '100%' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 13, color: '#666', marginBottom: 4 },
  value: { fontSize: 20, fontWeight: 'bold' },
  unit: { fontSize: 12, fontWeight: 'normal', color: '#999' },
  iconBtn: { padding: 5 }
});