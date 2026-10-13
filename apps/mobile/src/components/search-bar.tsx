import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { colors, radius, shadow } from '@/theme';

// Ô tìm kiếm nổi trên bản đồ, kèm nút mở bộ lọc.
export function SearchBar({
  value,
  onChangeText,
  onFilterPress,
  filterActive,
}: {
  value: string;
  onChangeText: (text: string) => void;
  onFilterPress: () => void;
  filterActive: boolean;
}) {
  return (
    <View style={styles.bar}>
      <Ionicons name="search" size={20} color={colors.muted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="Tìm địa điểm, dịch vụ..."
        placeholderTextColor={colors.muted}
        returnKeyType="search"
        autoCorrect={false}
        style={styles.input}
      />
      {value ? (
        <Pressable onPress={() => onChangeText('')} hitSlop={8} accessibilityLabel="Xoá tìm kiếm">
          <Ionicons name="close-circle" size={18} color={colors.muted} />
        </Pressable>
      ) : null}
      <Pressable
        onPress={onFilterPress}
        hitSlop={8}
        accessibilityLabel="Bộ lọc"
        style={styles.filterBtn}
      >
        <Ionicons
          name="options-outline"
          size={22}
          color={filterActive ? colors.accent : colors.text}
        />
        {filterActive ? <View style={styles.dot} /> : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 52,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    backgroundColor: colors.bg,
    ...shadow,
  },
  input: { flex: 1, fontSize: 15, color: colors.text, height: '100%' },
  filterBtn: { paddingLeft: 4 },
  dot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
});
