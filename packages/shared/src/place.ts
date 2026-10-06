import { z } from 'zod';
import { cafeAttributesSchema, evChargingAttributesSchema, parkingAttributesSchema } from './attributes';
import { PlaceCategory, PlaceSource, PlaceStatus } from './enums';

// Chỉ chặn toạ độ không hợp lệ; giới hạn theo khu vực (TP.HCM) sẽ xử lý ở API.
export const latSchema = z.number().min(-90).max(90);
export const lngSchema = z.number().min(-180).max(180);

const placeBase = {
  name: z.string().trim().min(2).max(120),
  address: z.string().trim().min(3).max(240),
  district: z.string().trim().max(80).optional(),
  lat: latSchema,
  lng: lngSchema,
};

// Tạo địa điểm: `attributes` phải khớp với `category`.
export const createPlaceSchema = z.discriminatedUnion('category', [
  z.object({ ...placeBase, category: z.literal('CAFE'), attributes: cafeAttributesSchema }),
  z.object({ ...placeBase, category: z.literal('PARKING'), attributes: parkingAttributesSchema }),
  z.object({
    ...placeBase,
    category: z.literal('EV_CHARGING'),
    attributes: evChargingAttributesSchema,
  }),
]);
export type CreatePlaceInput = z.infer<typeof createPlaceSchema>;

export const placeSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: PlaceCategory,
  address: z.string(),
  district: z.string().nullable(),
  lat: latSchema,
  lng: lngSchema,
  attributes: z.record(z.string(), z.unknown()),
  status: PlaceStatus,
  source: PlaceSource,
  avgRating: z.number().min(0).max(5),
  reviewCount: z.number().int().min(0),
  distanceMeters: z.number().min(0).optional(),
});
export type Place = z.infer<typeof placeSchema>;

const queryBoolean = z.enum(['true', 'false']).transform((v) => v === 'true');
export const nearbyQuerySchema = z.object({
  lat: z.coerce.number().pipe(latSchema),
  lng: z.coerce.number().pipe(lngSchema),
  radius: z.coerce.number().int().min(100).max(20_000).default(2000),
  category: PlaceCategory.default('CAFE'),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  hasWifi: queryBoolean.optional(),
  airConditioned: queryBoolean.optional(),
});
export type NearbyQuery = z.infer<typeof nearbyQuerySchema>;

export const searchQuerySchema = z.object({
  q: z.string().trim().min(1).max(100),
  lat: z.coerce.number().pipe(latSchema).optional(),
  lng: z.coerce.number().pipe(lngSchema).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
export type SearchQuery = z.infer<typeof searchQuerySchema>;
