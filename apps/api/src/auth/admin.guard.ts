import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { AuthedRequest } from './auth.types.js';

// Dùng sau JwtAuthGuard: @UseGuards(JwtAuthGuard, AdminGuard).
// Kiểm tra role trong DATABASE chứ không tin role trong token, vì token sống 15 phút:
// admin bị hạ quyền thì mất quyền ngay, không phải chờ token hết hạn.
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const userId = context.switchToHttp().getRequest<AuthedRequest>().user?.id;
    if (!userId) throw new UnauthorizedException();
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (user?.role !== 'ADMIN') throw new ForbiddenException('Cần quyền quản trị');
    return true;
  }
}
