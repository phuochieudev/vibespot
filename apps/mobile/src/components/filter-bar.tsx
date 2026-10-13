import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useMapStore, type Filters } from '@/stores/map-store';
import { colors, radius, shadow } from '@/theme';

const CHIPS: { key: keyof Filters; label: string }[] = [
  { key: 'hasWifi', label: 'Có wifi' },
  { key: 'airConditioned', label: 'Máy lạnh' },
];

// Hàng chip bộ lọc dùng chung cho tab Danh sách và hộp lọc ở Bản đồ (chung một store).
// withCategory: thêm chip "Cà phê" luôn bật ở đầu hàng, như thiết kế (hiện chỉ có loại cà phê).
export function FilterBar({ withCategory = false }: { withCategory?: boolean }) {
  const { filters, toggleFilter } = useMapStore();
  return (
    <View style={styles.row}>
      {withCategory ? (
        <View style={[styles.chip, styles.chipActive]}>
          <Ionicons name="cafe" size={15} color="#fff" />
          <Text style={[styles.label, styles.labelActive]}>Cà phê</Text>
        </View>
      ) : null}
      {CHIPS.map(({ key, label }) => {
        const active = filters[key];
        return (
          <Pressable
            key={key}
            onPress={() => toggleFilter(key)}
            style={[styles.chip, active && styles.chipActive]}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: radius.pill,
    backgroundColor: colors.bg,
    ...shadow,
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  chipActive: { backgroundColor: colors.accent },
  label: { fontSize: 14, fontWeight: '600', color: colors.text },
  labelActive: { color: '#fff' },
});
