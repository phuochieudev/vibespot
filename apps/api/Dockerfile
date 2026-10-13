# syntax=docker/dockerfile:1
# Build từ thư mục GỐC của monorepo:  docker build -f apps/api/Dockerfile -t vibespot-api .

# ---- os: nền chung cho cả build và runtime ----
FROM node:20-slim AS os
# Prisma cần OpenSSL để nhận đúng hệ điều hành và tải đúng công cụ migration (thiếu thì nó đoán
# "openssl-1.1.x" và tải nhầm bản); ca-certificates để kết nối TLS tới Neon.
RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

FROM os AS base
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
# Kiểm tra ngay lúc build rằng công cụ migration của Prisma đã có đủ và chạy được. Nếu thiếu, build
# thất bại tại đây thay vì để container sập lúc khởi động trên server.
RUN cd /out && node_modules/.bin/prisma --version

# ---- runtime: ảnh nhỏ chỉ có những gì cần để chạy ----
FROM os AS runtime
ENV NODE_ENV=production
WORKDIR /app
# --chown: user "node" sở hữu thư mục, phòng khi Prisma cần ghi file công cụ lúc chạy.
COPY --from=build --chown=node:node /out ./
# Không chạy bằng root.
USER node
EXPOSE 3000
# Áp dụng migration chưa chạy rồi mới khởi động API. Hợp với một bản chạy duy nhất (gói free);
# khi mở rộng nhiều bản nên tách migration thành bước deploy riêng.
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy && node dist/main.js"]
