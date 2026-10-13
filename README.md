# Vibespot

Tìm quán cà phê làm việc (ổ cắm, wifi tốt), bãi gửi xe và trạm sạc xe điện ở TP.HCM, dữ liệu do cộng đồng đóng góp.

**Stack:** Expo (React Native) · NestJS · PostgreSQL + PostGIS · Prisma · TypeScript monorepo (pnpm + Turborepo)

Xem kế hoạch chi tiết tại [docs/PLAN.md](docs/PLAN.md).

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

## Kiểm duyệt nội dung

Quán và ảnh do người dùng đóng góp **luôn chờ admin duyệt** trước khi hiện công khai (nội dung của chính admin thì tự duyệt).

```bash
# Cấp quyền admin cho một tài khoản đã đăng ký (chỉ làm được bằng dòng lệnh, không có API tự nâng quyền)
pnpm --filter @vibespot/api db:make-admin email@example.com
```

Admin duyệt qua Swagger (`/docs`, bấm Authorize và dán access token của tài khoản admin):

| Endpoint                               | Chức năng                                |
| -------------------------------------- | ---------------------------------------- |
| `GET /api/admin/photos?status=PENDING` | Ảnh đang chờ (cũ nhất trước)             |
| `PATCH /api/admin/photos/:id`          | `{ "status": "APPROVED" \| "REJECTED" }` |
| `GET /api/admin/places?status=PENDING` | Quán đang chờ                            |
| `PATCH /api/admin/places/:id`          | `{ "status": "APPROVED" \| "REJECTED" }` |

Quyền admin được kiểm tra trong database ở mỗi request nên gỡ quyền có hiệu lực ngay, không phải chờ access token hết hạn.

## Deploy

```
App (APK)  ──HTTPS──▶  API trên Render (Docker)  ──▶  Neon (Postgres + PostGIS)
                                                 └──▶  Cloudinary (ảnh)
```

### 1. API lên Render

1. Đẩy repo lên GitHub, vào [Render](https://render.com) → **New → Blueprint** → chọn repo. Render đọc [render.yaml](render.yaml) và tạo dịch vụ `vibespot-api` (build bằng [Dockerfile](apps/api/Dockerfile)).
2. Trong Dashboard của dịch vụ, điền các biến bí mật (không nằm trong repo): `DATABASE_URL`, `DIRECT_URL`, `CLOUD_NAME`, `CLOUD_API_KEY`, `CLOUD_API_SECRET`. `JWT_ACCESS_SECRET` Render tự sinh.
3. Mỗi lần khởi động, container chạy `prisma migrate deploy` rồi mới bật API, nên bảng luôn khớp với code.
4. Kiểm tra: mở `https://<tên-dịch-vụ>.onrender.com/api/health`. Tài liệu API ở `/docs`.

Lưu ý gói miễn phí: dịch vụ **tự ngủ** khi 15 phút không có truy cập, lần gọi đầu sau đó chậm khoảng 30–50 giây (app sẽ báo "Không kết nối được máy chủ" nếu quá lâu, thử lại là được).

### 2. Build APK để cài lên điện thoại

Cần tài khoản [Expo](https://expo.dev) (miễn phí). Bản đồ dùng Leaflet trong WebView nên **không cần khoá Google Maps**.

```bash
cd apps/mobile
pnpm dlx eas-cli login
pnpm dlx eas-cli init                      # gắn dự án với tài khoản Expo
# Sửa EXPO_PUBLIC_API_URL trong eas.json thành địa chỉ API thật trên Render
pnpm dlx eas-cli build --platform android --profile preview
```

Build xong, EAS đưa link tải file `.apk`: mở link đó trên điện thoại Android để cài.

### 3. CI (GitHub Actions)

[ci.yml](.github/workflows/ci.yml) chạy mỗi lần push và pull request: kiểm tra định dạng (Prettier), lint, typecheck, test, và build thử Docker image.

Test e2e của API cần một database thật nên chỉ chạy khi có secret `E2E_DATABASE_URL` (Settings → Secrets → Actions). Hãy trỏ nó tới **một database riêng cho test** (ví dụ một branch Neon), không dùng database thật vì test sẽ ghi/xoá dữ liệu.

### Biến môi trường của API

| Biến                                                            | Bắt buộc | Ghi chú                                     |
| --------------------------------------------------------------- | -------- | ------------------------------------------- |
| `DATABASE_URL`                                                  | Có       | Chuỗi kết nối Postgres (Neon: chuỗi pooled) |
| `JWT_ACCESS_SECRET`                                             | Có       | Tối thiểu 32 ký tự                          |
| `DIRECT_URL`                                                    | Không    | Chuỗi kết nối trực tiếp, dùng cho migration |
| `CLOUD_NAME`, `CLOUD_API_KEY`, `CLOUD_API_SECRET`               | Không    | Thiếu thì chức năng ảnh trả 503             |
| `TRUST_PROXY`                                                   | Không    | `1` khi API đứng sau proxy (Render)         |
| `PORT`, `CORS_ORIGIN`, `JWT_ACCESS_TTL`, `JWT_REFRESH_TTL_DAYS` | Không    | Có giá trị mặc định                         |
