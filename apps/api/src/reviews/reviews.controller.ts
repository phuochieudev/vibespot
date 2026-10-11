import { Body, Controller, Get, HttpCode, Inject, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { createReviewSchema, type CreateReviewInput } from '@vibespot/shared';
import { z } from 'zod';
import type { AuthUser } from '../auth/auth.types.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { zodBody } from '../common/swagger.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { ReviewsService } from './reviews.service.js';

const uuid = new ZodValidationPipe(z.uuid());

@ApiTags('reviews')
@Controller('places/:placeId/reviews')
export class ReviewsController {
  constructor(@Inject(ReviewsService) private readonly reviews: ReviewsService) {}

  @Get()
  list(@Param('placeId', uuid) placeId: string) {
    return this.reviews.list(placeId);
  }

  // Tạo đánh giá, hoặc cập nhật đánh giá của chính người dùng nếu đã có.
  @Post()
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiBody(zodBody(createReviewSchema))
  upsert(
    @Param('placeId', uuid) placeId: string,
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(createReviewSchema)) body: CreateReviewInput,
  ) {
    return this.reviews.upsert(placeId, user.id, body);
  }
}
