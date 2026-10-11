import { Module } from '@nestjs/common';
import { MyPlacesController } from './my-places.controller.js';
import { PlacesController } from './places.controller.js';
import { PlacesService } from './places.service.js';

@Module({ controllers: [PlacesController, MyPlacesController], providers: [PlacesService] })
export class PlacesModule {}
