# Vibespot

Tìm quán cà phê làm việc (ổ cắm, wifi tốt), bãi gửi xe và trạm sạc xe điện ở TP.HCM, dữ liệu do cộng đồng đóng góp.

**Stack:** Expo (React Native) · NestJS · PostgreSQL + PostGIS · Prisma · TypeScript monorepo (pnpm + Turborepo)

Xem kế hoạch chi tiết tại [docs/PLAN.md](docs/PLAN.md).

## Nguồn dữ liệu

Dữ liệu địa điểm ban đầu lấy từ **OpenStreetMap** (© OpenStreetMap contributors, giấy phép [ODbL](https://www.openstreetmap.org/copyright)), nạp bằng script `pnpm --filter @vibespot/api db:import-osm`. App hiển thị dòng ghi nguồn này ở màn hình thông tin.
