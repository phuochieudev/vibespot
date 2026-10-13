import { beforeEach, describe, expect, it, vi } from 'vitest';

// SecureStore và Constants là module native, không chạy được trong Node => thay bằng bản giả.
const store = new Map<string, string>();
vi.mock('expo-secure-store', () => ({
  getItemAsync: async (k: string) => store.get(k) ?? null,
  setItemAsync: async (k: string, v: string) => void store.set(k, v),
  deleteItemAsync: async (k: string) => void store.delete(k),
}));
vi.mock('expo-constants', () => ({ default: { expoConfig: { hostUri: 'test:8081' } } }));

const REFRESH_KEY = 'vibespot.refreshToken';
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const user = {
  id: 'u1',
  email: 'a@b.c',
  displayName: 'A',
  avatarUrl: null,
  role: 'USER',
  reputation: 0,
};

interface Server {
  refreshCalls: number;
  refreshOk: boolean;
  networkDown: boolean;
}
let server: Server;

// Giả lập backend: /me chỉ chấp nhận token "new"; /auth/refresh đổi r1 -> (new, r2).
function installFetch() {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: RequestInit) => {
      if (server.networkDown && url.includes('/auth/refresh')) throw new TypeError('offline');
      if (url.includes('/auth/refresh')) {
        server.refreshCalls++;
        if (!server.refreshOk) return json(401, { message: 'Refresh token không hợp lệ' });
        return json(200, { user, accessToken: 'new', refreshToken: 'r2' });
      }
      const auth = (init?.headers as Record<string, string> | undefined)?.Authorization;
      if (url.includes('/me'))
        return auth === 'Bearer new' ? json(200, { ok: true }) : json(401, { message: 'x' });
      if (url.includes('/nocontent')) return new Response(null, { status: 204 });
      return json(200, { auth: auth ?? null });
    }),
  );
}

async function load() {
  vi.resetModules(); // mỗi test có trạng thái module (access token, refresh đang chạy) sạch
  const session = await import('./session');
  const { api, ApiError } = await import('./api');
  return { session, api, ApiError };
}

beforeEach(() => {
  store.clear();
  server = { refreshCalls: 0, refreshOk: true, networkDown: false };
  installFetch();
});

describe('api', () => {
  it('gửi kèm Bearer token khi auth: true, và không gửi khi không bật', async () => {
    const { session, api } = await load();
    await session.saveSession({ accessToken: 'abc', refreshToken: 'r1' });
    expect(await api('/x', { auth: true })).toEqual({ auth: 'Bearer abc' });
    expect(await api('/x')).toEqual({ auth: null });
  });

  it('trả undefined với 204', async () => {
    const { api } = await load();
    expect(await api('/nocontent', { method: 'POST' })).toBeUndefined();
  });

  it('gặp 401 thì refresh một lần, lưu refresh token mới và gọi lại thành công', async () => {
    const { session, api } = await load();
    await session.saveSession({ accessToken: 'old', refreshToken: 'r1' });

    expect(await api('/me', { auth: true })).toEqual({ ok: true });
    expect(server.refreshCalls).toBe(1);
    expect(store.get(REFRESH_KEY)).toBe('r2'); // token xoay vòng
  });

  it('nhiều request cùng gặp 401 chỉ refresh MỘT lần (tránh dùng lại token bị thu hồi)', async () => {
    const { session, api } = await load();
    await session.saveSession({ accessToken: 'old', refreshToken: 'r1' });

    const results = await Promise.all([
      api('/me', { auth: true }),
      api('/me', { auth: true }),
      api('/me', { auth: true }),
    ]);
    expect(results).toEqual([{ ok: true }, { ok: true }, { ok: true }]);
    expect(server.refreshCalls).toBe(1);
  });

  it('refresh bị từ chối: xoá phiên, báo hết hạn và ném ApiError 401', async () => {
    const { session, api, ApiError } = await load();
    const expired = vi.fn();
    session.onSessionExpired(expired);
    await session.saveSession({ accessToken: 'old', refreshToken: 'r1' });
    server.refreshOk = false;

    await expect(api('/me', { auth: true })).rejects.toMatchObject({ status: 401 });
    await expect(api('/me', { auth: true })).rejects.toBeInstanceOf(ApiError);
    expect(store.has(REFRESH_KEY)).toBe(false);
    expect(expired).toHaveBeenCalled();
  });

  it('mất mạng khi refresh thì KHÔNG xoá refresh token đã lưu', async () => {
    const { session, api } = await load();
    const expired = vi.fn();
    session.onSessionExpired(expired);
    await session.saveSession({ accessToken: 'old', refreshToken: 'r1' });
    server.networkDown = true;

    await expect(api('/me', { auth: true })).rejects.toMatchObject({ status: 401 });
    expect(store.get(REFRESH_KEY)).toBe('r1');
    expect(expired).not.toHaveBeenCalled();
  });

  it('request không cần auth thì không refresh khi gặp 401', async () => {
    const { session, api } = await load();
    await session.saveSession({ accessToken: 'old', refreshToken: 'r1' });
    await expect(api('/me')).rejects.toMatchObject({ status: 401 });
    expect(server.refreshCalls).toBe(0);
  });

  it('lỗi mạng khi gọi API trả ApiError status 0 với thông báo tiếng Việt', async () => {
    const { api } = await load();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Promise.reject(new TypeError('offline'))),
    );
    await expect(api('/x')).rejects.toMatchObject({
      status: 0,
      message: 'Không kết nối được máy chủ',
    });
  });
});
