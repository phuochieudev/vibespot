import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useMapStore, type Filters } from '@/stores/map-store';
import { colors } from '@/theme';

const CHIPS: { key: keyof Filters; label: string }[] = [
  { key: 'hasWifi', label: 'Có wifi' },
  { key: 'airConditioned', label: 'Máy lạnh' },
];

// Hàng chip bật/tắt bộ lọc, dùng chung cho tab Bản đồ và Danh sách (chung một store).
export function FilterBar() {
  const { filters, toggleFilter } = useMapStore();
  return (
    <View style={styles.row}>
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
  row: { flexDirection: 'row', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  label: { fontSize: 13, fontWeight: '600', color: colors.text },
  labelActive: { color: '#fff' },
});
