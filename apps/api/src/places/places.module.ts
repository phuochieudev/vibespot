import { Module } from '@nestjs/common';
import { FavoritesController } from './favorites.controller.js';
import { MyPlacesController } from './my-places.controller.js';
import { PlacesController } from './places.controller.js';
import { PlacesService } from './places.service.js';

@Module({ controllers: [PlacesController, MyPlacesController, FavoritesController], providers: [PlacesService], exports: [PlacesService] })
export class PlacesModule {}
