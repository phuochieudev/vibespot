import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/button';
import { useMyPlaces } from '@/features/places/queries';
import { useAuth } from '@/stores/auth-store';
import { colors, radius } from '@/theme';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { status, user, logout } = useAuth();
  const { data: mine = [] } = useMyPlaces(user !== null);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + 12 }]}
    >
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

      {user ? (
        <View style={styles.contrib}>
          <Text style={styles.section}>Đóng góp của tôi</Text>
          {mine.length === 0 ? (
            <Text style={styles.email}>Bạn chưa thêm quán nào. Bấm nút + trên bản đồ để thêm.</Text>
          ) : (
            mine.map((p) => (
              <Pressable
                key={p.id}
                disabled={p.status !== 'APPROVED'}
                onPress={() => router.push({ pathname: '/place/[id]', params: { id: p.id } })}
                style={styles.row}
              >
                <Text style={styles.rowName} numberOfLines={1}>
                  {p.name}
                </Text>
                <Text style={[styles.badge, STATUS[p.status].style]}>{STATUS[p.status].label}</Text>
              </Pressable>
            ))
          )}
        </View>
      ) : null}
    </ScrollView>
  );
}

const STATUS = {
  PENDING: { label: 'Chờ duyệt', style: { backgroundColor: '#FEF3C7', color: '#92400E' } },
  APPROVED: { label: 'Đã duyệt', style: { backgroundColor: '#DCFCE7', color: '#166534' } },
  REJECTED: { label: 'Bị từ chối', style: { backgroundColor: '#FEE2E2', color: '#991B1B' } },
} as const;

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.surface },
  container: { paddingHorizontal: 16, paddingBottom: 32 },
  contrib: { marginTop: 20, gap: 8 },
  section: { fontSize: 16, fontWeight: '800', color: colors.text },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    backgroundColor: colors.bg,
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowName: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text },
  badge: { fontSize: 12, fontWeight: '700', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, overflow: 'hidden' },
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
