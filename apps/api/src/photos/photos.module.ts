import { Module } from '@nestjs/common';
import { UploadsModule } from '../uploads/uploads.module.js';
import { PhotosController } from './photos.controller.js';
import { PhotosService } from './photos.service.js';

@Module({ imports: [UploadsModule], controllers: [PhotosController], providers: [PhotosService] })
export class PhotosModule {}
