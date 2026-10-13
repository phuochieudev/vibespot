import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { comingSoon } from '@/lib/coming-soon';
import { colors, radius, shadow } from '@/theme';

type IconName = keyof typeof Ionicons.glyphMap;

// Thanh danh mục ở đáy bản đồ. Dữ liệu hiện chỉ có "Cà phê"; các mục còn lại là kế hoạch
// (bãi giữ xe, trạm sạc...) nên bấm vào sẽ báo "sắp ra mắt".
const ITEMS: { label: string; icon: IconName; tint: string; bg: string; available: boolean }[] = [
  { label: 'Cà phê', icon: 'cafe', tint: colors.accent, bg: colors.accentSoft, available: true },
  { label: 'Ăn uống', icon: 'restaurant', tint: '#EA580C', bg: '#FFEDD5', available: false },
  { label: 'Tiện ích', icon: 'flash', tint: colors.primary, bg: colors.primarySoft, available: false },
  { label: 'Khác', icon: 'grid-outline', tint: colors.muted, bg: colors.surface, available: false },
];

export function CategoryBar() {
  return (
    <View style={styles.bar}>
      {ITEMS.map((it) => (
        <Pressable
          key={it.label}
          style={styles.item}
          onPress={() => (it.available ? undefined : comingSoon(`Danh mục "${it.label}"`))}
        >
          <View style={[styles.icon, { backgroundColor: it.bg }]}>
            <Ionicons name={it.icon} size={22} color={it.tint} />
          </View>
          <Text style={styles.label}>{it.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.bg,
    borderRadius: radius.lg,
    paddingVertical: 12,
    ...shadow,
  },
  item: { alignItems: 'center', gap: 6, flex: 1 },
  icon: { width: 46, height: 46, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 12, fontWeight: '600', color: colors.text },
});
