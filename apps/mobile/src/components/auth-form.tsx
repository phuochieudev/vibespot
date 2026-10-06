import { useRouter, type Href } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/button';
import { colors } from '@/theme';

interface Props {
  title: string;
  subtitle: string;
  submitLabel: string;
  /** Ném lỗi (Error) với thông báo hiển thị cho người dùng nếu thất bại. */
  onSubmit: () => Promise<void>;
  children: ReactNode;
  footerText: string;
  footerLabel: string;
  footerHref: Href;
}

// Khung dùng chung cho màn Đăng nhập và Đăng ký: tiêu đề, ô nhập, nút gửi, báo lỗi, bàn phím.
export function AuthForm(props: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError(null);
    setBusy(true);
    try {
      await props.onSubmit();
      if (router.canGoBack()) router.back();
      else router.replace('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Có lỗi xảy ra, thử lại sau');
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 24 }]}
      >
        <Text style={styles.title}>{props.title}</Text>
        <Text style={styles.subtitle}>{props.subtitle}</Text>

        <View style={styles.fields}>{props.children}</View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button label={props.submitLabel} onPress={submit} loading={busy} />
        <View style={styles.footer}>
          <Text style={styles.footerText}>{props.footerText}</Text>
          <Button
            variant="ghost"
            label={props.footerLabel}
            onPress={() => router.replace(props.footerHref)}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 20, paddingBottom: 32, gap: 16 },
  title: { fontSize: 28, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 15, color: colors.muted, marginBottom: 8 },
  fields: { gap: 14 },
  error: { color: '#B91C1C', fontSize: 14 },
  footer: { alignItems: 'center' },
  footerText: { color: colors.muted, fontSize: 14 },
});
