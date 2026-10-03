import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DEFAULT_CENTER, isInServiceArea } from '@vibespot/shared';
import { PlaceCard, distanceFrom } from '@/components/place-card';
import { PlacesMap, type PlacesMapHandle } from '@/components/places-map';
import { useNearbyPlaces } from '@/features/places/queries';
import { useUserLocation } from '@/lib/use-user-location';
import { useMapStore } from '@/stores/map-store';
import { colors } from '@/theme';

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<PlacesMapHandle>(null);
  const { coords, status } = useUserLocation();
  const { area, setArea, me, setMe, selectedId, select } = useMapStore();
  const outsideArea = me !== null && !isInServiceArea(me.lat, me.lng);
  const { data: places = [], isFetching, isError } = useNearbyPlaces(area);
  const selected = useMemo(() => places.find((p) => p.id === selectedId), [places, selectedId]);

  // Có vị trí thật: lưu lại để tính khoảng cách. Chỉ bay tới đó nếu đang ở trong TP.HCM,
  // ngoài ra giữ bản đồ ở Quận 1 (API chỉ có dữ liệu TP.HCM).
  useEffect(() => {
    if (!coords) return;
    setMe(coords);
    if (!isInServiceArea(coords.lat, coords.lng)) return;
    mapRef.current?.flyTo(coords.lat, coords.lng);
    setArea({ lat: coords.lat, lng: coords.lng, radius: 1200 });
  }, [coords, setArea, setMe]);

  return (
    <View style={styles.container}>
      <PlacesMap
        ref={mapRef}
        center={DEFAULT_CENTER}
        places={places}
        selectedId={selectedId}
        me={me}
        onSelect={select}
        onMove={setArea}
      />

      <View style={[styles.badge, { top: insets.top + 8 }]}>
        {isFetching ? <ActivityIndicator size="small" color={colors.primary} /> : null}
        <Text style={styles.badgeText}>
          {isError ? 'Không kết nối được máy chủ' : `${places.length} quán quanh đây`}
        </Text>
      </View>

      {outsideArea ? (
        <View style={[styles.notice, { top: insets.top + 52 }]}>
          <Ionicons name="location-outline" size={16} color={colors.muted} />
          <Text style={styles.noticeText}>Bạn đang ngoài TP.HCM, hiển thị khu vực Quận 1.</Text>
        </View>
      ) : null}

      {status === 'denied' ? (
        <View style={[styles.notice, { top: insets.top + 52 }]}>
          <Ionicons name="location-outline" size={16} color={colors.muted} />
          <Text style={styles.noticeText}>Chưa có quyền vị trí, đang hiển thị khu vực Quận 1.</Text>
        </View>
      ) : null}

      {selected ? (
        <View style={styles.sheet}>
          <PlaceCard place={selected} distance={distanceFrom(me, selected)} />
        </View>
      ) : null}

      <Text style={[styles.attribution, { bottom: selected ? 110 : 8 }]}>
        © OpenStreetMap contributors
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  badge: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.bg,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  badgeText: { fontSize: 13, fontWeight: '600', color: colors.text },
  notice: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  noticeText: { fontSize: 12, color: colors.muted },
  sheet: { position: 'absolute', left: 12, right: 12, bottom: 12 },
  attribution: {
    position: 'absolute',
    right: 8,
    fontSize: 10,
    color: colors.muted,
    backgroundColor: 'rgba(255,255,255,0.8)',
    paddingHorizontal: 4,
  },
});
