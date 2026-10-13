import { Module } from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard.js';
import { PlacesModule } from '../places/places.module.js';
import { AdminController } from './admin.controller.js';
import { AdminService } from './admin.service.js';

@Module({
  imports: [PlacesModule],
  controllers: [AdminController],
  providers: [AdminService, AdminGuard],
})
export class AdminModule {}
