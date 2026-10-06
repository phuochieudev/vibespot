import { StyleSheet, Text, TextInput, type TextInputProps, View } from 'react-native';
import { colors, radius } from '@/theme';

export function TextField({ label, ...input }: TextInputProps & { label: string }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.input}
        {...input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: colors.text },
  input: {
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.bg,
  },
});
