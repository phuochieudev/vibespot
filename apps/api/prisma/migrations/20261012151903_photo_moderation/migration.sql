-- CreateEnum
CREATE TYPE "PhotoStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- DropIndex
DROP INDEX "Photo_placeId_idx";

-- AlterTable
ALTER TABLE "Photo" ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedById" UUID,
ADD COLUMN     "status" "PhotoStatus" NOT NULL DEFAULT 'PENDING';

-- Ảnh đã tồn tại trước khi có kiểm duyệt đã hiện công khai: giữ nguyên là đã duyệt.
UPDATE "Photo" SET "status" = 'APPROVED';

-- CreateIndex
CREATE INDEX "Photo_placeId_status_idx" ON "Photo"("placeId", "status");

-- CreateIndex
CREATE INDEX "Photo_status_createdAt_idx" ON "Photo"("status", "createdAt");
