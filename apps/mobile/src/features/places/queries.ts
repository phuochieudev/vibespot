import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { Place } from '@vibespot/shared';
import { api } from '@/lib/api';

interface Area {
  lat: number;
  lng: number;
  radius: number;
}

// Làm tròn để kéo bản đồ một chút không làm gọi lại API liên tục.
const round = (n: number, digits: number) => Number(n.toFixed(digits));

export function useNearbyPlaces(area: Area) {
  const key = {
    lat: round(area.lat, 3),
    lng: round(area.lng, 3),
    radius: Math.round(area.radius / 100) * 100,
  };
  return useQuery({
    queryKey: ['places', 'nearby', key],
    queryFn: () => api<Place[]>('/places/nearby', { ...key, category: 'CAFE', limit: 100 }),
    placeholderData: keepPreviousData,
  });
}
