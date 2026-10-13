import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createReviewSchema, type Place } from '@vibespot/shared';
import { Button } from '@/components/button';
import { distanceFrom, formatDistance } from '@/components/place-card';
import { PlacesMap } from '@/components/places-map';
import { StarRating } from '@/components/star-rating';
import {
  useAddPhoto,
  useFavorites,
  usePhotos,
  usePlace,
  useReviews,
  useSubmitReview,
  useToggleFavorite,
} from '@/features/places/queries';
import { thumb } from '@/lib/cloudinary';
import { describeAttributes } from '@/lib/place-attributes';
import { timeAgo } from '@/lib/time';
import { useAuth } from '@/stores/auth-store';
import { useMapStore } from '@/stores/map-store';
import { colors, radius, shadow } from '@/theme';

type IconName = keyof typeof Ionicons.glyphMap;

function openDirections(place: Place) {
  const { lat, lng, name } = place;
  const url = Platform.select({
    ios: `http://maps.apple.com/?daddr=${lat},${lng}&q=${encodeURIComponent(name)}`,
    default: `geo:${lat},${lng}?q=${lat},${lng}(${encodeURIComponent(name)})`,
  });
  void Linking.openURL(url);
}

// Biểu tượng cho từng nhãn thuộc tính (nhãn do describeAttributes tạo ra).
function iconFor(label: string): IconName {
  if (label.includes('wifi') || label.startsWith('Wifi')) return 'wifi';
  if (label === 'Máy lạnh') return 'snow';
  if (label === 'Mở khuya') return 'moon';
  if (label.includes('Giữ xe')) return 'car';
  if (label.includes('ổ cắm')) return 'flash';
  if (label.includes('ồn') || label === 'Yên tĩnh') return 'volume-medium';
  return 'information-circle-outline';
}

export default function PlaceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const user = useAuth((s) => s.user);
  const me = useMapStore((s) => s.me);

  const { data: place, isLoading, isError, error } = usePlace(id);
  const { data: photos = [] } = usePhotos(id);
  const favorites = useFavorites(user !== null);
  const toggleFavorite = useToggleFavorite();
  const [heroIndex, setHeroIndex] = useState(0);

  if (isLoading) return <ActivityIndicator style={styles.center} color={colors.primary} />;
  if (isError || !place) {
    return (
      <View style={[styles.errorBox, { paddingTop: insets.top + 60 }]}>
        <Text style={styles.muted}>Không tải được thông tin quán.</Text>
        {/* Chi tiết lỗi giúp tìm nguyên nhân khi phát triển; bản phát hành sẽ không hiện. */}
        {__DEV__ ? <Text style={styles.debug}>{error instanceof Error ? error.message : 'dữ liệu rỗng'}</Text> : null}
        <Button label="Quay lại" variant="outline" onPress={() => router.back()} />
      </View>
    );
  }

  const saved = favorites.data?.some((p) => p.id === place.id) ?? false;
  const distance = distanceFrom(me, place);
  const tags = describeAttributes(place.attributes);
  const heroImages = photos.length > 0 ? photos.map((p) => p.url) : place.coverUrl ? [place.coverUrl] : [];

  function onHeart() {
    if (!user) return router.push('/login');
    toggleFavorite.mutate({ placeId: place!.id, saved });
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={{ height: 280 }}>
          {heroImages.length > 0 ? (
            <FlatList
              horizontal
              pagingEnabled
              data={heroImages}
              keyExtractor={(u) => u}
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => setHeroIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
              renderItem={({ item }) => (
                <Image source={{ uri: thumb(item, 900, 600) }} style={{ width, height: 280 }} contentFit="cover" />
              )}
            />
          ) : (
            <View style={[styles.heroEmpty, { width }]}>
              <Ionicons name="cafe" size={64} color={colors.primary} />
            </View>
          )}

          <View style={[styles.heroBar, { top: insets.top + 8 }]} pointerEvents="box-none">
            <Pressable
              accessibilityLabel="Quay lại"
              style={styles.heroBtn}
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
            >
              <Ionicons name="arrow-back" size={22} color={colors.text} />
            </Pressable>
            <View style={styles.heroRight}>
              <Pressable accessibilityLabel={saved ? 'Bỏ lưu' : 'Lưu quán'} style={styles.heroBtn} onPress={onHeart}>
                <Ionicons name={saved ? 'heart' : 'heart-outline'} size={22} color={saved ? '#E11D48' : colors.text} />
              </Pressable>
              <Pressable
                accessibilityLabel="Chia sẻ"
                style={styles.heroBtn}
                onPress={() => void Share.share({ message: `${place.name}\n${place.address}` })}
              >
                <Ionicons name="share-outline" size={22} color={colors.text} />
              </Pressable>
            </View>
          </View>

          {heroImages.length > 1 ? (
            <Text style={styles.counter}>
              {heroIndex + 1}/{heroImages.length}
            </Text>
          ) : null}
        </View>

        <View style={styles.sheet}>
          <Text style={styles.title}>{place.name}</Text>

          <View style={styles.row}>
            <Ionicons name="star" size={16} color={colors.star} />
            <Text style={styles.ratingNum}>{place.reviewCount > 0 ? place.avgRating.toFixed(1) : '–'}</Text>
            <Text style={styles.muted}>
              {place.reviewCount > 0 ? `(${place.reviewCount} đánh giá)` : 'Chưa có đánh giá'}
            </Text>
          </View>

          {distance !== undefined ? (
            <View style={styles.row}>
              <Ionicons name="navigate-outline" size={17} color={colors.muted} />
              <Text style={styles.info}>{formatDistance(distance)}</Text>
            </View>
          ) : null}
          <View style={styles.row}>
            <Ionicons name="location-outline" size={17} color={colors.muted} />
            <Text style={[styles.info, styles.flex]}>{place.address}</Text>
          </View>
          {place.openingHours ? (
            <View style={styles.row}>
              <Ionicons name="time-outline" size={17} color={colors.muted} />
              <Text style={[styles.info, styles.flex]}>{place.openingHours.raw}</Text>
            </View>
          ) : null}

          <View style={styles.tags}>
            <View style={styles.tag}>
              <Ionicons name="cafe-outline" size={15} color={colors.primary} />
              <Text style={styles.tagText}>Cà phê</Text>
            </View>
            {tags.map((t) => (
              <View key={t} style={styles.tag}>
                <Ionicons name={iconFor(t)} size={15} color={colors.primary} />
                <Text style={styles.tagText}>{t}</Text>
              </View>
            ))}
          </View>
          {tags.length === 0 ? (
            <Text style={styles.muted}>Chưa có thông tin về wifi, ổ cắm. Hãy là người đầu tiên đánh giá!</Text>
          ) : null}

          <View style={styles.miniMap} pointerEvents="none">
            <PlacesMap
              center={{ lat: place.lat, lng: place.lng }}
              places={[place]}
              selectedId={place.id}
              me={null}
              onSelect={() => undefined}
              onMove={() => undefined}
            />
            <Text style={styles.miniAttribution}>© OpenStreetMap contributors © CARTO</Text>
          </View>

          <Button
            label="Chỉ đường"
            icon={<Ionicons name="arrow-forward" size={20} color="#fff" />}
            onPress={() => openDirections(place)}
          />

          <Text style={styles.section}>Ảnh</Text>
          <PhotoSection placeId={place.id} photoCount={photos.length} />

          <Text style={styles.section}>Đánh giá</Text>
          <ReviewSection placeId={place.id} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function PhotoSection({ placeId, photoCount }: { placeId: string; photoCount: number }) {
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const { data: photos = [] } = usePhotos(placeId);
  const add = useAddPhoto(placeId);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function pick() {
    if (!user) return router.push('/login');
    setError(null);
    setNotice(null);
    // exif: false = không đọc kèm metadata (vd. toạ độ GPS) của ảnh.
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7, exif: false });
    const uri = result.assets?.[0]?.uri;
    if (result.canceled || !uri) return;
    add.mutate(uri, {
      // Ảnh của người dùng thường phải chờ admin duyệt nên chưa hiện ngay; báo rõ để họ khỏi tưởng ảnh bị mất.
      onSuccess: (p) =>
        setNotice(p.status === 'PENDING' ? 'Đã gửi ảnh. Ảnh sẽ hiện sau khi quản trị viên duyệt.' : null),
      onError: (e) => setError(e.message),
    });
  }

  return (
    <View style={styles.block}>
      {photoCount > 0 ? (
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
      {notice ? <Text style={styles.notice}>{notice}</Text> : null}
      <Button
        variant="outline"
        label={user ? 'Thêm ảnh' : 'Đăng nhập để thêm ảnh'}
        icon={<Ionicons name="camera-outline" size={20} color={colors.text} />}
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
    <View style={styles.block}>
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
          <Button label={mine ? 'Cập nhật đánh giá' : 'Gửi đánh giá'} onPress={onSubmit} loading={submit.isPending} />
        </View>
      ) : (
        <Button label="Đăng nhập để đánh giá" variant="outline" onPress={() => router.push('/login')} />
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
  center: { marginTop: 80 },
  errorBox: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 20, gap: 14, alignItems: 'center' },
  debug: { fontSize: 12, color: colors.danger, textAlign: 'center' },
  scroll: { paddingBottom: 40 },
  heroEmpty: { height: 280, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  heroBar: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between' },
  heroRight: { flexDirection: 'row', gap: 10 },
  heroBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
    shadowOpacity: 0.15,
  },
  counter: {
    position: 'absolute',
    right: 16,
    bottom: 40,
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  sheet: {
    marginTop: -28,
    backgroundColor: colors.bg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    gap: 12,
  },
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ratingNum: { fontSize: 15, fontWeight: '800', color: colors.text },
  info: { fontSize: 14, color: colors.text },
  muted: { fontSize: 13, color: colors.muted },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
  },
  tagText: { fontSize: 13, fontWeight: '600', color: colors.primary },
  miniMap: { height: 160, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.surface, marginVertical: 4 },
  miniAttribution: { position: 'absolute', right: 6, bottom: 4, fontSize: 9, color: colors.muted, backgroundColor: 'rgba(255,255,255,0.85)', paddingHorizontal: 3 },
  section: { fontSize: 18, fontWeight: '800', color: colors.text, marginTop: 14 },
  block: { gap: 12 },
  photoList: { gap: 8 },
  photo: { width: 200, height: 150, borderRadius: radius.md, backgroundColor: colors.surface },
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
  error: { color: colors.danger, fontSize: 13 },
  notice: { color: '#166534', fontSize: 13 },
  review: { gap: 4, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  reviewHead: { flexDirection: 'row', justifyContent: 'space-between' },
  reviewer: { fontSize: 14, fontWeight: '700', color: colors.text },
  comment: { fontSize: 14, color: colors.text },
});
