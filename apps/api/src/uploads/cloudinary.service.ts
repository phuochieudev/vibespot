import { Inject, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { UploadSignature } from '@vibespot/shared';
import { createHash } from 'node:crypto';
import type { Env } from '../config/env.js';

export const PHOTO_FOLDER = 'vibespot/places';

// Chữ ký Cloudinary: sắp xếp tham số theo tên, nối "k=v&k=v", thêm API secret ở cuối, rồi SHA-1.
// https://cloudinary.com/documentation/authentication_signatures
export function signParams(params: Record<string, string | number>, apiSecret: string): string {
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');
  return createHash('sha1').update(toSign + apiSecret).digest('hex');
}

@Injectable()
export class CloudinaryService {
  constructor(@Inject(ConfigService) private readonly config: ConfigService<Env, true>) {}

  private credentials() {
    const cloudName = this.config.get('CLOUD_NAME', { infer: true });
    const apiKey = this.config.get('CLOUD_API_KEY', { infer: true });
    const apiSecret = this.config.get('CLOUD_API_SECRET', { infer: true });
    if (!cloudName || !apiKey || !apiSecret) {
      throw new ServiceUnavailableException('Chưa cấu hình upload ảnh');
    }
    return { cloudName, apiKey, apiSecret };
  }

  sign(now: number = Date.now()): UploadSignature {
    const { cloudName, apiKey, apiSecret } = this.credentials();
    const timestamp = Math.floor(now / 1000);
    // Chữ ký gắn với đúng folder và timestamp này: client không đổi được nơi lưu ảnh,
    // và chữ ký chỉ có hiệu lực trong thời gian ngắn (Cloudinary từ chối timestamp quá cũ).
    const signature = signParams({ folder: PHOTO_FOLDER, timestamp }, apiSecret);
    return { cloudName, apiKey, folder: PHOTO_FOLDER, timestamp, signature };
  }

  // Ảnh client báo lên phải thật sự nằm trong tài khoản + thư mục của mình.
  owns(url: string, publicId: string): boolean {
    const cloudName = this.config.get('CLOUD_NAME', { infer: true });
    if (!cloudName) return false;
    return (
      url.startsWith(`https://res.cloudinary.com/${cloudName}/image/upload/`) &&
      publicId.startsWith(`${PHOTO_FOLDER}/`) &&
      url.includes(publicId)
    );
  }
}
