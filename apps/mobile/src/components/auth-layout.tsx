import { useRouter, type Href } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LeafDecor } from '@/components/illustrations';
import { ScreenHeader } from '@/components/screen-header';
import { colors } from '@/theme';

interface Props {
  title: string;
  subtitle: string;
  /** Hình minh họa phía trên tiêu đề. */
  illustration?: ReactNode;
  /** Căn giữa tiêu đề và mô tả (quên mật khẩu, OTP). */
  centered?: boolean;
  children: ReactNode;
  footer?: ReactNode;
}

// Khung chung cho các màn hình xác thực: mũi tên quay lại, minh họa, tiêu đề, nội dung, lá trang trí.
export function AuthLayout({ title, subtitle, illustration, centered, children, footer }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LeafDecor />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 }]}
      >
        <ScreenHeader />
        {illustration ? <View style={styles.illustration}>{illustration}</View> : null}
        <Text style={[styles.title, centered && styles.centered]}>{title}</Text>
        <Text style={[styles.subtitle, centered && styles.centered]}>{subtitle}</Text>
        <View style={styles.body}>{children}</View>
        {footer}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// "Đã có tài khoản? Đăng nhập" ở cuối màn hình.
export function FooterLink({ text, label, href }: { text: string; label: string; href: Href }) {
  const router = useRouter();
  return (
    <View style={styles.footer}>
      <Text style={styles.footerText}>{text} </Text>
      <Pressable onPress={() => router.replace(href)} hitSlop={8}>
        <Text style={styles.footerLink}>{label}</Text>
      </Pressable>
    </View>
  );
}

// Gửi form: giữ trạng thái đang gửi + thông báo lỗi; xong thì quay lại màn hình trước.
export function useSubmit(action: () => Promise<void>) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError(null);
    setBusy(true);
    try {
      await action();
      if (router.canGoBack()) router.back();
      else router.replace('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Có lỗi xảy ra, thử lại sau');
    } finally {
      setBusy(false);
    }
  }
  return { error, busy, submit };
}

export function FormError({ message }: { message: string | null }) {
  return message ? <Text style={styles.error}>{message}</Text> : null;
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 20, gap: 12 },
  illustration: { alignItems: 'center', marginVertical: 8 },
  title: { fontSize: 30, fontWeight: '800', color: colors.text, marginTop: 4 },
  subtitle: { fontSize: 14, lineHeight: 20, color: colors.muted },
  centered: { textAlign: 'center' },
  body: { gap: 16, marginTop: 12 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 12 },
  footerText: { fontSize: 14, color: colors.muted },
  footerLink: { fontSize: 14, fontWeight: '800', color: colors.primary },
  error: { color: colors.danger, fontSize: 14 },
});
