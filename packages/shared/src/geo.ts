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

// Khoảng cách đường chim bay giữa hai toạ độ (mét), công thức haversine.
export function haversineMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6_371_000;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
