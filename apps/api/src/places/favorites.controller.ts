import { Controller, Delete, Get, HttpCode, Inject, NotFoundException, Param, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import type { AuthUser } from '../auth/auth.types.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { PlacesService } from './places.service.js';

const uuid = new ZodValidationPipe(z.uuid());

@ApiTags('favorites')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class FavoritesController {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(PlacesService) private readonly places: PlacesService,
  ) {}

  @Get('me/favorites')
  list(@CurrentUser() user: AuthUser) {
    return this.places.findFavorites(user.id);
  }

  // Idempotent: lưu một quán đã lưu rồi thì vẫn thành công.
  @Put('places/:placeId/favorite')
  @HttpCode(204)
  async add(@Param('placeId', uuid) placeId: string, @CurrentUser() user: AuthUser) {
    const place = await this.prisma.place.findFirst({
      where: { id: placeId, status: 'APPROVED' },
      select: { id: true },
    });
    if (!place) throw new NotFoundException('Không tìm thấy địa điểm');
    await this.prisma.favorite.upsert({
      where: { userId_placeId: { userId: user.id, placeId } },
      create: { userId: user.id, placeId },
      update: {},
    });
  }

  @Delete('places/:placeId/favorite')
  @HttpCode(204)
  async remove(@Param('placeId', uuid) placeId: string, @CurrentUser() user: AuthUser) {
    await this.prisma.favorite.deleteMany({ where: { userId: user.id, placeId } });
  }
}
