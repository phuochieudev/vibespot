import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '@/theme';

interface Option<T extends string> {
  value: T;
  label: string;
}

// Hàng chip: chọn một (bấm lại để bỏ chọn) hoặc bật/tắt nhiều.
export function ChipSelect<T extends string>({
  options,
  selected,
  onToggle,
}: {
  options: Option<T>[];
  selected: T[];
  onToggle: (value: T) => void;
}) {
  return (
    <View style={styles.row}>
      {options.map((o) => {
        const active = selected.includes(o.value);
        return (
          <Pressable
            key={o.value}
            onPress={() => onToggle(o.value)}
            style={[styles.chip, active && styles.chipActive]}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  label: { fontSize: 14, fontWeight: '600', color: colors.text },
  labelActive: { color: '#fff' },
});
