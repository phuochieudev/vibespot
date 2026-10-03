import { Body, Controller, HttpCode, Inject, Post } from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import {
  loginSchema,
  refreshSchema,
  registerSchema,
  type LoginInput,
  type RefreshInput,
  type RegisterInput,
} from '@vibespot/shared';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { zodBody } from '../common/swagger.js';
import { AuthService } from './auth.service.js';

// Giới hạn chặt hơn mặc định để chống dò mật khẩu: 10 request / phút / IP.
@Throttle({ default: { limit: 10, ttl: 60_000 } })
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly auth: AuthService) {}

  @Post('register')
  @ApiBody(zodBody(registerSchema))
  register(@Body(new ZodValidationPipe(registerSchema)) body: RegisterInput) {
    return this.auth.register(body);
  }

  @Post('login')
  @HttpCode(200)
  @ApiBody(zodBody(loginSchema))
  login(@Body(new ZodValidationPipe(loginSchema)) body: LoginInput) {
    return this.auth.login(body);
  }

  @Post('refresh')
  @HttpCode(200)
  @ApiBody(zodBody(refreshSchema))
  refresh(@Body(new ZodValidationPipe(refreshSchema)) body: RefreshInput) {
    return this.auth.refresh(body.refreshToken);
  }

  @Post('logout')
  @HttpCode(204)
  @ApiBody(zodBody(refreshSchema))
  async logout(@Body(new ZodValidationPipe(refreshSchema)) body: RefreshInput) {
    await this.auth.logout(body.refreshToken);
  }
}
