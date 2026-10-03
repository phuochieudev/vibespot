import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PlaceCard, distanceFrom } from '@/components/place-card';
import { useNearbyPlaces } from '@/features/places/queries';
import { useMapStore } from '@/stores/map-store';
import { colors } from '@/theme';

export default function ListScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { area, me, select } = useMapStore();
  const { data = [], isLoading, isError, refetch, isRefetching } = useNearbyPlaces(area);

  // Có vị trí thật thì xếp theo khoảng cách từ người dùng; chưa có thì giữ thứ tự từ tâm bản đồ.
  const places = useMemo(() => {
    if (!me) return data;
    return data
      .map((p) => ({ p, d: distanceFrom(me, p)! }))
      .sort((a, b) => a.d - b.d)
      .map((x) => x.p);
  }, [data, me]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.title}>Quán gần bạn</Text>
      <FlatList
        data={places}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.list}
        refreshing={isRefetching}
        onRefresh={refetch}
        renderItem={({ item }) => (
          <PlaceCard
            place={item}
            distance={distanceFrom(me, item)}
            onPress={() => {
              select(item.id); // chọn rồi quay lại bản đồ để xem vị trí
              router.navigate('/');
            }}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {isLoading ? 'Đang tải...' : isError ? 'Không kết nối được máy chủ.' : 'Chưa có quán nào quanh đây.'}
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  title: { fontSize: 24, fontWeight: '800', color: colors.text, paddingHorizontal: 16, paddingVertical: 12 },
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 10 },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 40 },
});
