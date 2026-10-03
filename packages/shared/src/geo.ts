// Khu vực phục vụ: hình chữ nhật bao quanh TP.HCM (xấp xỉ, đủ để chặn toạ độ sai chỗ).
export const SERVICE_AREA = {
  minLat: 10.3,
  maxLat: 11.2,
  minLng: 106.3,
  maxLng: 107.1,
} as const;

// Tâm mặc định của bản đồ (Quận 1).
export const DEFAULT_CENTER = { lat: 10.7769, lng: 106.7009 } as const;

export function isInServiceArea(lat: number, lng: number): boolean {
  return (
    lat >= SERVICE_AREA.minLat &&
    lat <= SERVICE_AREA.maxLat &&
    lng >= SERVICE_AREA.minLng &&
    lng <= SERVICE_AREA.maxLng
  );
}
