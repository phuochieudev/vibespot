import { useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/components/screen-header';
import { useMyPlaces } from '@/features/places/queries';
import { useAuth } from '@/stores/auth-store';
import { colors, radius, shadow } from '@/theme';

const STATUS = {
  PENDING: { label: 'Chờ duyệt', bg: '#FEF3C7', fg: '#92400E' },
  APPROVED: { label: 'Đã duyệt', bg: '#DCFCE7', fg: '#166534' },
  REJECTED: { label: 'Bị từ chối', bg: '#FEE2E2', fg: '#991B1B' },
} as const;

export default function MyPlacesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const { data = [], isLoading, refetch, isRefetching } = useMyPlaces(user !== null);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="Đóng góp của tôi" style={styles.pad} />
      {isLoading ? <ActivityIndicator style={styles.loading} color={colors.primary} /> : null}
      <FlatList
        data={data}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.list}
        refreshing={isRefetching}
        onRefresh={refetch}
        renderItem={({ item }) => {
          const s = STATUS[item.status];
          return (
            <Pressable
              disabled={item.status !== 'APPROVED'}
              onPress={() => router.push({ pathname: '/place/[id]', params: { id: item.id } })}
              style={styles.row}
            >
              <View style={styles.rowText}>
                <Text style={styles.name} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.address} numberOfLines={1}>
                  {item.address}
                </Text>
              </View>
              <Text style={[styles.badge, { backgroundColor: s.bg, color: s.fg }]}>{s.label}</Text>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          isLoading ? null : (
            <Text style={styles.empty}>Bạn chưa thêm quán nào. Bấm nút + trên bản đồ để thêm.</Text>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  pad: { paddingHorizontal: 16 },
  loading: { marginTop: 24 },
  list: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24, gap: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.bg,
    padding: 14,
    borderRadius: radius.lg,
    ...shadow,
    shadowOpacity: 0.07,
  },
  rowText: { flex: 1, gap: 2 },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  address: { fontSize: 13, color: colors.muted },
  badge: { fontSize: 12, fontWeight: '700', paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill, overflow: 'hidden' },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 40, paddingHorizontal: 24 },
});
