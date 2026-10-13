# Vibespot

Tìm quán cà phê làm việc (ổ cắm, wifi tốt), bãi gửi xe và trạm sạc xe điện ở TP.HCM, dữ liệu do cộng đồng đóng góp.

**Stack:** Expo (React Native) · NestJS · PostgreSQL + PostGIS · Prisma · TypeScript monorepo (pnpm + Turborepo)

Xem kế hoạch chi tiết tại [docs/PLAN.md](docs/PLAN.md).

## Nguồn dữ liệu

Dữ liệu địa điểm ban đầu lấy từ **OpenStreetMap** (© OpenStreetMap contributors, giấy phép [ODbL](https://www.openstreetmap.org/copyright)), nạp bằng script `pnpm --filter @vibespot/api db:import-osm`. App hiển thị dòng ghi nguồn này ở màn hình thông tin.

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

## Kiểm duyệt nội dung

Quán và ảnh do người dùng đóng góp **luôn chờ admin duyệt** trước khi hiện công khai (nội dung của chính admin thì tự duyệt).

```bash
# Cấp quyền admin cho một tài khoản đã đăng ký (chỉ làm được bằng dòng lệnh, không có API tự nâng quyền)
pnpm --filter @vibespot/api db:make-admin email@example.com
```

Admin duyệt qua Swagger (`/docs`, bấm Authorize và dán access token của tài khoản admin):

| Endpoint | Chức năng |
|---|---|
| `GET /api/admin/photos?status=PENDING` | Ảnh đang chờ (cũ nhất trước) |
| `PATCH /api/admin/photos/:id` | `{ "status": "APPROVED" \| "REJECTED" }` |
| `GET /api/admin/places?status=PENDING` | Quán đang chờ |
| `PATCH /api/admin/places/:id` | `{ "status": "APPROVED" \| "REJECTED" }` |

Quyền admin được kiểm tra trong database ở mỗi request nên gỡ quyền có hiệu lực ngay, không phải chờ access token hết hạn.
