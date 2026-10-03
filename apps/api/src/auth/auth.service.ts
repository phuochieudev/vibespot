import { ConflictException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { hash, verify } from '@node-rs/argon2';
import type { AuthResponse, LoginInput, RegisterInput } from '@vibespot/shared';
import { createHash, randomBytes } from 'node:crypto';
import type { Env } from '../config/env.js';
import type { User } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { toUserDto } from '../users/user.mapper.js';
import type { JwtPayload } from './auth.types.js';

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');
const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(JwtService) private readonly jwt: JwtService,
    @Inject(ConfigService) private readonly config: ConfigService<Env, true>,
  ) {}

  async register(input: RegisterInput): Promise<AuthResponse> {
    const exists = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (exists) throw new ConflictException('Email đã được sử dụng');

    try {
      const user = await this.prisma.user.create({
        data: {
          email: input.email,
          displayName: input.displayName,
          passwordHash: await hash(input.password),
        },
      });
      return this.issueTokens(user);
    } catch (e) {
      // Hai request đăng ký cùng email chạy song song: ràng buộc unique chặn request thứ hai.
      if ((e as { code?: string }).code === 'P2002') {
        throw new ConflictException('Email đã được sử dụng');
      }
      throw e;
    }
  }

  async login(input: LoginInput): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({ where: { email: input.email } });
    // Cùng một thông báo cho "sai email" và "sai mật khẩu" để không lộ email nào đã đăng ký.
    if (!user || !(await verify(user.passwordHash, input.password))) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }
    return this.issueTokens(user);
  }

  // Xoay vòng refresh token: mỗi token chỉ dùng được một lần.
  async refresh(refreshToken: string): Promise<AuthResponse> {
    const record = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: sha256(refreshToken) },
      include: { user: true },
    });
    if (!record || record.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token không hợp lệ');
    }

    if (record.revokedAt) {
      // Token đã dùng rồi mà vẫn bị gửi lại => nhiều khả năng bị đánh cắp: thu hồi mọi phiên của user.
      await this.revokeAll(record.userId);
      throw new UnauthorizedException('Refresh token không hợp lệ');
    }

    // updateMany có điều kiện revokedAt = null để hai request song song không cùng dùng một token.
    const { count } = await this.prisma.refreshToken.updateMany({
      where: { id: record.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    if (count !== 1) throw new UnauthorizedException('Refresh token không hợp lệ');

    return this.issueTokens(record.user);
  }

  async logout(refreshToken: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: sha256(refreshToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private revokeAll(userId: string) {
    return this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async issueTokens(user: User): Promise<AuthResponse> {
    const payload: JwtPayload = { sub: user.id, role: user.role };
    const accessToken = await this.jwt.signAsync(payload);

    const refreshToken = randomBytes(48).toString('base64url');
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: sha256(refreshToken),
        expiresAt: new Date(Date.now() + this.config.get('JWT_REFRESH_TTL_DAYS') * DAY_MS),
      },
    });

    return { user: toUserDto(user), accessToken, refreshToken };
  }
}
