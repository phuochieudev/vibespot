import { Image } from 'expo-image';
import { useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/button';
import { ChipSelect } from '@/components/chip-select';
import { useAdminPhotos, useAdminPlaces, useModerate } from '@/features/places/queries';
import { thumb } from '@/lib/cloudinary';
import { describeAttributes } from '@/lib/place-attributes';
import { useAuth } from '@/stores/auth-store';
import { colors, radius } from '@/theme';

type Tab = 'photos' | 'places';

// Màn hình duyệt nội dung cho admin. Ẩn khỏi người dùng thường ở tab Tôi, và server từ chối
// (403) nếu ai đó vào được màn hình này mà không có quyền.
export default function AdminScreen() {
  const isAdmin = useAuth((s) => s.user?.role === 'ADMIN');
  const [tab, setTab] = useState<Tab>('photos');
  const photos = useAdminPhotos(isAdmin);
  const places = useAdminPlaces(isAdmin);
  const moderatePhoto = useModerate('photos');
  const moderatePlace = useModerate('places');

  if (!isAdmin) {
    return <Text style={styles.empty}>Bạn không có quyền truy cập khu vực này.</Text>;
  }

  const active = tab === 'photos' ? photos : places;
  const mutation = tab === 'photos' ? moderatePhoto : moderatePlace;
  const decide = (id: string, status: 'APPROVED' | 'REJECTED') => mutation.mutate({ id, status });
  const busyId = mutation.isPending ? mutation.variables.id : null;

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <ChipSelect
          options={[
            { value: 'photos' as Tab, label: `Ảnh (${photos.data?.length ?? 0})` },
            { value: 'places' as Tab, label: `Quán (${places.data?.length ?? 0})` },
          ]}
          selected={[tab]}
          onToggle={setTab}
        />
      </View>

      {mutation.isError ? <Text style={styles.error}>{mutation.error.message}</Text> : null}

      {active.isLoading ? (
        <ActivityIndicator style={styles.loading} color={colors.primary} />
      ) : tab === 'photos' ? (
        <FlatList
          data={photos.data}
          keyExtractor={(p) => p.id}
          refreshing={photos.isRefetching}
          onRefresh={photos.refetch}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>Không có ảnh nào đang chờ duyệt.</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Image
                source={{ uri: thumb(item.url, 600, 400) }}
                style={styles.photo}
                contentFit="cover"
              />
              <Text style={styles.title}>{item.place.name}</Text>
              <Text style={styles.muted}>Đăng bởi {item.user.displayName}</Text>
              <Actions busy={busyId === item.id} onDecide={(s) => decide(item.id, s)} />
            </View>
          )}
        />
      ) : (
        <FlatList
          data={places.data}
          keyExtractor={(p) => p.id}
          refreshing={places.isRefetching}
          onRefresh={places.refetch}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>Không có quán nào đang chờ duyệt.</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.title}>{item.name}</Text>
              <Text style={styles.muted}>{item.address}</Text>
              <Text style={styles.muted}>
                {item.lat.toFixed(5)}, {item.lng.toFixed(5)}
              </Text>
              {describeAttributes(item.attributes).length > 0 ? (
                <Text style={styles.tags}>{describeAttributes(item.attributes).join(' · ')}</Text>
              ) : null}
              <Actions busy={busyId === item.id} onDecide={(s) => decide(item.id, s)} />
            </View>
          )}
        />
      )}
    </View>
  );
}

function Actions({
  busy,
  onDecide,
}: {
  busy: boolean;
  onDecide: (s: 'APPROVED' | 'REJECTED') => void;
}) {
  return (
    <View style={styles.actions}>
      <View style={styles.flex}>
        <Button
          label="Từ chối"
          variant="ghost"
          onPress={() => onDecide('REJECTED')}
          loading={busy}
        />
      </View>
      <View style={styles.flex}>
        <Button label="Duyệt" onPress={() => onDecide('APPROVED')} loading={busy} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  tabs: { padding: 16, paddingBottom: 8 },
  list: { padding: 16, paddingTop: 8, gap: 12 },
  loading: { marginTop: 40 },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 40, paddingHorizontal: 20 },
  error: { color: '#B91C1C', paddingHorizontal: 16 },
  card: {
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    padding: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  photo: { width: '100%', height: 200, borderRadius: radius.sm, backgroundColor: colors.surface },
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
  muted: { fontSize: 13, color: colors.muted },
  tags: { fontSize: 13, fontWeight: '600', color: colors.primaryDark },
  actions: { flexDirection: 'row', gap: 8, marginTop: 6 },
  flex: { flex: 1 },
});
