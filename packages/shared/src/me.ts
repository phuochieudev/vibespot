import { z } from 'zod';

export const meStatsSchema = z.object({
  reviewCount: z.number().int().min(0),
  favoriteCount: z.number().int().min(0),
  placeCount: z.number().int().min(0),
});
export type MeStats = z.infer<typeof meStatsSchema>;
