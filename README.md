# Vibespot

Tìm quán cà phê làm việc (ổ cắm, wifi tốt), bãi gửi xe và trạm sạc xe điện ở TP.HCM, dữ liệu do cộng đồng đóng góp.

**Stack:** Expo (React Native) · NestJS · PostgreSQL + PostGIS · Prisma · TypeScript monorepo (pnpm + Turborepo)

## Nguồn dữ liệu

Dữ liệu địa điểm ban đầu và ô bản đồ nền lấy từ **OpenStreetMap** (© OpenStreetMap contributors, giấy phép [ODbL](https://www.openstreetmap.org/copyright)), nạp bằng script `pnpm --filter @vibespot/api db:import-osm`. App hiển thị dòng ghi nguồn này ở màn hình thông tin.

## Chạy thử trên máy

Cần Node 20+, pnpm 10 (`corepack enable`), và app **Expo Go** trên điện thoại (cùng Wi-Fi với máy tính).

```bash
pnpm install
cp apps/api/.env.example apps/api/.env   # điền DATABASE_URL (Neon) và JWT_ACCESS_SECRET
pnpm --filter @vibespot/api db:deploy     # tạo bảng
pnpm --filter @vibespot/api db:import-osm # nạp quán cà phê từ OpenStreetMap

pnpm dev:api      # terminal 1: API tại http://localhost:3000 (Swagger: /docs)
pnpm dev:mobile   # terminal 2: quét mã QR bằng Expo Go
```
