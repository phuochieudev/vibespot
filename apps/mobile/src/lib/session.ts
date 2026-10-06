import type { AuthResponse } from '@vibespot/shared';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from './config';

// Access token (ngắn hạn) chỉ giữ trong bộ nhớ. Refresh token (dài hạn) lưu trong
// Keychain/Keystore của hệ điều hành qua SecureStore, không bao giờ để ở AsyncStorage.
const REFRESH_KEY = 'vibespot.refreshToken';

let accessToken: string | null = null;
let inflight: Promise<AuthResponse | null> | null = null;
let onExpired: (() => void) | null = null;

export const getAccessToken = () => accessToken;
export const getRefreshToken = () => SecureStore.getItemAsync(REFRESH_KEY);

// Store đăng ký ở đây để biết khi nào phiên hết hạn (refresh bị từ chối) và chuyển về "chưa đăng nhập".
export function onSessionExpired(cb: (() => void) | null) {
  onExpired = cb;
}

export async function saveSession(tokens: Pick<AuthResponse, 'accessToken' | 'refreshToken'>) {
  accessToken = tokens.accessToken;
  await SecureStore.setItemAsync(REFRESH_KEY, tokens.refreshToken);
}

export async function clearSession() {
  accessToken = null;
  await SecureStore.deleteItemAsync(REFRESH_KEY);
}

// Server xoay vòng refresh token: mỗi token chỉ dùng một lần, dùng lại là bị coi là đánh cắp
// và thu hồi cả phiên. Nên nhiều request cùng gặp 401 phải dùng chung MỘT lần refresh.
export function refreshSession(): Promise<AuthResponse | null> {
  inflight ??= doRefresh().finally(() => {
    inflight = null;
  });
  return inflight;
}

async function doRefresh(): Promise<AuthResponse | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return null;

  // Lỗi mạng (fetch ném lỗi) cố ý không bắt ở đây: mất mạng không có nghĩa là hết phiên,
  // nên không được xoá token đã lưu.
  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (res.status === 401 || res.status === 400) {
    await clearSession();
    onExpired?.();
    return null;
  }
  if (!res.ok) throw new Error(`Refresh failed: HTTP ${res.status}`);

  const data = (await res.json()) as AuthResponse;
  await saveSession(data);
  return data;
}
