import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, type Region } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DEFAULT_CENTER } from '@vibespot/shared';
import { PlaceCard } from '@/components/place-card';
import { useNearbyPlaces } from '@/features/places/queries';
import { useUserLocation } from '@/lib/use-user-location';
import { useMapStore } from '@/stores/map-store';
import { colors } from '@/theme';

// 1 độ vĩ ~ 111 km. Bán kính tìm = nửa chiều cao vùng nhìn thấy, giới hạn 300m..5km.
const radiusFromRegion = (r: Region) =>
  Math.min(5000, Math.max(300, Math.round((r.latitudeDelta * 111_000) / 2)));

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const { coords, status } = useUserLocation();
  const { area, setArea, selectedId, select } = useMapStore();
  const { data: places = [], isFetching, isError } = useNearbyPlaces(area);
  const selected = useMemo(() => places.find((p) => p.id === selectedId), [places, selectedId]);

  // Có vị trí thật thì bay tới đó và tìm quanh đó.
  useEffect(() => {
    if (!coords) return;
    mapRef.current?.animateToRegion(
      { latitude: coords.lat, longitude: coords.lng, latitudeDelta: 0.012, longitudeDelta: 0.012 },
      500,
    );
    setArea({ lat: coords.lat, lng: coords.lng, radius: 1200 });
  }, [coords, setArea]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={{
          latitude: DEFAULT_CENTER.lat,
          longitude: DEFAULT_CENTER.lng,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        }}
        showsUserLocation={status === 'granted'}
        showsMyLocationButton={false}
        onPress={() => select(null)}
        onRegionChangeComplete={(r) =>
          setArea({ lat: r.latitude, lng: r.longitude, radius: radiusFromRegion(r) })
        }
      >
        {places.map((p) => (
          <Marker
            key={p.id}
            coordinate={{ latitude: p.lat, longitude: p.lng }}
            pinColor={p.id === selectedId ? colors.primaryDark : colors.primary}
            onPress={(e) => {
              e.stopPropagation();
              select(p.id);
            }}
          />
        ))}
      </MapView>

      <View style={[styles.badge, { top: insets.top + 8 }]}>
        {isFetching ? <ActivityIndicator size="small" color={colors.primary} /> : null}
        <Text style={styles.badgeText}>
          {isError ? 'Không kết nối được máy chủ' : `${places.length} quán quanh đây`}
        </Text>
      </View>

      {status === 'denied' ? (
        <View style={[styles.notice, { top: insets.top + 52 }]}>
          <Ionicons name="location-outline" size={16} color={colors.muted} />
          <Text style={styles.noticeText}>Chưa có quyền vị trí, đang hiển thị khu vực Quận 1.</Text>
        </View>
      ) : null}

      {selected ? (
        <View style={styles.sheet}>
          <PlaceCard place={selected} />
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
