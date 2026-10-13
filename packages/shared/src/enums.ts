import { z } from 'zod';

export const PlaceCategory = z.enum(['CAFE', 'PARKING', 'EV_CHARGING']);
export type PlaceCategory = z.infer<typeof PlaceCategory>;

// Trạng thái kiểm duyệt dùng chung cho quán và ảnh do người dùng đóng góp.
export const ModerationStatus = z.enum(['PENDING', 'APPROVED', 'REJECTED']);
export type ModerationStatus = z.infer<typeof ModerationStatus>;

export const PlaceStatus = ModerationStatus;
export type PlaceStatus = ModerationStatus;

export const PlaceSource = z.enum(['USER', 'OSM']);
export type PlaceSource = z.infer<typeof PlaceSource>;

export const UserRole = z.enum(['USER', 'ADMIN']);
export type UserRole = z.infer<typeof UserRole>;

export const OutletLevel = z.enum(['NONE', 'FEW', 'SOME', 'MANY']);
export type OutletLevel = z.infer<typeof OutletLevel>;

export const NoiseLevel = z.enum(['QUIET', 'MODERATE', 'LOUD']);
export type NoiseLevel = z.infer<typeof NoiseLevel>;

export const VehicleType = z.enum(['MOTORBIKE', 'CAR']);
export type VehicleType = z.infer<typeof VehicleType>;

export const ConnectorType = z.enum(['CCS2', 'TYPE2', 'CHADEMO', 'VINFAST_AC', 'OTHER']);
export type ConnectorType = z.infer<typeof ConnectorType>;
