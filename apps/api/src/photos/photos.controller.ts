import { Body, Controller, Get, Inject, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { createPhotoSchema, type CreatePhotoInput } from '@vibespot/shared';
import { z } from 'zod';
import type { AuthUser } from '../auth/auth.types.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { zodBody } from '../common/swagger.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { PhotosService } from './photos.service.js';

const uuid = new ZodValidationPipe(z.uuid());

@ApiTags('photos')
@Controller('places/:placeId/photos')
export class PhotosController {
  constructor(@Inject(PhotosService) private readonly photos: PhotosService) {}

  @Get()
  list(@Param('placeId', uuid) placeId: string) {
    return this.photos.list(placeId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiBody(zodBody(createPhotoSchema))
  add(
    @Param('placeId', uuid) placeId: string,
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(createPhotoSchema)) body: CreatePhotoInput,
  ) {
    return this.photos.add(placeId, user.id, body);
  }
}
