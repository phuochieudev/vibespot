import { Controller, Get, Inject } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service.js';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  @Get()
  @ApiOkResponse({ description: 'Service is up' })
  check() {
    return { status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() };
  }

  @Get('db')
  @ApiOkResponse({ description: 'Database reachable, PostGIS enabled' })
  async checkDb() {
    const rows = await this.prisma.$queryRaw<{ postgis: string }[]>`SELECT postgis_version() AS postgis`;
    return { status: 'ok', postgis: rows[0]?.postgis };
  }
}
