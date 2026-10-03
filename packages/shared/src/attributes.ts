import { z } from 'zod';
import { ConnectorType, NoiseLevel, OutletLevel, VehicleType } from './enums';

// Thuộc tính riêng của từng loại địa điểm, lưu trong cột JSONB `attributes`.
// Thêm loại địa điểm mới = thêm một schema ở đây.

export const cafeAttributesSchema = z.object({
  outlets: OutletLevel.optional(),
  wifiMbps: z.number().min(0).max(10_000).optional(),
  noise: NoiseLevel.optional(),
  airConditioned: z.boolean().optional(),
  openLate: z.boolean().optional(),
  freeParking: z.boolean().optional(),
  avgPriceVnd: z.number().int().min(0).optional(),
});
export type CafeAttributes = z.infer<typeof cafeAttributesSchema>;

export const parkingAttributesSchema = z.object({
  vehicleTypes: z.array(VehicleType).min(1).optional(),
  pricePerHourVnd: z.number().int().min(0).optional(),
  pricePerEntryVnd: z.number().int().min(0).optional(),
  covered: z.boolean().optional(),
  capacity: z.number().int().min(1).optional(),
  open24h: z.boolean().optional(),
});
export type ParkingAttributes = z.infer<typeof parkingAttributesSchema>;

export const evChargingAttributesSchema = z.object({
  connectors: z.array(ConnectorType).min(1).optional(),
  powerKw: z.number().min(0).max(1000).optional(),
  pricePerKwhVnd: z.number().int().min(0).optional(),
  operator: z.string().max(80).optional(),
  chargerCount: z.number().int().min(1).optional(),
});
export type EvChargingAttributes = z.infer<typeof evChargingAttributesSchema>;
