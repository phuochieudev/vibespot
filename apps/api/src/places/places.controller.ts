import { Body, Controller, Get, Inject, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import {
  createPlaceSchema,
  nearbyQuerySchema,
  searchQuerySchema,
  type CreatePlaceInput,
  type NearbyQuery,
  type SearchQuery,
} from '@vibespot/shared';
import { z } from 'zod';
import type { AuthUser } from '../auth/auth.types.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { ApiZodQuery, zodBody } from '../common/swagger.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { PlacesService } from './places.service.js';

@ApiTags('places')
@Controller('places')
export class PlacesController {
  constructor(@Inject(PlacesService) private readonly places: PlacesService) {}

  // Các route cố định (nearby, search) phải khai báo trước `:id`, nếu không ":id" sẽ nuốt mất.
  @Get('nearby')
  @ApiZodQuery(nearbyQuerySchema)
  nearby(@Query(new ZodValidationPipe(nearbyQuerySchema)) query: NearbyQuery) {
    return this.places.nearby(query);
  }

  @Get('search')
  @ApiZodQuery(searchQuerySchema)
  search(@Query(new ZodValidationPipe(searchQuerySchema)) query: SearchQuery) {
    return this.places.search(query);
  }

  @Get(':id')
  findOne(@Param('id', new ZodValidationPipe(z.uuid())) id: string) {
    return this.places.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiBody(zodBody(createPlaceSchema))
  create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(createPlaceSchema)) body: CreatePlaceInput,
  ) {
    return this.places.create(body, user);
  }
}
