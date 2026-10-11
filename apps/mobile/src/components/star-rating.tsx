import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

const GOLD = '#F59E0B';

// Hiển thị điểm (làm tròn xuống ngôi sao đầy) hoặc cho phép chọn điểm khi có onChange.
export function StarRating({
  value,
  onChange,
  size = 18,
}: {
  value: number;
  onChange?: (rating: number) => void;
  size?: number;
}) {
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((n) => {
        const icon = (
          <Ionicons name={n <= Math.round(value) ? 'star' : 'star-outline'} size={size} color={GOLD} />
        );
        return onChange ? (
          <Pressable key={n} onPress={() => onChange(n)} hitSlop={6}>
            {icon}
          </Pressable>
        ) : (
          <View key={n}>{icon}</View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', gap: 2 } });
