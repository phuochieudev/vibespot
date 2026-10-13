import { Ionicons } from '@expo/vector-icons';
import { DEFAULT_CENTER, isInServiceArea, type Place } from '@vibespot/shared';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/button';
import { CategoryBar } from '@/components/category-bar';
import { FilterBar } from '@/components/filter-bar';
import { PlaceCard, distanceFrom, formatDistance } from '@/components/place-card';
import { PlacesMap, type PlacesMapHandle } from '@/components/places-map';
import { SearchBar } from '@/components/search-bar';
import { useNearbyPlaces, useSearch } from '@/features/places/queries';
import { comingSoon } from '@/lib/coming-soon';
import { useDebounced } from '@/lib/use-debounced';
import { useUserLocation } from '@/lib/use-user-location';
import { useAuth } from '@/stores/auth-store';
import { useMapStore } from '@/stores/map-store';
import { colors, radius, shadow } from '@/theme';

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const mapRef = useRef<PlacesMapHandle>(null);
  const { coords, status } = useUserLocation();
  const { area, filters, setArea, me, setMe, selected, select } = useMapStore();
  const signedIn = useAuth((s) => s.user !== null);
  const outsideArea = me !== null && !isInServiceArea(me.lat, me.lng);
  const filtering = filters.hasWifi || filters.airConditioned;

  const [query, setQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const debounced = useDebounced(query, 300);
  const search = useSearch(debounced, area);
  const { data: nearby = [], isFetching, isError } = useNearbyPlaces(area, filters);

  // Quán đang chọn từ kết quả tìm kiếm có thể chưa nằm trong danh sách "gần đây": thêm vào để vẽ ghim.
  const places = useMemo(
    () => (selected && !nearby.some((p) => p.id === selected.id) ? [...nearby, selected] : nearby),
    [nearby, selected],
  );

  // Có vị trí thật: lưu để tính khoảng cách. Chỉ bay tới đó nếu đang ở TP.HCM (API chỉ có dữ liệu TP.HCM).
  useEffect(() => {
    if (!coords) return;
    setMe(coords);
    if (!isInServiceArea(coords.lat, coords.lng)) return;
    mapRef.current?.flyTo(coords.lat, coords.lng);
    setArea({ lat: coords.lat, lng: coords.lng, radius: 1200 });
  }, [coords, setArea, setMe]);

  function pickResult(place: Place) {
    setQuery('');
    select(place);
    mapRef.current?.flyTo(place.lat, place.lng);
    setArea({ lat: place.lat, lng: place.lng, radius: 1200 });
  }

  function locate() {
    if (!me) return Alert.alert('Chưa có vị trí', 'Hãy cấp quyền vị trí cho Vibespot rồi thử lại.');
    mapRef.current?.flyTo(me.lat, me.lng);
  }

  const showResults = query.trim().length > 0;

  return (
    <View style={styles.container}>
      <PlacesMap
        ref={mapRef}
        center={DEFAULT_CENTER}
        places={places}
        selectedId={selected?.id ?? null}
        me={me}
        onSelect={(id) => select(places.find((p) => p.id === id) ?? null)}
        onMove={setArea}
      />

      <View style={[styles.top, { top: insets.top + 8 }]} pointerEvents="box-none">
        <View style={styles.cityRow}>
          <Pressable style={styles.city} onPress={() => comingSoon('Chọn thành phố khác')}>
            <Ionicons name="location" size={18} color={colors.accent} />
            <Text style={styles.cityText}>Hồ Chí Minh</Text>
            <Ionicons name="chevron-down" size={16} color={colors.text} />
          </Pressable>
          {isFetching ? <ActivityIndicator size="small" color={colors.primary} /> : null}
        </View>

        <SearchBar
          value={query}
          onChangeText={setQuery}
          onFilterPress={() => setFilterOpen(true)}
          filterActive={filtering}
        />

        {showResults ? (
          <View style={styles.results}>
            {search.isFetching && !search.data ? (
              <ActivityIndicator style={styles.resultsPad} color={colors.primary} />
            ) : (search.data ?? []).length === 0 ? (
              <Text style={[styles.resultsPad, styles.muted]}>Không tìm thấy địa điểm nào.</Text>
            ) : (
              (search.data ?? []).map((p) => {
                const d = distanceFrom(me, p);
                return (
                  <Pressable key={p.id} style={styles.result} onPress={() => pickResult(p)}>
                    <Ionicons name="cafe-outline" size={20} color={colors.primary} />
                    <View style={styles.resultText}>
                      <Text style={styles.resultName} numberOfLines={1}>
                        {p.name}
                      </Text>
                      <Text style={styles.muted} numberOfLines={1}>
                        {p.address}
                      </Text>
                    </View>
                    {d !== undefined ? <Text style={styles.muted}>{formatDistance(d)}</Text> : null}
                  </Pressable>
                );
              })
            )}
          </View>
        ) : null}

        {!showResults && isError ? (
          <Text style={styles.banner}>Không kết nối được máy chủ</Text>
        ) : null}
        {!showResults && outsideArea ? (
          <Text style={styles.banner}>Bạn đang ngoài TP.HCM, hiển thị khu vực Quận 1.</Text>
        ) : null}
        {!showResults && status === 'denied' ? (
          <Text style={styles.banner}>Chưa có quyền vị trí, đang hiển thị khu vực Quận 1.</Text>
        ) : null}
      </View>

      <View style={[styles.side, { bottom: selected ? 150 : 150 }]}>
        <Pressable
          accessibilityLabel="Thêm quán"
          onPress={() => router.push(signedIn ? '/add-place' : '/login')}
          style={[styles.round, styles.add]}
        >
          <Ionicons name="add" size={26} color="#fff" />
        </Pressable>
        <Pressable accessibilityLabel="Vị trí của tôi" onPress={locate} style={styles.round}>
          <Ionicons name="locate" size={22} color={colors.text} />
        </Pressable>
        <Pressable
          accessibilityLabel="Lớp bản đồ"
          onPress={() => comingSoon('Chọn lớp bản đồ')}
          style={styles.round}
        >
          <Ionicons name="layers-outline" size={22} color={colors.text} />
        </Pressable>
      </View>

      <View style={styles.bottom}>
        <Text style={styles.attribution}>© OpenStreetMap contributors</Text>
        {selected ? (
          <PlaceCard
            place={selected}
            distance={distanceFrom(me, selected)}
            onPress={() => router.push({ pathname: '/place/[id]', params: { id: selected.id } })}
          />
        ) : (
          <CategoryBar />
        )}
      </View>

      <Modal
        visible={filterOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setFilterOpen(false)} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <Text style={styles.sheetTitle}>Bộ lọc</Text>
          <FilterBar />
          <Button label="Xong" onPress={() => setFilterOpen(false)} />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  top: { position: 'absolute', left: 16, right: 16, gap: 10 },
  cityRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  city: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.bg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    ...shadow,
    shadowOpacity: 0.1,
  },
  cityText: { fontSize: 15, fontWeight: '700', color: colors.text },
  results: { backgroundColor: colors.bg, borderRadius: radius.lg, overflow: 'hidden', ...shadow },
  resultsPad: { padding: 16, textAlign: 'center' },
  result: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  resultText: { flex: 1 },
  resultName: { fontSize: 15, fontWeight: '700', color: colors.text },
  muted: { fontSize: 12.5, color: colors.muted },
  banner: {
    alignSelf: 'flex-start',
    fontSize: 12,
    color: colors.muted,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  side: { position: 'absolute', right: 16, gap: 12 },
  round: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
  },
  add: { backgroundColor: colors.primary },
  bottom: { position: 'absolute', left: 16, right: 16, bottom: 12, gap: 6 },
  attribution: {
    alignSelf: 'flex-end',
    fontSize: 10,
    color: colors.muted,
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingHorizontal: 4,
  },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: 20,
    gap: 16,
  },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
});
