# Kế hoạch dự án Vibespot

App tìm địa điểm theo nhu cầu ở TP.HCM: quán cà phê làm việc, bãi gửi xe, trạm sạc xe điện. Dữ liệu do cộng đồng đóng góp.

**Chiến lược:** làm sâu một loại địa điểm (quán cà phê làm việc) trước. Kiến trúc thiết kế sẵn để thêm bãi xe và trạm sạc mà không phải viết lại.

## Tiến độ

- [x] Bước 1: Khởi tạo monorepo, lưu kế hoạch
- [x] Bước 2: Package `shared` (Zod schemas)
- [x] Bước 3: Khung NestJS API
- [ ] Bước 4: Database (Neon + PostGIS + Prisma)
- [ ] Bước 5: Auth
- [ ] Bước 6: Places API (`nearby`, `search`, tạo mới)
- [ ] Bước 7: Import dữ liệu OSM
- [ ] Bước 8: Khung Expo app + bản đồ
- [ ] Bước 9: Lọc, chi tiết, đánh giá, ảnh
- [ ] Bước 10: CI, Dockerfile, deploy

## Kiến trúc

```
Mobile (Expo / RN)  ──HTTPS/REST + JWT──▶  NestJS API  ──▶  PostgreSQL + PostGIS (Neon)
                                                      └──▶  Cloudinary (ảnh)
Dữ liệu ban đầu: script import từ OpenStreetMap (Overpass API)
```

Nguyên tắc để dễ deploy: backend stateless, cấu hình qua biến môi trường, có Dockerfile, dùng Postgres chuẩn (đổi host chỉ cần đổi `DATABASE_URL`).

## Tech stack

**Mobile (`apps/mobile`):** Expo + React Native + TypeScript, Expo Router, TanStack Query, Zustand, React Hook Form + Zod, NativeWind, react-native-maps, expo-location, expo-image-picker, expo-secure-store.

**Backend (`apps/api`):** NestJS, Prisma, nestjs-zod, JWT access + refresh (argon2), Swagger, @nestjs/throttler, helmet, nestjs-pino, Cloudinary signed upload.

**Database:** PostgreSQL + PostGIS (index GiST), `unaccent` + `pg_trgm` cho tìm kiếm tiếng Việt không dấu, JSONB cho thuộc tính riêng từng loại địa điểm. Host trên Neon.

**Công cụ:** pnpm workspaces, Turborepo, ESLint, Prettier, Husky + lint-staged, Jest + Supertest, GitHub Actions.

## Mô hình dữ liệu

```
User          id, email, passwordHash, displayName, avatarUrl, role(USER|ADMIN), reputation
Place         id, name, category(CAFE|PARKING|EV_CHARGING), address, district,
              location geography(Point,4326), attributes JSONB, openingHours JSONB,
              status(PENDING|APPROVED|REJECTED), source(USER|OSM), osmId?, createdById,
              avgRating, reviewCount
Review        id, placeId, userId, rating, comment, attributes JSONB
Photo         id, placeId, userId, url, publicId
WifiTest      id, placeId, userId, downloadMbps, uploadMbps, pingMs
Favorite      userId, placeId
Report        id, placeId, userId, reason, status
EditProposal  id, placeId, userId, changes JSONB, status
```

Thuộc tính trong `attributes` được kiểm tra bằng Zod ở `packages/shared`:

| Loại | Thuộc tính |
|---|---|
| CAFE | số ổ cắm, wifi Mbps, độ ồn, máy lạnh, mở khuya, giữ xe miễn phí, giá trung bình |
| PARKING | giá, loại xe, có mái che, giờ mở cửa, sức chứa |
| EV_CHARGING | loại cổng, công suất kW, giá/kWh, hãng, số trụ |

## Chức năng theo giai đoạn

**Giai đoạn 0 (tuần 1):** monorepo, CI cơ bản, Neon + PostGIS, migration đầu tiên, script import quán cà phê TP.HCM từ OSM (ghi nguồn theo giấy phép ODbL).

**Giai đoạn 1, MVP (tuần 2–4):** đăng ký/đăng nhập; bản đồ quanh vị trí, gom cụm marker; lọc ổ cắm/wifi/yên tĩnh/đang mở; danh sách theo khoảng cách; trang chi tiết có chỉ đường; tìm kiếm không dấu; thêm địa điểm (chờ duyệt), đánh giá, upload ảnh; yêu thích.

**Giai đoạn 2 (tuần 5–6):** đo wifi trong app; đề xuất sửa, báo sai; điểm uy tín và huy hiệu; duyệt nội dung cho admin qua API.

**Giai đoạn 3 (tuần 7):** thêm bãi gửi xe và trạm sạc xe điện.

**Giai đoạn 4 (tuần 8+, tùy chọn):** dark mode, i18n vi/en, cache offline, push notification, đăng nhập Google, tìm kiếm ngôn ngữ tự nhiên bằng AI.

## API chính

```
POST   /auth/register | /auth/login | /auth/refresh | /auth/logout
GET    /me                         PATCH /me
GET    /places/nearby?lat&lng&radius&category&filters
GET    /places/search?q&lat&lng
GET    /places/:id
POST   /places                     POST /places/:id/edits     POST /places/:id/reports
GET    /places/:id/reviews         POST /places/:id/reviews
POST   /places/:id/wifi-tests
POST   /uploads/signature          POST /places/:id/photos
GET    /me/favorites               PUT/DELETE /places/:id/favorite
GET    /admin/moderation           PATCH /admin/places/:id/status
```

## Cấu trúc thư mục

```
vibespot/
├── apps/
│   ├── mobile/    # Expo Router: app/(tabs), place/[id], add-place, (auth); src/{components,features,api,stores,lib}
│   └── api/       # NestJS: src/modules/{auth,users,places,reviews,photos,wifi-tests,moderation,uploads}, prisma/
├── packages/shared/   # Zod schemas, types, constants
├── docs/PLAN.md
├── .github/workflows/ci.yml
├── turbo.json
└── pnpm-workspace.yaml
```

## Deploy

| Thành phần | Nơi deploy | Ghi chú |
|---|---|---|
| Database | Neon (free) | Có PostGIS |
| API | Render (Dockerfile) | Gói free bị ngủ khi không có truy cập; Railway ~$5/tháng nếu cần mượt |
| Ảnh | Cloudinary (free) | |
| Android | EAS Build → APK | Google Play internal testing là điểm cộng ($25 một lần) |
| iOS | TestFlight (tùy chọn, $99/năm) | Có thể thay bằng video demo |

CI mỗi PR: lint, typecheck, test. Merge vào `main`: Render tự deploy rồi chạy `prisma migrate deploy`. Tag `v*`: EAS build APK.

Lưu ý: APK riêng trên Android cần Google Maps API key (cần tài khoản đã gắn thẻ thanh toán, SDK mobile miễn phí). Phương án thay thế: MapLibre + OpenStreetMap (cần dev build). Quyết định ở tuần 7–8.

## Mô tả trên CV

> **Vibespot**: App tìm quán cà phê làm việc, bãi xe và trạm sạc ở TP.HCM với dữ liệu cộng đồng đóng góp
> - React Native (Expo) + NestJS + PostgreSQL/PostGIS, monorepo TypeScript dùng chung schema Zod
> - Truy vấn không gian bằng PostGIS (index GiST), tìm kiếm tiếng Việt không dấu bằng `unaccent` + `pg_trgm`
> - Đo tốc độ wifi trong app, hệ thống điểm uy tín để duyệt dữ liệu người dùng đóng góp
> - CI/CD với GitHub Actions, deploy Docker lên Render, build APK bằng EAS
> - Dữ liệu ban đầu: hơn 500 địa điểm import từ OpenStreetMap
