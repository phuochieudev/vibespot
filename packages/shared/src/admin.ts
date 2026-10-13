import { z } from 'zod';
import { ModerationStatus } from './enums';

// Danh sách cần duyệt: mặc định chỉ lấy các mục đang chờ.
export const adminListQuerySchema = z.object({
  status: ModerationStatus.default('PENDING'),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
export type AdminListQuery = z.infer<typeof adminListQuerySchema>;

// Quyết định của admin: chỉ duyệt hoặc từ chối (không "trả về chờ duyệt").
export const moderateSchema = z.object({ status: z.enum(['APPROVED', 'REJECTED']) });
export type ModerateInput = z.infer<typeof moderateSchema>;

export const adminPhotoSchema = z.object({
  id: z.string(),
  url: z.string(),
  status: ModerationStatus,
  createdAt: z.string(),
  place: z.object({ id: z.string(), name: z.string() }),
  user: z.object({ id: z.string(), displayName: z.string() }),
});
export type AdminPhoto = z.infer<typeof adminPhotoSchema>;
