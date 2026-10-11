import { Controller, Get, Inject, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { AuthUser } from '../auth/auth.types.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { PlacesService } from './places.service.js';

@ApiTags('places')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('me/places')
export class MyPlacesController {
  constructor(@Inject(PlacesService) private readonly places: PlacesService) {}

  @Get()
  mine(@CurrentUser() user: AuthUser) {
    return this.places.findMine(user.id);
  }
}
