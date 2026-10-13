import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { AdminListQuery, AdminPhoto, ModerateInput, Place } from '@vibespot/shared';
import { PlacesService } from '../places/places.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

const PHOTO_INCLUDE = {
  place: { select: { id: true, name: true } },
  user: { select: { id: true, displayName: true } },
} as const;

interface PhotoRow {
  id: string;
  url: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: Date;
  place: { id: string; name: string };
  user: { id: string; displayName: string };
}

const toPhotoDto = (r: PhotoRow): AdminPhoto => ({
  id: r.id,
  url: r.url,
  status: r.status,
  createdAt: r.createdAt.toISOString(),
  place: r.place,
  user: r.user,
});

@Injectable()
export class AdminService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(PlacesService) private readonly places: PlacesService,
  ) {}

  async listPhotos(q: AdminListQuery): Promise<AdminPhoto[]> {
    const rows = await this.prisma.photo.findMany({
      where: { status: q.status },
      orderBy: { createdAt: 'asc' }, // cũ nhất trước: duyệt theo thứ tự gửi
      take: q.limit,
      include: PHOTO_INCLUDE,
    });
    return rows.map(toPhotoDto);
  }

  async moderatePhoto(id: string, adminId: string, input: ModerateInput): Promise<AdminPhoto> {
    // updateMany + đếm để trả 404 gọn khi id không tồn tại, thay vì bắt lỗi của Prisma.
    const { count } = await this.prisma.photo.updateMany({
      where: { id },
      data: { status: input.status, reviewedAt: new Date(), reviewedById: adminId },
    });
    if (count === 0) throw new NotFoundException('Không tìm thấy ảnh');
    const row = await this.prisma.photo.findUniqueOrThrow({ where: { id }, include: PHOTO_INCLUDE });
    return toPhotoDto(row);
  }

  listPlaces(q: AdminListQuery): Promise<Place[]> {
    return this.places.findByStatus(q.status, q.limit);
  }

  async moderatePlace(id: string, input: ModerateInput): Promise<{ id: string; status: string }> {
    const { count } = await this.prisma.place.updateMany({ where: { id }, data: { status: input.status } });
    if (count === 0) throw new NotFoundException('Không tìm thấy địa điểm');
    return { id, status: input.status };
  }
}
