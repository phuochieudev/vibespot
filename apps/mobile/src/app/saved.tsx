import { useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PlaceCard, distanceFrom } from '@/components/place-card';
import { ScreenHeader } from '@/components/screen-header';
import { useFavorites } from '@/features/places/queries';
import { useAuth } from '@/stores/auth-store';
import { useMapStore } from '@/stores/map-store';
import { colors } from '@/theme';

export default function SavedScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const me = useMapStore((s) => s.me);
  const { data = [], isLoading, refetch, isRefetching } = useFavorites(user !== null);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="Địa điểm đã lưu" style={styles.pad} />
      {isLoading ? <ActivityIndicator style={styles.loading} color={colors.primary} /> : null}
      <FlatList
        data={data}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.list}
        refreshing={isRefetching}
        onRefresh={refetch}
        renderItem={({ item }) => (
          <PlaceCard
            place={item}
            distance={distanceFrom(me, item)}
            onPress={() => router.push({ pathname: '/place/[id]', params: { id: item.id } })}
          />
        )}
        ListEmptyComponent={
          isLoading ? null : (
            <Text style={styles.empty}>
              {user
                ? 'Bạn chưa lưu quán nào. Bấm biểu tượng trái tim ở trang chi tiết quán để lưu.'
                : 'Đăng nhập để xem quán đã lưu.'}
            </Text>
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
  list: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24, gap: 12 },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 40, paddingHorizontal: 24 },
});
