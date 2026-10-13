import { DEFAULT_CENTER, createPlaceSchema, isInServiceArea, type CafeAttributes } from '@vibespot/shared';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/button';
import { ChipSelect } from '@/components/chip-select';
import { ScreenHeader } from '@/components/screen-header';
import { TextField } from '@/components/text-field';
import { useCreatePlace } from '@/features/places/queries';
import { useAuth } from '@/stores/auth-store';
import { useMapStore } from '@/stores/map-store';
import { colors } from '@/theme';

type Flag = 'hasWifi' | 'airConditioned' | 'openLate' | 'freeParking';
type Outlets = NonNullable<CafeAttributes['outlets']>;
type Noise = NonNullable<CafeAttributes['noise']>;
type Where = 'map' | 'me';

const FLAGS: { value: Flag; label: string }[] = [
  { value: 'hasWifi', label: 'Có wifi' },
  { value: 'airConditioned', label: 'Máy lạnh' },
  { value: 'openLate', label: 'Mở khuya' },
  { value: 'freeParking', label: 'Giữ xe miễn phí' },
];
const OUTLETS: { value: Outlets; label: string }[] = [
  { value: 'NONE', label: 'Không có' },
  { value: 'FEW', label: 'Ít' },
  { value: 'SOME', label: 'Vừa' },
  { value: 'MANY', label: 'Nhiều' },
];
const NOISE: { value: Noise; label: string }[] = [
  { value: 'QUIET', label: 'Yên tĩnh' },
  { value: 'MODERATE', label: 'Vừa phải' },
  { value: 'LOUD', label: 'Ồn' },
];

export default function AddPlaceScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const { area, me } = useMapStore();
  const create = useCreatePlace();

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [district, setDistrict] = useState('');
  const [where, setWhere] = useState<Where>('map');
  const [flags, setFlags] = useState<Flag[]>([]);
  const [outlets, setOutlets] = useState<Outlets | undefined>();
  const [noise, setNoise] = useState<Noise | undefined>();
  const [error, setError] = useState<string | null>(null);

  const meUsable = me !== null && isInServiceArea(me.lat, me.lng);
  const point = where === 'me' && meUsable ? me : { lat: area.lat, lng: area.lng };

  if (!user) {
    return (
      <View style={[styles.gate, { paddingTop: insets.top + 8 }]}>
        <ScreenHeader />
        <Text style={styles.title}>Cần đăng nhập</Text>
        <Text style={styles.muted}>Đăng nhập để thêm quán và giúp mọi người tìm chỗ làm việc.</Text>
        <Button label="Đăng nhập" onPress={() => router.replace('/login')} />
      </View>
    );
  }

  if (create.isSuccess) {
    return (
      <View style={[styles.gate, { paddingTop: insets.top + 8 }]}>
        <ScreenHeader />
        <Text style={styles.title}>Cảm ơn bạn!</Text>
        <Text style={styles.muted}>
          Quán "{create.data.name}" đã được gửi và sẽ xuất hiện trên bản đồ sau khi được duyệt. Bạn xem
          trạng thái ở tab Tôi, mục "Đóng góp của tôi".
        </Text>
        <Button label="Xong" onPress={() => router.back()} />
      </View>
    );
  }

  function onSubmit() {
    setError(null);
    const attributes: CafeAttributes = { outlets, noise };
    for (const f of flags) attributes[f] = true;

    const parsed = createPlaceSchema.safeParse({
      name,
      address,
      district: district || undefined,
      lat: point.lat,
      lng: point.lng,
      category: 'CAFE',
      attributes,
    });
    if (!parsed.success) return setError(parsed.error.issues[0]!.message);
    create.mutate(parsed.data, { onError: (e) => setError(e.message) });
  }

  const toggleFlag = (f: Flag) =>
    setFlags((cur) => (cur.includes(f) ? cur.filter((x) => x !== f) : [...cur, f]));

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]}
      >
        <ScreenHeader title="Thêm quán" />

        <TextField label="Tên quán" value={name} onChangeText={setName} autoCapitalize="words" />
        <TextField label="Địa chỉ" value={address} onChangeText={setAddress} placeholder="Số nhà, đường, phường" />
        <TextField label="Quận / huyện (không bắt buộc)" value={district} onChangeText={setDistrict} autoCapitalize="words" />

        <Text style={styles.label}>Vị trí quán</Text>
        <ChipSelect
          options={[
            { value: 'map', label: 'Giữa bản đồ' },
            { value: 'me', label: 'Vị trí của tôi' },
          ]}
          selected={[where]}
          onToggle={setWhere}
        />
        <Text style={styles.muted}>
          {where === 'me' && !meUsable
            ? 'Chưa có vị trí của bạn trong TP.HCM, đang dùng giữa bản đồ. '
            : ''}
          Toạ độ: {point.lat.toFixed(5)}, {point.lng.toFixed(5)}
          {'\n'}Mẹo: ra tab Bản đồ, kéo tới đúng chỗ quán rồi quay lại đây chọn "Giữa bản đồ".
        </Text>

        <Text style={styles.label}>Tiện ích</Text>
        <ChipSelect options={FLAGS} selected={flags} onToggle={toggleFlag} />

        <Text style={styles.label}>Ổ cắm điện</Text>
        <ChipSelect
          options={OUTLETS}
          selected={outlets ? [outlets] : []}
          onToggle={(v) => setOutlets((cur) => (cur === v ? undefined : v))}
        />

        <Text style={styles.label}>Độ ồn</Text>
        <ChipSelect
          options={NOISE}
          selected={noise ? [noise] : []}
          onToggle={(v) => setNoise((cur) => (cur === v ? undefined : v))}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button label="Gửi quán" onPress={onSubmit} loading={create.isPending} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 20, paddingBottom: 40, gap: 14 },
  gate: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 20, gap: 14 },
  title: { fontSize: 26, fontWeight: '800', color: colors.text },
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginTop: 4 },
  muted: { fontSize: 13, color: colors.muted },
  error: { color: '#B91C1C', fontSize: 14 },
});
