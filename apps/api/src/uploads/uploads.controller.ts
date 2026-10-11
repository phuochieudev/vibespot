import { Controller, HttpCode, Inject, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CloudinaryService } from './cloudinary.service.js';

@ApiTags('uploads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('uploads')
export class UploadsController {
  constructor(@Inject(CloudinaryService) private readonly cloudinary: CloudinaryService) {}

  // Cấp chữ ký để app upload thẳng lên Cloudinary. Giới hạn 20 lần/phút/IP.
  @Post('signature')
  @HttpCode(200)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  signature() {
    return this.cloudinary.sign();
  }
}
