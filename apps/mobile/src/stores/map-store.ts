import { DEFAULT_CENTER } from '@vibespot/shared';
import { create } from 'zustand';

interface Coords {
  lat: number;
  lng: number;
}

export interface Filters {
  hasWifi: boolean;
  airConditioned: boolean;
}

interface MapState {
  // Vùng đang xem trên bản đồ; tab Danh sách dùng chung để hiển thị cùng kết quả.
  area: Coords & { radius: number };
  // Vị trí thật của người dùng (null nếu chưa có / chưa cấp quyền).
  me: Coords | null;
  filters: Filters;
  selectedId: string | null;
  setArea: (area: MapState['area']) => void;
  setMe: (me: Coords | null) => void;
  select: (id: string | null) => void;
  toggleFilter: (key: keyof Filters) => void;
}

export const useMapStore = create<MapState>((set) => ({
  area: { ...DEFAULT_CENTER, radius: 1500 },
  me: null,
  filters: { hasWifi: false, airConditioned: false },
  selectedId: null,
  setArea: (area) => set({ area }),
  setMe: (me) => set({ me }),
  select: (selectedId) => set({ selectedId }),
  toggleFilter: (key) => set((s) => ({ filters: { ...s.filters, [key]: !s.filters[key] } })),
}));
