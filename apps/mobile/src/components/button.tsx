import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '@/theme';

interface Props {
  label: string;
  onPress: () => void;
  loading?: boolean;
  /** primary: nền xanh; outline: viền, nền trắng; ghost: chỉ chữ */
  variant?: 'primary' | 'outline' | 'ghost';
  icon?: ReactNode;
  disabled?: boolean;
}

export function Button({ label, onPress, loading, variant = 'primary', icon, disabled }: Props) {
  const textColor =
    variant === 'primary' ? '#fff' : variant === 'outline' ? colors.text : colors.primary;
  return (
    <Pressable
      onPress={onPress}
      disabled={loading || disabled}
      style={[styles.base, styles[variant], (loading || disabled) && styles.disabled]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <View style={styles.content}>
          {icon}
          <Text style={[styles.label, { color: textColor }]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  primary: { backgroundColor: colors.primary },
  outline: { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border },
  ghost: { backgroundColor: 'transparent', height: 44 },
  disabled: { opacity: 0.55 },
  content: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { fontSize: 16, fontWeight: '700' },
});
