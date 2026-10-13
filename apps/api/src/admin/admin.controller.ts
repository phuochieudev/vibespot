import { Body, Controller, Get, Inject, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import {
  adminListQuerySchema,
  moderateSchema,
  type AdminListQuery,
  type ModerateInput,
} from '@vibespot/shared';
import { z } from 'zod';
import { AdminGuard } from '../auth/admin.guard.js';
import type { AuthUser } from '../auth/auth.types.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { ApiZodQuery, zodBody } from '../common/swagger.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { AdminService } from './admin.service.js';

const uuid = new ZodValidationPipe(z.uuid());
const listQuery = new ZodValidationPipe(adminListQuerySchema);
const moderateBody = new ZodValidationPipe(moderateSchema);

// Toàn bộ /admin/* chỉ dành cho tài khoản có role ADMIN.
@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(@Inject(AdminService) private readonly admin: AdminService) {}

  @Get('photos')
  @ApiZodQuery(adminListQuerySchema)
  photos(@Query(listQuery) query: AdminListQuery) {
    return this.admin.listPhotos(query);
  }

  @Patch('photos/:id')
  @ApiBody(zodBody(moderateSchema))
  moderatePhoto(
    @Param('id', uuid) id: string,
    @CurrentUser() admin: AuthUser,
    @Body(moderateBody) body: ModerateInput,
  ) {
    return this.admin.moderatePhoto(id, admin.id, body);
  }

  @Get('places')
  @ApiZodQuery(adminListQuerySchema)
  places(@Query(listQuery) query: AdminListQuery) {
    return this.admin.listPlaces(query);
  }

  @Patch('places/:id')
  @ApiBody(zodBody(moderateSchema))
  moderatePlace(@Param('id', uuid) id: string, @Body(moderateBody) body: ModerateInput) {
    return this.admin.moderatePlace(id, body);
  }
}
