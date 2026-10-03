import { DEFAULT_CENTER } from '@vibespot/shared';
import { create } from 'zustand';

interface MapState {
  // Vùng đang xem trên bản đồ; tab Danh sách dùng chung để hiển thị cùng kết quả.
  area: { lat: number; lng: number; radius: number };
  selectedId: string | null;
  setArea: (area: MapState['area']) => void;
  select: (id: string | null) => void;
}

export const useMapStore = create<MapState>((set) => ({
  area: { ...DEFAULT_CENTER, radius: 1500 },
  selectedId: null,
  setArea: (area) => set({ area }),
  select: (selectedId) => set({ selectedId }),
}));
