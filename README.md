# Vibespot

A mobile app for finding work-friendly cafés in Ho Chi Minh City, with data contributed by the community.

**Demo video:** [Watch the walkthrough](https://youtu.be/8BMYu0Vsfk8) · **API docs:** [vibespot-api.onrender.com/docs](https://vibespot-api.onrender.com/docs) · **Android APK:** [GitHub Releases](https://github.com/phuochieudev/vibespot/releases)

> The API runs on a free tier and sleeps when idle, so the first request after a pause can take up to ~50 seconds.

## Features

- Map of places around you (PostGIS radius search) and a list sorted by distance
- Accent-insensitive Vietnamese search: typing `cong ca phe` finds "Cộng Cà Phê"
- Filters for wifi and air conditioning
- Place details with photos, amenities, ratings and reviews, favorites and directions
- Contribute new places and photos; everything user-submitted is reviewed by an admin before it appears
- Accounts with short-lived JWT access tokens and rotating refresh tokens

The dataset currently covers cafés (1,621 places imported from OpenStreetMap). Parking and EV-charging categories are planned.

## Tech stack

| Layer      | Technology                                                                          |
| ---------- | ----------------------------------------------------------------------------------- |
| Mobile     | Expo (React Native), Expo Router, TanStack Query, Zustand, TypeScript               |
| API        | NestJS, Prisma, PostgreSQL + PostGIS (Neon), Zod schemas shared with the mobile app |
| Storage    | Cloudinary (signed direct uploads)                                                  |
| Tooling    | pnpm + Turborepo monorepo, Vitest (120 automated tests), GitHub Actions CI          |
| Deployment | Docker on Render (API), EAS Build (Android APK)                                     |

```
Mobile app (Expo)  ──HTTPS──▶  NestJS API (Docker, Render)  ──▶  PostgreSQL + PostGIS (Neon)
                                                            └──▶  Cloudinary
```

---

## Tiếng Việt

Tìm quán cà phê làm việc (ổ cắm, wifi tốt) ở TP.HCM, dữ liệu do cộng đồng đóng góp. Hiện có dữ liệu quán cà phê; bãi gửi xe và trạm sạc xe điện nằm trong kế hoạch.

**Stack:** Expo (React Native) · NestJS · PostgreSQL + PostGIS · Prisma · TypeScript monorepo (pnpm + Turborepo)

## Nguồn dữ liệu

Dữ liệu địa điểm ban đầu và ô bản đồ nền lấy từ **OpenStreetMap** (© OpenStreetMap contributors, giấy phép [ODbL](https://www.openstreetmap.org/copyright)), nạp bằng script `pnpm --filter @vibespot/api db:import-osm`. App hiển thị dòng ghi nguồn này ở góc dưới bản đồ.

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
