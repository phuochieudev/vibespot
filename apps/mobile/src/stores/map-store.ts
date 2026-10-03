import { DEFAULT_CENTER } from '@vibespot/shared';
import { create } from 'zustand';

interface Coords {
  lat: number;
  lng: number;
}

interface MapState {
  // Vùng đang xem trên bản đồ; tab Danh sách dùng chung để hiển thị cùng kết quả.
  area: Coords & { radius: number };
  // Vị trí thật của người dùng (null nếu chưa có / chưa cấp quyền).
  me: Coords | null;
  selectedId: string | null;
  setArea: (area: MapState['area']) => void;
  setMe: (me: Coords | null) => void;
  select: (id: string | null) => void;
}

export const useMapStore = create<MapState>((set) => ({
  area: { ...DEFAULT_CENTER, radius: 1500 },
  me: null,
  selectedId: null,
  setArea: (area) => set({ area }),
  setMe: (me) => set({ me }),
  select: (selectedId) => set({ selectedId }),
}));
