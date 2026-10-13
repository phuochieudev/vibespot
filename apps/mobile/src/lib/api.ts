import { API_URL } from './config';
import { getAccessToken, refreshSession } from './session';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

type Params = Record<string, string | number | undefined>;

interface Options {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  params?: Params;
  body?: unknown;
  /** Gửi kèm access token; nếu gặp 401 thì tự refresh một lần rồi gọi lại. */
  auth?: boolean;
}

function buildUrl(path: string, params?: Params) {
  const query = new URLSearchParams();
  for (const [k, v] of Object.entries(params ?? {})) {
    if (v !== undefined) query.set(k, String(v));
  }
  const qs = query.toString();
  return `${API_URL}${path}${qs ? `?${qs}` : ''}`;
}

function send(path: string, opts: Options, token: string | null) {
  const headers: Record<string, string> = {};
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(buildUrl(path, opts.params), {
    method: opts.method ?? 'GET',
    headers,
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  });
}

async function errorMessage(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { message?: string | string[] };
    if (Array.isArray(body.message)) return body.message.join(', ');
    if (body.message) return body.message;
  } catch {
    // body không phải JSON
  }
  return res.statusText || `HTTP ${res.status}`;
}

export async function api<T>(path: string, opts: Options = {}): Promise<T> {
  const token = opts.auth ? getAccessToken() : null;
  let res: Response;
  try {
    res = await send(path, opts, token);
  } catch {
    throw new ApiError(0, 'Không kết nối được máy chủ');
  }

  if (res.status === 401 && opts.auth) {
    // Nếu request khác đã làm mới token trong lúc ta chờ thì chỉ cần dùng token mới, khỏi refresh nữa.
    const current = getAccessToken();
    const next =
      current && current !== token
        ? current
        : (await refreshSession().catch(() => null))?.accessToken;
    if (next) {
      try {
        res = await send(path, opts, next);
      } catch {
        throw new ApiError(0, 'Không kết nối được máy chủ');
      }
    }
  }

  if (!res.ok) throw new ApiError(res.status, await errorMessage(res));
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
