import { describe, expect, it } from 'vitest';
import { thumb } from './cloudinary';
import { describeAttributes } from './place-attributes';
import { timeAgo } from './time';

describe('timeAgo', () => {
  const now = new Date('2026-10-06T12:00:00Z').getTime();
  const ago = (ms: number) => new Date(now - ms).toISOString();

  it('dưới 1 phút là "vừa xong"', () => {
    expect(timeAgo(ago(20_000), now)).toBe('vừa xong');
  });
  it('chọn đúng đơn vị', () => {
    expect(timeAgo(ago(5 * 60_000), now)).toBe('5 phút trước');
    expect(timeAgo(ago(3 * 3_600_000), now)).toBe('3 giờ trước');
    expect(timeAgo(ago(2 * 86_400_000), now)).toBe('2 ngày trước');
    expect(timeAgo(ago(65 * 86_400_000), now)).toBe('2 tháng trước');
    expect(timeAgo(ago(400 * 86_400_000), now)).toBe('1 năm trước');
  });
  it('thời điểm ở tương lai (lệch đồng hồ) không âm', () => {
    expect(timeAgo(ago(-60_000), now)).toBe('vừa xong');
  });
});

describe('describeAttributes', () => {
  it('thuộc tính rỗng thì không có nhãn', () => {
    expect(describeAttributes({})).toEqual([]);
  });
  it('dịch các thuộc tính quán cà phê', () => {
    expect(
      describeAttributes({ hasWifi: true, airConditioned: true, outlets: 'MANY', noise: 'QUIET' }),
    ).toEqual(['Có wifi', 'Máy lạnh', 'Nhiều ổ cắm', 'Yên tĩnh']);
  });
  it('tốc độ wifi thay cho nhãn "Có wifi"', () => {
    expect(describeAttributes({ hasWifi: true, wifiMbps: 79.6 })).toEqual(['Wifi 80 Mbps']);
  });
  it('bỏ qua giá trị false và giá trị lạ', () => {
    expect(describeAttributes({ hasWifi: false, outlets: 'LOTS', noise: 7 })).toEqual([]);
  });
});

describe('thumb', () => {
  const url = 'https://res.cloudinary.com/demo/image/upload/v123/vibespot/places/a.jpg';

  it('chèn phép biến đổi ngay sau /image/upload/', () => {
    expect(thumb(url, 400, 300)).toBe(
      'https://res.cloudinary.com/demo/image/upload/c_fill,w_400,h_300,q_auto,f_auto/v123/vibespot/places/a.jpg',
    );
  });

  it('URL không phải của Cloudinary thì giữ nguyên', () => {
    expect(thumb('https://example.com/a.jpg', 400, 300)).toBe('https://example.com/a.jpg');
  });
});
