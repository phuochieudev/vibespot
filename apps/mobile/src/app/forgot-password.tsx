import { loginSchema } from '@vibespot/shared';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { AuthLayout, FormError } from '@/components/auth-layout';
import { Button } from '@/components/button';
import { EnvelopeIllustration } from '@/components/illustrations';
import { TextField } from '@/components/text-field';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  function submit() {
    const parsed = loginSchema.shape.email.safeParse(email.trim());
    if (!parsed.success) return setError(parsed.error.issues[0]!.message);
    setError(null);
    router.push({ pathname: '/verify-otp', params: { email: parsed.data } });
  }

  return (
    <AuthLayout
      centered
      title="Quên mật khẩu?"
      subtitle="Nhập email của bạn, chúng tôi sẽ gửi mã xác nhận để đặt lại mật khẩu."
      illustration={<EnvelopeIllustration width={230} />}
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
      <FormError message={error} />
      <Button label="Gửi mã xác nhận" onPress={submit} />
    </AuthLayout>
  );
}
