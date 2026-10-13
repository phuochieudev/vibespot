import { registerSchema } from '@vibespot/shared';
import { useState } from 'react';
import { AuthLayout, FooterLink, FormError, useSubmit } from '@/components/auth-layout';
import { Button } from '@/components/button';
import { MapPinIllustration } from '@/components/illustrations';
import { TextField } from '@/components/text-field';
import { useAuth } from '@/stores/auth-store';

export default function RegisterScreen() {
  const register = useAuth((s) => s.register);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const { error, busy, submit } = useSubmit(async () => {
    const parsed = registerSchema.safeParse({ displayName, email, password });
    if (!parsed.success) throw new Error(parsed.error.issues[0]!.message);
    await register(parsed.data);
  });

  return (
    <AuthLayout
      title="Tạo tài khoản"
      subtitle="Để trải nghiệm đầy đủ các tính năng, như lưu địa điểm, đánh giá và cá nhân hóa gợi ý."
      illustration={<MapPinIllustration width={230} />}
      footer={<FooterLink text="Đã có tài khoản?" label="Đăng nhập" href="/login" />}
    >
      <TextField
        label="Tên hiển thị"
        icon="person-outline"
        value={displayName}
        onChangeText={setDisplayName}
        autoCapitalize="words"
        autoComplete="name"
        placeholder="Nhập tên của bạn"
      />
      <TextField
        label="Email"
        icon="mail-outline"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoComplete="email"
        placeholder="example@gmail.com"
      />
      <TextField
        label="Mật khẩu (tối thiểu 8 ký tự)"
        icon="lock-closed-outline"
        secure
        value={password}
        onChangeText={setPassword}
        autoComplete="new-password"
        placeholder="••••••••"
      />
      <FormError message={error} />
      <Button label="Đăng ký" onPress={submit} loading={busy} />
    </AuthLayout>
  );
}
