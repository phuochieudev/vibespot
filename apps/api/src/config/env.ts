import { z } from 'zod';

// Biến tuỳ chọn: chuỗi rỗng (vd. ô để trống trên dashboard) coi như chưa đặt.
const optionalString = z.preprocess(
  (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
  z.string().min(1).optional(),
);

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: optionalString,
  // Cloudinary (upload ảnh). Tuỳ chọn: thiếu thì các endpoint ảnh trả 503.
  CLOUD_NAME: optionalString,
  CLOUD_API_KEY: optionalString,
  CLOUD_API_SECRET: optionalString,
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL_DAYS: z.coerce.number().int().min(1).max(365).default(30),
  CORS_ORIGIN: z.string().default('*'),
  // Số lớp proxy phía trước API (Render, Fly, nginx... = 1). Cần để đọc IP thật khi giới hạn tốc độ.
  TRUST_PROXY: z.coerce.number().int().min(0).max(5).default(0),
});

export type Env = z.infer<typeof envSchema>;

// Dùng làm `validate` của ConfigModule: app không khởi động nếu biến môi trường sai.
export function validateEnv(config: Record<string, unknown>): Env {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    const details = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Invalid environment variables: ${details}`);
  }
  return result.data;
}
