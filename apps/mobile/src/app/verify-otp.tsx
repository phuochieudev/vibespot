import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { AuthLayout } from '@/components/auth-layout';
import { ShieldIllustration } from '@/components/illustrations';
import { comingSoon } from '@/lib/coming-soon';
import { colors, radius } from '@/theme';

const LENGTH = 6;
const RESEND_SECONDS = 60;

// Giao diện nhập mã OTP 6 số. Việc gửi/kiểm tra mã qua email cần dịch vụ gửi email mà dự án
// chưa cấu hình, nên khi nhập đủ 6 số app thông báo rõ thay vì giả vờ xác thực thành công.
export default function VerifyOtpScreen() {
  const { email } = useLocalSearchParams<{ email?: string }>();
  const input = useRef<TextInput>(null);
  const [code, setCode] = useState('');
  const [seconds, setSeconds] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (seconds <= 0) return;
    const id = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [seconds]);

  function onChange(text: string) {
    const digits = text.replace(/\D/g, '').slice(0, LENGTH);
    setCode(digits);
    if (digits.length === LENGTH) comingSoon('Xác thực mã OTP qua email');
  }

  return (
    <AuthLayout
      centered
      title="Xác thực tài khoản"
      subtitle={`Nhập mã OTP đã được gửi đến email${email ? ` ${email}` : ' của bạn'}.`}
      illustration={<ShieldIllustration width={210} />}
    >
      <Pressable style={styles.boxes} onPress={() => input.current?.focus()}>
        {Array.from({ length: LENGTH }, (_, i) => (
          <View key={i} style={[styles.box, i === Math.min(code.length, LENGTH - 1) && styles.boxActive]}>
            <Text style={styles.digit}>{code[i] ?? ''}</Text>
          </View>
        ))}
      </Pressable>
      {/* Ô nhập thật nằm ẩn; 6 ô ở trên chỉ hiển thị nội dung của nó. */}
      <TextInput
        ref={input}
        value={code}
        onChangeText={onChange}
        keyboardType="number-pad"
        maxLength={LENGTH}
        autoFocus
        style={styles.hidden}
        caretHidden
      />

      <Text style={styles.resend}>
        Không nhận được mã?{' '}
        {seconds > 0 ? (
          <Text>Gửi lại ({seconds}s)</Text>
        ) : (
          <Text
            style={styles.resendLink}
            onPress={() => {
              setSeconds(RESEND_SECONDS);
              comingSoon('Gửi lại mã qua email');
            }}
          >
            Gửi lại
          </Text>
        )}
      </Text>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  boxes: { flexDirection: 'row', justifyContent: 'center', gap: 10 },
  box: {
    width: 46,
    height: 54,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  boxActive: { borderColor: colors.primary },
  digit: { fontSize: 22, fontWeight: '800', color: colors.text },
  hidden: { position: 'absolute', opacity: 0, height: 1, width: 1 },
  resend: { textAlign: 'center', fontSize: 14, color: colors.muted },
  resendLink: { fontWeight: '800', color: colors.primary },
});
