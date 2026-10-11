import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Platform,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { createReviewSchema, type Place } from '@vibespot/shared';
import { Button } from '@/components/button';
import { distanceFrom, formatDistance } from '@/components/place-card';
import { StarRating } from '@/components/star-rating';
import { useAddPhoto, usePhotos, usePlace, useReviews, useSubmitReview } from '@/features/places/queries';
import { thumb } from '@/lib/cloudinary';
import { describeAttributes } from '@/lib/place-attributes';
import { timeAgo } from '@/lib/time';
import { useAuth } from '@/stores/auth-store';
import { useMapStore } from '@/stores/map-store';
import { colors, radius } from '@/theme';

function openDirections(place: Place) {
  const { lat, lng, name } = place;
  const url = Platform.select({
    ios: `http://maps.apple.com/?daddr=${lat},${lng}&q=${encodeURIComponent(name)}`,
    default: `geo:${lat},${lng}?q=${lat},${lng}(${encodeURIComponent(name)})`,
  });
  void Linking.openURL(url);
}

export default function PlaceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: place, isLoading, isError, error } = usePlace(id);
  const me = useMapStore((s) => s.me);

  if (isLoading) return <ActivityIndicator style={styles.center} color={colors.primary} />;
  if (isError || !place) {
    return (
      <View style={styles.errorBox}>
        <Text style={styles.muted}>Không tải được thông tin quán.</Text>
        {/* Chi tiết lỗi giúp tìm nguyên nhân khi phát triển; bản phát hành sẽ không hiện. */}
        {__DEV__ ? (
          <Text style={styles.debug}>
            {error instanceof Error ? error.message : 'không có lỗi (dữ liệu rỗng)'}
          </Text>
        ) : null}
      </View>
    );
  }

  const distance = distanceFrom(me, place);
  const tags = describeAttributes(place.attributes);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen options={{ title: place.name }} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{place.name}</Text>

        <View style={styles.ratingRow}>
          <StarRating value={place.avgRating} />
          <Text style={styles.muted}>
            {place.reviewCount > 0
              ? `${place.avgRating.toFixed(1)} · ${place.reviewCount} đánh giá`
              : 'Chưa có đánh giá'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={18} color={colors.muted} />
          <Text style={styles.info}>
            {place.address}
            {distance !== undefined ? `  ·  ${formatDistance(distance)}` : ''}
          </Text>
        </View>
        {place.openingHours ? (
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={18} color={colors.muted} />
            <Text style={styles.info}>{place.openingHours.raw}</Text>
          </View>
        ) : null}

        {tags.length > 0 ? (
          <View style={styles.tags}>
            {tags.map((t) => (
              <View key={t} style={styles.tag}>
                <Text style={styles.tagText}>{t}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.muted}>Chưa có thông tin về wifi, ổ cắm. Hãy là người đầu tiên đánh giá!</Text>
        )}

        <PhotoSection placeId={place.id} />

        <Button label="Chỉ đường" onPress={() => openDirections(place)} />

        <Text style={styles.section}>Đánh giá</Text>
        <ReviewSection placeId={place.id} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function PhotoSection({ placeId }: { placeId: string }) {
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const { data: photos = [] } = usePhotos(placeId);
  const add = useAddPhoto(placeId);
  const [error, setError] = useState<string | null>(null);

  async function pick() {
    if (!user) return router.push('/login');
    setError(null);
    // exif: false = không đọc kèm metadata (vd. toạ độ GPS) của ảnh.
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      exif: false,
    });
    const uri = result.assets?.[0]?.uri;
    if (result.canceled || !uri) return;
    add.mutate(uri, { onError: (e) => setError(e.message) });
  }

  return (
    <View style={styles.photos}>
      {photos.length > 0 ? (
        <FlatList
          horizontal
          data={photos}
          keyExtractor={(p) => p.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.photoList}
          renderItem={({ item }) => (
            <Image source={{ uri: thumb(item.url, 400, 300) }} style={styles.photo} contentFit="cover" />
          )}
        />
      ) : (
        <Text style={styles.muted}>Chưa có ảnh nào.</Text>
      )}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button
        variant="ghost"
        label={user ? 'Thêm ảnh' : 'Đăng nhập để thêm ảnh'}
        onPress={pick}
        loading={add.isPending}
      />
    </View>
  );
}

function ReviewSection({ placeId }: { placeId: string }) {
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const { data: reviews = [] } = useReviews(placeId);
  const submit = useSubmitReview(placeId);

  const mine = reviews.find((r) => r.user.id === user?.id);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Đã đánh giá rồi thì điền sẵn để sửa.
  useEffect(() => {
    if (mine) {
      setRating(mine.rating);
      setComment(mine.comment ?? '');
    }
  }, [mine?.id, mine?.rating, mine?.comment]);

  function onSubmit() {
    setError(null);
    const parsed = createReviewSchema.safeParse({ rating, comment: comment || undefined });
    if (!parsed.success) {
      setError(rating === 0 ? 'Hãy chọn số sao' : parsed.error.issues[0]!.message);
      return;
    }
    submit.mutate(parsed.data, { onError: (e) => setError(e.message) });
  }

  return (
    <View style={styles.reviews}>
      {user ? (
        <View style={styles.form}>
          <Text style={styles.formTitle}>{mine ? 'Đánh giá của bạn' : 'Viết đánh giá'}</Text>
          <StarRating value={rating} onChange={setRating} size={30} />
          <TextInput
            value={comment}
            onChangeText={setComment}
            multiline
            maxLength={1000}
            placeholder="Wifi có mạnh không? Có nhiều ổ cắm không?"
            placeholderTextColor={colors.muted}
            style={styles.input}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button
            label={mine ? 'Cập nhật đánh giá' : 'Gửi đánh giá'}
            onPress={onSubmit}
            loading={submit.isPending}
          />
        </View>
      ) : (
        <Button label="Đăng nhập để đánh giá" variant="ghost" onPress={() => router.push('/login')} />
      )}

      {reviews.length === 0 ? <Text style={styles.muted}>Chưa có đánh giá nào.</Text> : null}
      {reviews.map((r) => (
        <View key={r.id} style={styles.review}>
          <View style={styles.reviewHead}>
            <Text style={styles.reviewer}>{r.user.displayName}</Text>
            <Text style={styles.muted}>{timeAgo(r.createdAt)}</Text>
          </View>
          <StarRating value={r.rating} size={14} />
          {r.comment ? <Text style={styles.comment}>{r.comment}</Text> : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  center: { marginTop: 60, textAlign: 'center' },
  errorBox: { marginTop: 60, paddingHorizontal: 20, gap: 12, alignItems: 'center' },
  debug: { fontSize: 12, color: '#B91C1C', textAlign: 'center' },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  info: { flex: 1, fontSize: 14, color: colors.text },
  muted: { fontSize: 13, color: colors.muted },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { backgroundColor: colors.surface, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  tagText: { fontSize: 13, fontWeight: '600', color: colors.primaryDark },
  photos: { gap: 6 },
  photoList: { gap: 8 },
  photo: { width: 200, height: 150, borderRadius: radius.md, backgroundColor: colors.surface },
  section: { fontSize: 18, fontWeight: '800', color: colors.text, marginTop: 12 },
  reviews: { gap: 12 },
  form: { gap: 10, backgroundColor: colors.surface, padding: 14, borderRadius: radius.md },
  formTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  input: {
    minHeight: 80,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
    padding: 10,
    fontSize: 15,
    color: colors.text,
    textAlignVertical: 'top',
  },
  error: { color: '#B91C1C', fontSize: 13 },
  review: { gap: 4, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  reviewHead: { flexDirection: 'row', justifyContent: 'space-between' },
  reviewer: { fontSize: 14, fontWeight: '700', color: colors.text },
  comment: { fontSize: 14, color: colors.text },
});
