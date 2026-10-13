# syntax=docker/dockerfile:1
# Build từ thư mục GỐC của monorepo:  docker build -f apps/api/Dockerfile -t vibespot-api .

FROM node:20-slim AS base
ENV CI=true
RUN corepack enable && corepack prepare pnpm@10.15.0 --activate
WORKDIR /app

# ---- build: cài thư viện, biên dịch, rồi gói riêng phần API ----
FROM base AS build
# Chép các file khai báo thư viện trước: thư viện không đổi thì Docker dùng lại lớp cache này.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY apps/mobile/package.json apps/mobile/
# --ignore-scripts: chưa có mã nguồn nên chưa chạy được `prisma generate` (postinstall).
RUN pnpm install --frozen-lockfile --ignore-scripts --filter @vibespot/api...

COPY packages/shared packages/shared
COPY apps/api apps/api
# Build `shared` trước vì API import từ đó; build API = `prisma generate && nest build`.
RUN pnpm --filter @vibespot/shared build && pnpm --filter @vibespot/api build
# Gói API cùng thư viện production và `shared` vào /out (không kèm mobile, devDependencies).
RUN pnpm --filter @vibespot/api deploy --legacy --prod /out

# ---- runtime: ảnh nhỏ chỉ có những gì cần để chạy ----
FROM node:20-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /out ./
# Không chạy bằng root.
USER node
EXPOSE 3000
# Áp dụng migration chưa chạy rồi mới khởi động API. Hợp với một bản chạy duy nhất (gói free);
# khi mở rộng nhiều bản nên tách migration thành bước deploy riêng.
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy && node dist/main.js"]
