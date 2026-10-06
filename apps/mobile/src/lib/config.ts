import Constants from 'expo-constants';

// Địa chỉ API:
// - Ưu tiên EXPO_PUBLIC_API_URL (khi đã deploy).
// - Khi dev, lấy IP của máy Mac từ địa chỉ Metro đang chạy (vd. 192.168.1.64:8081)
//   để điện thoại thật gọi được tới API mà không phải cấu hình tay.
function resolveBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, '');

  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  return `http://${host ?? 'localhost'}:3000/api`;
}

export const API_URL = resolveBaseUrl();
