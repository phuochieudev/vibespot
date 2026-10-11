import { z } from 'zod';

// Mỗi người được đăng tối đa bấy nhiêu ảnh cho một quán.
export const MAX_PHOTOS_PER_USER_PER_PLACE = 5;

// Client gửi lên sau khi đã upload ảnh thẳng lên Cloudinary.
export const createPhotoSchema = z.object({
  url: z.url('Địa chỉ ảnh không hợp lệ').max(500),
  publicId: z.string().min(1).max(200),
});
export type CreatePhotoInput = z.infer<typeof createPhotoSchema>;

export const photoSchema = z.object({
  id: z.string(),
  url: z.string(),
  createdAt: z.string(),
  user: z.object({ id: z.string(), displayName: z.string() }),
});
export type Photo = z.infer<typeof photoSchema>;

// Chữ ký để client upload thẳng lên Cloudinary (API secret không bao giờ rời server).
export const uploadSignatureSchema = z.object({
  cloudName: z.string(),
  apiKey: z.string(),
  folder: z.string(),
  timestamp: z.number().int(),
  signature: z.string(),
});
export type UploadSignature = z.infer<typeof uploadSignatureSchema>;
