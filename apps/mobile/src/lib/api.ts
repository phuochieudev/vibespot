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

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function api<T>(path: string, params?: Record<string, string | number | undefined>) {
  const query = new URLSearchParams();
  for (const [k, v] of Object.entries(params ?? {})) {
    if (v !== undefined) query.set(k, String(v));
  }
  const qs = query.toString();
  const res = await fetch(`${API_URL}${path}${qs ? `?${qs}` : ''}`);
  if (!res.ok) throw new ApiError(res.status, `API ${res.status}: ${await res.text()}`);
  return (await res.json()) as T;
}
