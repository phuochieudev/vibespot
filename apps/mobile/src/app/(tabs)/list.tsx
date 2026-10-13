import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FilterBar } from '@/components/filter-bar';
import { PlaceCard, distanceFrom } from '@/components/place-card';
import { ScreenHeader } from '@/components/screen-header';
import { useNearbyPlaces } from '@/features/places/queries';
import { useMapStore } from '@/stores/map-store';
import { colors } from '@/theme';

export default function ListScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { area, filters, me } = useMapStore();
  const filtering = filters.hasWifi || filters.airConditioned;
  const { data = [], isLoading, isError, refetch, isRefetching } = useNearbyPlaces(area, filters);

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
      <ScreenHeader title="Quán gần bạn" style={styles.pad} />
      <View style={[styles.pad, styles.filters]}>
        <FilterBar withCategory />
      </View>
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
            onPress={() => router.push({ pathname: '/place/[id]', params: { id: item.id } })}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {isLoading
              ? 'Đang tải...'
              : isError
                ? 'Không kết nối được máy chủ.'
                : filtering
                  ? 'Không có quán nào khớp bộ lọc.'
                  : 'Chưa có quán nào quanh đây.'}
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  pad: { paddingHorizontal: 16 },
  filters: { paddingBottom: 12 },
  list: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 24, gap: 12 },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 40 },
});
