import { registerSchema } from '@vibespot/shared';
import { useState } from 'react';
import { AuthForm } from '@/components/auth-form';
import { TextField } from '@/components/text-field';
import { useAuth } from '@/stores/auth-store';

export default function RegisterScreen() {
  const register = useAuth((s) => s.register);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <AuthForm
      title="Tạo tài khoản"
      subtitle="Đóng góp thông tin quán để giúp mọi người tìm chỗ làm việc tốt hơn."
      submitLabel="Đăng ký"
      footerText="Đã có tài khoản?"
      footerLabel="Đăng nhập"
      footerHref="/login"
      onSubmit={async () => {
        const parsed = registerSchema.safeParse({ displayName, email, password });
        if (!parsed.success) throw new Error(parsed.error.issues[0]!.message);
        await register(parsed.data);
      }}
    >
      <TextField
        label="Tên hiển thị"
        value={displayName}
        onChangeText={setDisplayName}
        autoCapitalize="words"
        autoComplete="name"
        placeholder="Nguyễn Văn A"
      />
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoComplete="email"
        placeholder="ban@example.com"
      />
      <TextField
        label="Mật khẩu (tối thiểu 8 ký tự)"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="new-password"
        placeholder="••••••••"
      />
    </AuthForm>
  );
}
