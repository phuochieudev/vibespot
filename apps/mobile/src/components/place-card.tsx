import type { Place } from '@vibespot/shared';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '@/theme';

export function formatDistance(meters?: number): string {
  if (meters === undefined) return '';
  return meters < 1000 ? `${meters} m` : `${(meters / 1000).toFixed(1)} km`;
}

export function PlaceCard({ place, onPress }: { place: Place; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.name} numberOfLines={1}>
          {place.name}
        </Text>
        <Text style={styles.distance}>{formatDistance(place.distanceMeters)}</Text>
      </View>
      <Text style={styles.address} numberOfLines={2}>
        {place.address}
      </Text>
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
});
