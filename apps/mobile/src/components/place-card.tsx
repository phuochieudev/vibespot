import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { haversineMeters, type Place } from '@vibespot/shared';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { thumb } from '@/lib/cloudinary';
import { colors, radius, shadow } from '@/theme';

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
      {place.coverUrl ? (
        <Image
          source={{ uri: thumb(place.coverUrl, 200, 200) }}
          style={styles.photo}
          contentFit="cover"
        />
      ) : (
        <View style={[styles.photo, styles.placeholder]}>
          <Ionicons name="cafe" size={30} color={colors.primary} />
        </View>
      )}

      <View style={styles.body}>
        <View style={styles.row}>
          <Text style={styles.name} numberOfLines={1}>
            {place.name}
          </Text>
          {place.reviewCount > 0 ? (
            <View style={styles.rating}>
              <Ionicons name="star" size={13} color={colors.star} />
              <Text style={styles.ratingText}>{place.avgRating.toFixed(1)}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.row}>
          <Ionicons name="location" size={13} color={colors.muted} />
          <Text style={styles.address} numberOfLines={1}>
            {place.address}
          </Text>
          {distance !== undefined ? (
            <Text style={styles.distance}>{formatDistance(distance)}</Text>
          ) : null}
        </View>

        <View style={styles.tag}>
          <Ionicons name="cafe-outline" size={13} color={colors.primary} />
          <Text style={styles.tagText}>Cà phê</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.bg,
    borderRadius: radius.lg,
    padding: 10,
    ...shadow,
    shadowOpacity: 0.07,
  },
  photo: { width: 84, height: 84, borderRadius: radius.md, backgroundColor: colors.surface },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  body: { flex: 1, gap: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  name: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.text },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingText: { fontSize: 13, fontWeight: '700', color: colors.text },
  address: { flex: 1, fontSize: 12.5, color: colors.muted },
  distance: { fontSize: 12.5, color: colors.muted },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  tagText: { fontSize: 12, fontWeight: '600', color: colors.primary },
});
