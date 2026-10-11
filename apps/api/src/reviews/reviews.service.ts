import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { CreateReviewInput, Review } from '@vibespot/shared';
import { PrismaService } from '../prisma/prisma.service.js';

const WITH_USER = { user: { select: { id: true, displayName: true, avatarUrl: true } } } as const;

interface ReviewRow {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  user: { id: string; displayName: string; avatarUrl: string | null };
}

// Không trả email của người đánh giá, chỉ tên hiển thị.
const toDto = (r: ReviewRow): Review => ({
  id: r.id,
  rating: r.rating,
  comment: r.comment,
  createdAt: r.createdAt.toISOString(),
  user: r.user,
});

@Injectable()
export class ReviewsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  private async assertPlace(placeId: string) {
    const place = await this.prisma.place.findFirst({
      where: { id: placeId, status: 'APPROVED' },
      select: { id: true },
    });
    if (!place) throw new NotFoundException('Không tìm thấy địa điểm');
  }

  async list(placeId: string, limit = 50): Promise<Review[]> {
    await this.assertPlace(placeId);
    const rows = await this.prisma.review.findMany({
      where: { placeId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: WITH_USER,
    });
    return rows.map(toDto);
  }

  // Mỗi người một đánh giá cho mỗi quán: gửi lại thì cập nhật đánh giá cũ.
  async upsert(placeId: string, userId: string, input: CreateReviewInput): Promise<Review> {
    await this.assertPlace(placeId);
    const comment = input.comment?.trim() || null;

    // Ghi đánh giá và tính lại điểm trung bình trong cùng một transaction,
    // để avgRating/reviewCount của quán không bao giờ lệch so với bảng Review.
    const [review] = await this.prisma.$transaction([
      this.prisma.review.upsert({
        where: { placeId_userId: { placeId, userId } },
        create: { placeId, userId, rating: input.rating, comment },
        update: { rating: input.rating, comment },
        include: WITH_USER,
      }),
      this.prisma.$executeRaw`
        UPDATE "Place" SET
          "avgRating" = COALESCE((SELECT AVG(rating)::float8 FROM "Review" WHERE "placeId" = ${placeId}::uuid), 0),
          "reviewCount" = (SELECT COUNT(*)::int FROM "Review" WHERE "placeId" = ${placeId}::uuid),
          "updatedAt" = now()
        WHERE id = ${placeId}::uuid`,
    ]);
    return toDto(review);
  }
}
