import { z } from 'zod';
import { UserRole } from './enums';

export const registerSchema = z.object({
  email: z.email().toLowerCase(),
  password: z.string().min(8).max(72),
  displayName: z.string().trim().min(2).max(50),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.email().toLowerCase(),
  password: z.string().min(1).max(72),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const refreshSchema = z.object({ refreshToken: z.string().min(1) });
export type RefreshInput = z.infer<typeof refreshSchema>;

export const userSchema = z.object({
  id: z.string(),
  email: z.email(),
  displayName: z.string(),
  avatarUrl: z.string().nullable(),
  role: UserRole,
  reputation: z.number().int(),
});
export type User = z.infer<typeof userSchema>;

export const authResponseSchema = z.object({
  user: userSchema,
  accessToken: z.string(),
  refreshToken: z.string(),
});
export type AuthResponse = z.infer<typeof authResponseSchema>;
