import { z } from 'zod';

export const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional(),
});
export type CreateReviewInput = z.infer<typeof createReviewSchema>;

export const createWifiTestSchema = z.object({
  downloadMbps: z.number().min(0).max(10_000),
  uploadMbps: z.number().min(0).max(10_000),
  pingMs: z.number().min(0).max(10_000),
});
export type CreateWifiTestInput = z.infer<typeof createWifiTestSchema>;

export const reviewSchema = z.object({
  id: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().nullable(),
  createdAt: z.string(),
  user: z.object({ id: z.string(), displayName: z.string(), avatarUrl: z.string().nullable() }),
});
export type Review = z.infer<typeof reviewSchema>;
