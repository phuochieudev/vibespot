import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: {
    // Neon: migrate nên dùng kết nối trực tiếp (DIRECT_URL, không qua pooler) nếu có.
    // Placeholder chỉ để `prisma generate` chạy được khi chưa có .env (vd. CI); migrate vẫn báo lỗi kết nối rõ ràng.
    url:
      process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? 'postgresql://placeholder/placeholder',
  },
});
