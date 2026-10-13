import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/button';
import { BackButton } from '@/components/screen-header';
import { useMeStats, useMyPlaces } from '@/features/places/queries';
import { comingSoon } from '@/lib/coming-soon';
import { useAuth } from '@/stores/auth-store';
import { colors, radius, shadow } from '@/theme';

type IconName = keyof typeof Ionicons.glyphMap;

function MenuRow({
  icon,
  label,
  onPress,
  last,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  last?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.menuRow, !last && styles.menuDivider]}>
      <Ionicons name={icon} size={22} color={colors.text} />
      <Text style={styles.menuLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </Pressable>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { status, user, logout } = useAuth();
  const stats = useMeStats(user !== null);
  const mine = useMyPlaces(user !== null);
  const go = (href: Href) => () => router.push(href);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + 8 }]}
    >
      <View style={styles.topBar}>
        <BackButton />
        <Pressable hitSlop={8} onPress={() => comingSoon('Cài đặt')} accessibilityLabel="Cài đặt">
          <Ionicons name="settings-outline" size={24} color={colors.text} />
        </Pressable>
      </View>

      {status === 'loading' ? (
        <ActivityIndicator style={styles.loading} color={colors.primary} />
      ) : user ? (
        <>
          <View style={styles.identity}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user.displayName.slice(0, 1).toUpperCase()}</Text>
            </View>
            <Text style={styles.name}>{user.displayName}</Text>
            <Text style={styles.email}>{user.email}</Text>
            <Text style={styles.email}>Điểm uy tín: {user.reputation}</Text>
          </View>

          <View style={styles.stats}>
            <View style={styles.stat}>
              <Ionicons name="star" size={22} color={colors.star} />
              <Text style={styles.statNum}>{stats.data?.reviewCount ?? 0}</Text>
              <Text style={styles.statLabel}>Đánh giá</Text>
            </View>
            <View style={styles.statDivider} />
            <Pressable style={styles.stat} onPress={go('/saved')}>
              <Ionicons name="bookmark-outline" size={22} color={colors.text} />
              <Text style={styles.statNum}>{stats.data?.favoriteCount ?? 0}</Text>
              <Text style={styles.statLabel}>Đã lưu</Text>
            </Pressable>
          </View>

          <View style={styles.menu}>
            <MenuRow
              icon="time-outline"
              label="Lịch sử tìm kiếm"
              onPress={() => comingSoon('Lịch sử tìm kiếm')}
            />
            <MenuRow icon="bookmark-outline" label="Địa điểm đã lưu" onPress={go('/saved')} />
            <MenuRow
              icon="add-circle-outline"
              label={`Đóng góp của tôi${mine.data?.length ? ` (${mine.data.length})` : ''}`}
              onPress={go('/my-places')}
            />
            {user.role === 'ADMIN' ? (
              <MenuRow
                icon="shield-checkmark-outline"
                label="Duyệt nội dung (Quản trị)"
                onPress={go('/admin')}
              />
            ) : null}
            <MenuRow
              icon="settings-outline"
              label="Cài đặt"
              onPress={() => comingSoon('Cài đặt')}
            />
            <MenuRow
              icon="help-circle-outline"
              label="Trợ giúp"
              onPress={() => comingSoon('Trung tâm trợ giúp')}
            />
            <MenuRow icon="log-out-outline" label="Đăng xuất" onPress={logout} last />
          </View>
        </>
      ) : (
        <View style={styles.guest}>
          <View style={[styles.avatar, styles.avatarGuest]}>
            <Ionicons name="person" size={44} color={colors.primary} />
          </View>
          <Text style={styles.name}>Chưa đăng nhập</Text>
          <Text style={[styles.email, styles.center]}>
            Đăng nhập để đóng góp quán, đánh giá và lưu địa điểm yêu thích.
          </Text>
          <View style={styles.guestActions}>
            <Button label="Đăng nhập" onPress={go('/login')} />
            <Button label="Tạo tài khoản" variant="outline" onPress={go('/register')} />
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.surface },
  container: { paddingHorizontal: 16, paddingBottom: 32, gap: 16 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  loading: { marginTop: 40 },
  identity: { alignItems: 'center', gap: 4 },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    ...shadow,
  },
  avatarGuest: { backgroundColor: colors.primarySoft },
  avatarText: { color: '#fff', fontSize: 40, fontWeight: '800' },
  name: { fontSize: 22, fontWeight: '800', color: colors.text },
  email: { fontSize: 14, color: colors.muted },
  center: { textAlign: 'center' },
  stats: {
    flexDirection: 'row',
    backgroundColor: colors.bg,
    borderRadius: radius.lg,
    paddingVertical: 16,
    ...shadow,
    shadowOpacity: 0.07,
  },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statNum: { fontSize: 22, fontWeight: '800', color: colors.text },
  statLabel: { fontSize: 13, color: colors.muted },
  statDivider: { width: 1, backgroundColor: colors.border, marginVertical: 4 },
  menu: { backgroundColor: colors.bg, borderRadius: radius.lg, ...shadow, shadowOpacity: 0.07 },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  menuDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  menuLabel: { flex: 1, fontSize: 16, color: colors.text },
  guest: { alignItems: 'center', gap: 8, marginTop: 24 },
  guestActions: { alignSelf: 'stretch', gap: 10, marginTop: 16 },
});
