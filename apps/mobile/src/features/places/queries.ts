import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreatePlaceInput, CreateReviewInput, Photo, Place, Review } from '@vibespot/shared';
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
