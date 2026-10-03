import { describe, expect, it } from 'vitest';
import { createPlaceSchema, nearbyQuerySchema, registerSchema } from './index';

const base = { name: 'Cộng Cà Phê', address: '26 Lý Tự Trọng, Quận 1', lat: 10.7769, lng: 106.7009 };

describe('createPlaceSchema', () => {
  it('chấp nhận quán cà phê với thuộc tính hợp lệ', () => {
    const r = createPlaceSchema.safeParse({
      ...base,
      category: 'CAFE',
      attributes: { outlets: 'MANY', wifiMbps: 80, noise: 'QUIET' },
    });
    expect(r.success).toBe(true);
  });

  it('từ chối thuộc tính sai kiểu với loại địa điểm', () => {
    const r = createPlaceSchema.safeParse({
      ...base,
      category: 'EV_CHARGING',
      attributes: { powerKw: 'nhanh' },
    });
    expect(r.success).toBe(false);
  });

  it('từ chối toạ độ ngoài phạm vi', () => {
    const r = createPlaceSchema.safeParse({ ...base, lat: 200, category: 'CAFE', attributes: {} });
    expect(r.success).toBe(false);
  });
});

describe('nearbyQuerySchema', () => {
  it('ép kiểu chuỗi từ query string và đặt giá trị mặc định', () => {
    const r = nearbyQuerySchema.parse({ lat: '10.77', lng: '106.7' });
    expect(r).toMatchObject({ lat: 10.77, lng: 106.7, radius: 2000, category: 'CAFE' });
  });
});

describe('registerSchema', () => {
  it('chuẩn hoá email về chữ thường', () => {
    const r = registerSchema.parse({ email: 'A@B.com', password: '12345678', displayName: 'Hieu' });
    expect(r.email).toBe('a@b.com');
  });
});
