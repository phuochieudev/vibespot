import { haversineMeters, type Place } from '@vibespot/shared';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '@/theme';

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  const km = meters / 1000;
  return km < 10 ? `${km.toFixed(1)} km` : `${Math.round(km)} km`;
}

// Khoảng cách từ vị trí thật của người dùng tới quán (không phụ thuộc tâm bản đồ).
export function distanceFrom(me: { lat: number; lng: number } | null, place: Place) {
  return me ? haversineMeters(me, place) : undefined;
}

export function PlaceCard({
  place,
  distance,
  onPress,
}: {
  place: Place;
  distance?: number;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.name} numberOfLines={1}>
          {place.name}
        </Text>
        {distance !== undefined ? (
          <Text style={styles.distance}>{formatDistance(distance)}</Text>
        ) : null}
      </View>
      <Text style={styles.address} numberOfLines={2}>
        {place.address}
      </Text>
      {place.reviewCount > 0 ? (
        <Text style={styles.rating}>
          ★ {place.avgRating.toFixed(1)} ({place.reviewCount})
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  name: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.text },
  distance: { fontSize: 13, fontWeight: '600', color: colors.primary },
  address: { fontSize: 13, color: colors.muted },
  rating: { fontSize: 13, fontWeight: '600', color: '#B45309' },
});
