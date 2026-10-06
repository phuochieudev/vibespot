import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { Place } from '@vibespot/shared';
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
        ...key,
        category: 'CAFE',
        limit: 100,
        // Chỉ gửi khi bật; tắt thì bỏ hẳn tham số (nghĩa là "không lọc", khác với "false").
        hasWifi: filters.hasWifi ? 'true' : undefined,
        airConditioned: filters.airConditioned ? 'true' : undefined,
      }),
    placeholderData: keepPreviousData,
  });
}
