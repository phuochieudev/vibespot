import { Ionicons } from '@expo/vector-icons';
import { loginSchema } from '@vibespot/shared';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AuthLayout, FooterLink, FormError, useSubmit } from '@/components/auth-layout';
import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';
import { comingSoon } from '@/lib/coming-soon';
import { useAuth } from '@/stores/auth-store';
import { colors } from '@/theme';

export default function LoginScreen() {
  const router = useRouter();
  const login = useAuth((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const { error, busy, submit } = useSubmit(async () => {
    // Dùng chung schema với server nên thông báo lỗi giống nhau ở cả hai phía.
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) throw new Error(parsed.error.issues[0]!.message);
    await login(parsed.data);
  });

  return (
    <AuthLayout
      title="Đăng nhập"
      subtitle="Chào mừng bạn quay lại!"
      footer={<FooterLink text="Chưa có tài khoản?" label="Đăng ký" href="/register" />}
    >
      <TextField
        label="Email"
        icon="mail-outline"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoComplete="email"
        placeholder="ban@example.com"
      />
      <TextField
        label="Mật khẩu"
        icon="lock-closed-outline"
        secure
        value={password}
        onChangeText={setPassword}
        autoComplete="current-password"
        placeholder="••••••••"
      />
      <FormError message={error} />
      <Button label="Đăng nhập" onPress={submit} loading={busy} />

      <Pressable onPress={() => router.push('/forgot-password')} hitSlop={8} style={styles.forgot}>
        <Text style={styles.forgotText}>Quên mật khẩu?</Text>
      </Pressable>

      <View style={styles.dividerRow}>
        <View style={styles.line} />
        <Text style={styles.dividerText}>Hoặc đăng nhập bằng</Text>
        <View style={styles.line} />
      </View>

      <View style={styles.social}>
        <View style={styles.flex}>
          <Button
            variant="outline"
            label="Google"
            icon={<Ionicons name="logo-google" size={20} color="#DB4437" />}
            onPress={() => comingSoon('Đăng nhập bằng Google')}
          />
        </View>
        <View style={styles.flex}>
          <Button
            variant="outline"
            label="Apple"
            icon={<Ionicons name="logo-apple" size={22} color={colors.text} />}
            onPress={() => comingSoon('Đăng nhập bằng Apple')}
          />
        </View>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  forgot: { alignSelf: 'center' },
  forgotText: { fontSize: 14, fontWeight: '700', color: colors.primary },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  line: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { fontSize: 13, color: colors.muted },
  social: { flexDirection: 'row', gap: 12 },
});
