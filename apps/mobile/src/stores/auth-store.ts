import type { AuthResponse, LoginInput, RegisterInput, User } from '@vibespot/shared';
import { create } from 'zustand';
import { api } from '@/lib/api';
import {
  clearSession,
  getRefreshToken,
  onSessionExpired,
  refreshSession,
  saveSession,
} from '@/lib/session';

type Status = 'loading' | 'signedOut' | 'signedIn';

interface AuthState {
  status: Status;
  user: User | null;
  /** Gọi một lần lúc mở app: khôi phục phiên từ refresh token đã lưu. */
  init: () => Promise<void>;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => {
  const signIn = async (res: AuthResponse) => {
    await saveSession(res);
    set({ status: 'signedIn', user: res.user });
  };

  // Refresh bị server từ chối (token hết hạn / bị thu hồi) => về trạng thái chưa đăng nhập.
  onSessionExpired(() => set({ status: 'signedOut', user: null }));

  return {
    status: 'loading',
    user: null,

    async init() {
      try {
        const res = await refreshSession();
        set(res ? { status: 'signedIn', user: res.user } : { status: 'signedOut', user: null });
      } catch {
        // Mất mạng lúc khởi động: coi như chưa đăng nhập nhưng KHÔNG xoá token đã lưu.
        set({ status: 'signedOut', user: null });
      }
    },

    async login(input) {
      await signIn(await api<AuthResponse>('/auth/login', { method: 'POST', body: input }));
    },

    async register(input) {
      await signIn(await api<AuthResponse>('/auth/register', { method: 'POST', body: input }));
    },

    async logout() {
      const refreshToken = await getRefreshToken();
      // Báo server thu hồi token; nếu lỗi mạng vẫn đăng xuất cục bộ.
      if (refreshToken) {
        await api('/auth/logout', { method: 'POST', body: { refreshToken } }).catch(() => undefined);
      }
      await clearSession();
      set({ status: 'signedOut', user: null });
    },
  };
});
