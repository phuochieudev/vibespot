import { BadRequestException } from '@nestjs/common';
import { createPlaceSchema } from '@vibespot/shared';
import { ZodValidationPipe } from './zod-validation.pipe.js';

describe('ZodValidationPipe', () => {
  const pipe = new ZodValidationPipe(createPlaceSchema);
  const valid = {
    name: 'Cộng Cà Phê',
    address: '26 Lý Tự Trọng, Quận 1',
    lat: 10.7769,
    lng: 106.7009,
    category: 'CAFE',
    attributes: { outlets: 'MANY' },
  };

  it('trả về dữ liệu đã parse khi hợp lệ', () => {
    expect(pipe.transform(valid)).toMatchObject({ name: 'Cộng Cà Phê', category: 'CAFE' });
  });

  it('ném 400 kèm danh sách lỗi khi sai', () => {
    expect(() => pipe.transform({ ...valid, lat: 999 })).toThrow(BadRequestException);
  });
});
