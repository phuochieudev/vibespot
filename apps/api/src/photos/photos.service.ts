import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { MAX_PHOTOS_PER_USER_PER_PLACE, type CreatePhotoInput, type Photo } from '@vibespot/shared';
import { PrismaService } from '../prisma/prisma.service.js';
import { CloudinaryService } from '../uploads/cloudinary.service.js';

@Injectable()
export class PhotosService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(CloudinaryService) private readonly cloudinary: CloudinaryService,
  ) {}

  private async assertPlace(placeId: string) {
    const place = await this.prisma.place.findFirst({
      where: { id: placeId, status: 'APPROVED' },
      select: { id: true },
    });
    if (!place) throw new NotFoundException('Không tìm thấy địa điểm');
  }

  async list(placeId: string): Promise<Photo[]> {
    await this.assertPlace(placeId);
    const rows = await this.prisma.photo.findMany({
      where: { placeId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { user: { select: { id: true, displayName: true } } },
    });
    return rows.map((r) => ({
      id: r.id,
      url: r.url,
      createdAt: r.createdAt.toISOString(),
      user: r.user,
    }));
  }

  async add(placeId: string, userId: string, input: CreatePhotoInput): Promise<Photo> {
    await this.assertPlace(placeId);
    if (!this.cloudinary.owns(input.url, input.publicId)) {
      throw new BadRequestException('Ảnh không hợp lệ');
    }
    const count = await this.prisma.photo.count({ where: { placeId, userId } });
    if (count >= MAX_PHOTOS_PER_USER_PER_PLACE) {
      throw new ConflictException(`Mỗi người tối đa ${MAX_PHOTOS_PER_USER_PER_PLACE} ảnh cho một quán`);
    }
    const row = await this.prisma.photo.create({
      data: { placeId, userId, url: input.url, publicId: input.publicId },
      include: { user: { select: { id: true, displayName: true } } },
    });
    return { id: row.id, url: row.url, createdAt: row.createdAt.toISOString(), user: row.user };
  }
}
