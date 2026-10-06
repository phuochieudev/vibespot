import { loginSchema } from '@vibespot/shared';
import { useState } from 'react';
import { AuthForm } from '@/components/auth-form';
import { TextField } from '@/components/text-field';
import { useAuth } from '@/stores/auth-store';

export default function LoginScreen() {
  const login = useAuth((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <AuthForm
      title="Đăng nhập"
      subtitle="Đăng nhập để thêm quán, đánh giá và lưu địa điểm yêu thích."
      submitLabel="Đăng nhập"
      footerText="Chưa có tài khoản?"
      footerLabel="Đăng ký"
      footerHref="/register"
      onSubmit={async () => {
        // Dùng chung schema với server nên thông báo lỗi giống nhau ở cả hai phía.
        const parsed = loginSchema.safeParse({ email, password });
        if (!parsed.success) throw new Error(parsed.error.issues[0]!.message);
        await login(parsed.data);
      }}
    >
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoComplete="email"
        placeholder="ban@example.com"
      />
      <TextField
        label="Mật khẩu"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="current-password"
        placeholder="••••••••"
      />
    </AuthForm>
  );
}
