import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius } from '@/theme';

interface Props {
  label: string;
  onPress: () => void;
  loading?: boolean;
  variant?: 'primary' | 'ghost';
}

export function Button({ label, onPress, loading, variant = 'primary' }: Props) {
  const primary = variant === 'primary';
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={[styles.base, primary ? styles.primary : styles.ghost, loading && styles.disabled]}
    >
      {loading ? (
        <ActivityIndicator color={primary ? '#fff' : colors.primary} />
      ) : (
        <Text style={[styles.label, { color: primary ? '#fff' : colors.primary }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { height: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  primary: { backgroundColor: colors.primary },
  ghost: { backgroundColor: 'transparent' },
  disabled: { opacity: 0.7 },
  label: { fontSize: 16, fontWeight: '700' },
});
