import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, type TextInputProps, View } from 'react-native';
import { colors, radius } from '@/theme';

type IconName = keyof typeof Ionicons.glyphMap;

interface Props extends Omit<TextInputProps, 'secureTextEntry'> {
  label: string;
  icon?: IconName;
  /** Ô mật khẩu: ẩn ký tự và có nút con mắt để hiện/ẩn. */
  secure?: boolean;
}

export function TextField({ label, icon, secure, style, ...input }: Props) {
  const [hidden, setHidden] = useState(true);
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.box}>
        {icon ? <Ionicons name={icon} size={20} color={colors.muted} /> : null}
        <TextInput
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry={secure && hidden}
          style={[styles.input, style]}
          {...input}
        />
        {secure ? (
          <Pressable
            onPress={() => setHidden((h) => !h)}
            hitSlop={8}
            accessibilityLabel="Hiện hoặc ẩn mật khẩu"
          >
            <Ionicons
              name={hidden ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color={colors.muted}
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: colors.text },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 50,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    backgroundColor: colors.bg,
  },
  input: { flex: 1, fontSize: 15, color: colors.text, height: '100%' },
});
