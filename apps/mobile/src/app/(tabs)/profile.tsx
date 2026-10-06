import { useRouter } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/button';
import { useAuth } from '@/stores/auth-store';
import { colors, radius } from '@/theme';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { status, user, logout } = useAuth();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <Text style={styles.title}>Tôi</Text>

      {status === 'loading' ? (
        <ActivityIndicator style={styles.center} color={colors.primary} />
      ) : user ? (
        <View style={styles.card}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user.displayName.slice(0, 1).toUpperCase()}</Text>
          </View>
          <Text style={styles.name}>{user.displayName}</Text>
          <Text style={styles.email}>{user.email}</Text>
          <Text style={styles.meta}>Điểm uy tín: {user.reputation}</Text>
          <View style={styles.actions}>
            <Button label="Đăng xuất" variant="ghost" onPress={logout} />
          </View>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.name}>Chưa đăng nhập</Text>
          <Text style={styles.email}>Đăng nhập để đóng góp quán và đánh giá.</Text>
          <View style={styles.actions}>
            <Button label="Đăng nhập" onPress={() => router.push('/login')} />
            <Button label="Tạo tài khoản" variant="ghost" onPress={() => router.push('/register')} />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface, paddingHorizontal: 16 },
  title: { fontSize: 24, fontWeight: '800', color: colors.text, paddingVertical: 12 },
  center: { marginTop: 40 },
  card: {
    backgroundColor: colors.bg,
    borderRadius: radius.lg,
    padding: 20,
    gap: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: '800' },
  name: { fontSize: 18, fontWeight: '700', color: colors.text },
  email: { fontSize: 14, color: colors.muted, textAlign: 'center' },
  meta: { fontSize: 13, color: colors.muted },
  actions: { alignSelf: 'stretch', marginTop: 14, gap: 4 },
});
