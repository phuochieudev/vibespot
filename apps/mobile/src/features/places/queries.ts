import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AdminPhoto, CreatePlaceInput, CreateReviewInput, MeStats, Photo, Place, Review } from '@vibespot/shared';
import { uploadImage } from '@/features/photos/upload';
import { api } from '@/lib/api';
import type { Filters } from '@/stores/map-store';

interface Area {
  lat: number;
  lng: number;
  radius: number;
}

// Làm tròn để kéo bản đồ một chút không làm gọi lại API liên tục.
const round = (n: number, digits: number) => Number(n.toFixed(digits));

export function useNearbyPlaces(area: Area, filters: Filters) {
  const key = {
    lat: round(area.lat, 3),
    lng: round(area.lng, 3),
    radius: Math.round(area.radius / 100) * 100,
  };
  return useQuery({
    // Bộ lọc nằm trong queryKey: đổi bộ lọc là tự gọi lại API, và mỗi tổ hợp có cache riêng.
    queryKey: ['places', 'nearby', key, filters],
    queryFn: () =>
      api<Place[]>('/places/nearby', {
        params: {
          ...key,
          category: 'CAFE',
          limit: 100,
          // Chỉ gửi khi bật; tắt thì bỏ hẳn tham số (nghĩa là "không lọc", khác với "false").
          hasWifi: filters.hasWifi ? 'true' : undefined,
          airConditioned: filters.airConditioned ? 'true' : undefined,
        },
      }),
    placeholderData: keepPreviousData,
  });
}

export function usePlace(id: string) {
  // `enabled`: không gọi API khi chưa có id (vd. mở trang chi tiết sai cách).
  return useQuery({
    queryKey: ['place', id],
    queryFn: () => api<Place>(`/places/${id}`),
    enabled: Boolean(id),
  });
}

export function useReviews(id: string) {
  return useQuery({
    queryKey: ['reviews', id],
    queryFn: () => api<Review[]>(`/places/${id}/reviews`),
    enabled: Boolean(id),
  });
}

export function useSubmitReview(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateReviewInput) =>
      api<Review>(`/places/${id}/reviews`, { method: 'POST', auth: true, body: input }),
    onSuccess: () => {
      // Điểm trung bình đổi nên làm mới chi tiết, danh sách đánh giá và các danh sách quán.
      void client.invalidateQueries({ queryKey: ['place', id] });
      void client.invalidateQueries({ queryKey: ['reviews', id] });
      void client.invalidateQueries({ queryKey: ['places', 'nearby'] });
    },
  });
}

export function useMyPlaces(enabled: boolean) {
  return useQuery({
    queryKey: ['places', 'mine'],
    queryFn: () => api<Place[]>('/me/places', { auth: true }),
    enabled,
  });
}

export function useCreatePlace() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePlaceInput) =>
      api<Place>('/places', { method: 'POST', auth: true, body: input }),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['places', 'mine'] });
    },
  });
}

export function usePhotos(id: string) {
  return useQuery({
    queryKey: ['photos', id],
    queryFn: () => api<Photo[]>(`/places/${id}/photos`),
    enabled: Boolean(id),
  });
}

// Upload lên Cloudinary rồi báo cho server lưu địa chỉ ảnh.
export function useAddPhoto(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (uri: string) => {
      const image = await uploadImage(uri);
      return api<Photo>(`/places/${id}/photos`, { method: 'POST', auth: true, body: image });
    },
    onSuccess: () => void client.invalidateQueries({ queryKey: ['photos', id] }),
  });
}

// ---- Quản trị (chỉ tài khoản ADMIN; server vẫn kiểm tra quyền ở mọi request) ----

export function useAdminPhotos(enabled: boolean) {
  return useQuery({
    queryKey: ['admin', 'photos'],
    queryFn: () => api<AdminPhoto[]>('/admin/photos', { auth: true, params: { status: 'PENDING' } }),
    enabled,
  });
}

export function useAdminPlaces(enabled: boolean) {
  return useQuery({
    queryKey: ['admin', 'places'],
    queryFn: () => api<Place[]>('/admin/places', { auth: true, params: { status: 'PENDING' } }),
    enabled,
  });
}

export function useModerate(kind: 'photos' | 'places') {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'APPROVED' | 'REJECTED' }) =>
      api(`/admin/${kind}/${id}`, { method: 'PATCH', auth: true, body: { status } }),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['admin', kind] });
      // Duyệt xong thì nội dung công khai thay đổi theo.
      void client.invalidateQueries({ queryKey: [kind === 'photos' ? 'photos' : 'places'] });
    },
  });
}

// ---- Tìm kiếm, quán đã lưu, thống kê hồ sơ ----

export function useSearch(q: string, near: { lat: number; lng: number }) {
  const text = q.trim();
  return useQuery({
    queryKey: ['places', 'search', text, near.lat.toFixed(2), near.lng.toFixed(2)],
    queryFn: () =>
      api<Place[]>('/places/search', { params: { q: text, lat: near.lat, lng: near.lng, limit: 8 } }),
    enabled: text.length > 0,
  });
}

export function useFavorites(enabled: boolean) {
  return useQuery({
    queryKey: ['favorites'],
    queryFn: () => api<Place[]>('/me/favorites', { auth: true }),
    enabled,
  });
}

export function useToggleFavorite() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ placeId, saved }: { placeId: string; saved: boolean }) =>
      api(`/places/${placeId}/favorite`, { method: saved ? 'DELETE' : 'PUT', auth: true }),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['favorites'] });
      void client.invalidateQueries({ queryKey: ['me', 'stats'] });
    },
  });
}

export function useMeStats(enabled: boolean) {
  return useQuery({
    queryKey: ['me', 'stats'],
    queryFn: () => api<MeStats>('/me/stats', { auth: true }),
    enabled,
  });
}
