// Bảng màu lấy theo thiết kế: xanh lá đậm cho hành động chính, tím chàm cho bản đồ/bộ lọc.
export const colors = {
  primary: '#14604D',
  primaryDark: '#0E4A3B',
  primarySoft: '#E3F1EC',
  accent: '#4F46E5',
  accentDark: '#3730A3',
  accentSoft: '#EEF0FF',
  bg: '#FFFFFF',
  surface: '#F4F7F5',
  text: '#16221E',
  muted: '#6B7A75',
  border: '#E3E9E6',
  danger: '#B91C1C',
  star: '#F59E0B',
} as const;

export const radius = { sm: 10, md: 14, lg: 20, pill: 999 } as const;

export const shadow = {
  shadowColor: '#0B1F18',
  shadowOpacity: 0.12,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 3 },
  elevation: 4,
} as const;
