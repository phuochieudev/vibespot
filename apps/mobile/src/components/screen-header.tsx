import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { colors } from '@/theme';

// Mũi tên quay lại: về trang trước nếu có, không thì về tab Bản đồ.
export function BackButton() {
  const router = useRouter();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Quay lại"
      hitSlop={8}
      onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
      style={styles.back}
    >
      <Ionicons name="arrow-back" size={24} color={colors.text} />
    </Pressable>
  );
}

// Thanh tiêu đề cho màn hình không có header của Stack (các tab, modal).
export function ScreenHeader({ title, style }: { title?: string; style?: ViewStyle }) {
  return (
    <View style={[styles.row, style]}>
      <BackButton />
      {title ? <Text style={styles.title}>{title}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginLeft: -8 },
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
});
