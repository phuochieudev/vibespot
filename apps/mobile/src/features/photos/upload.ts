import type { UploadSignature } from '@vibespot/shared';
import { api } from '@/lib/api';

export interface UploadedImage {
  url: string;
  publicId: string;
}

// Upload thẳng từ điện thoại lên Cloudinary bằng chữ ký do server cấp.
// API secret không bao giờ xuống app; ảnh cũng không đi qua server của mình.
export async function uploadImage(uri: string): Promise<UploadedImage> {
  const sig = await api<UploadSignature>('/uploads/signature', { method: 'POST', auth: true });

  const form = new FormData();
  // React Native cho phép đưa { uri, name, type } vào FormData để gửi file từ bộ nhớ máy.
  form.append('file', { uri, name: 'photo.jpg', type: 'image/jpeg' } as unknown as Blob);
  form.append('api_key', sig.apiKey);
  form.append('timestamp', String(sig.timestamp));
  form.append('folder', sig.folder);
  form.append('signature', sig.signature);

  // Không tự đặt Content-Type: fetch phải tự thêm boundary cho multipart.
  const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, {
    method: 'POST',
    body: form,
  });
  const body = (await res.json()) as { secure_url?: string; public_id?: string; error?: { message?: string } };
  if (!res.ok || !body.secure_url || !body.public_id) {
    throw new Error(body.error?.message ?? 'Không tải ảnh lên được');
  }
  return { url: body.secure_url, publicId: body.public_id };
}
