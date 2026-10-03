import { Body, Controller, Get, Inject, NotFoundException, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { updateProfileSchema, type UpdateProfileInput } from '@vibespot/shared';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthUser } from '../auth/auth.types.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { zodBody } from '../common/swagger.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { toUserDto } from './user.mapper.js';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('me')
export class UsersController {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  @Get()
  async me(@CurrentUser() auth: AuthUser) {
    const user = await this.prisma.user.findUnique({ where: { id: auth.id } });
    if (!user) throw new NotFoundException('User not found');
    return toUserDto(user);
  }

  @Patch()
  @ApiBody(zodBody(updateProfileSchema))
  async update(
    @CurrentUser() auth: AuthUser,
    @Body(new ZodValidationPipe(updateProfileSchema)) body: UpdateProfileInput,
  ) {
    const user = await this.prisma.user.update({ where: { id: auth.id }, data: body });
    return toUserDto(user);
  }
}
