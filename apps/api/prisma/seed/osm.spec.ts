import { buildAddress, buildAttributes, toPlaceSeed, toPlaceSeeds } from './osm.js';

const node = (tags: Record<string, string>, lat = 10.77, lon = 106.7) =>
  ({ type: 'node', id: 1, lat, lon, tags }) as const;

describe('toPlaceSeed', () => {
  it('chuyển node hợp lệ, bỏ dấu cho searchName', () => {
    const seed = toPlaceSeed(
      node({ name: 'Cộng Cà Phê', 'addr:housenumber': '26', 'addr:street': 'Lý Tự Trọng' }),
    );
    expect(seed).toMatchObject({
      osmId: 'node/1',
      name: 'Cộng Cà Phê',
      searchName: 'cong ca phe',
      address: '26 Lý Tự Trọng',
    });
  });

  it('lấy toạ độ từ center với way', () => {
    const seed = toPlaceSeed({
      type: 'way',
      id: 9,
      center: { lat: 10.8, lon: 106.7 },
      tags: { name: 'Quán A' },
    });
    expect(seed).toMatchObject({ osmId: 'way/9', lat: 10.8, lng: 106.7 });
  });

  it('bỏ qua phần tử không tên hoặc ngoài khu vực', () => {
    expect(toPlaceSeed(node({}))).toBeNull();
    expect(toPlaceSeed(node({ name: 'Hà Nội Cafe' }, 21.03, 105.85))).toBeNull();
  });

  it('địa chỉ mặc định khi thiếu thông tin', () => {
    expect(buildAddress({})).toBe('Thành phố Hồ Chí Minh');
  });
});

describe('buildAttributes', () => {
  it('đọc wifi và máy lạnh từ tag OSM', () => {
    expect(buildAttributes({ internet_access: 'wlan', air_conditioning: 'yes' })).toEqual({
      hasWifi: true,
      airConditioned: true,
    });
    expect(buildAttributes({ internet_access: 'no' })).toEqual({ hasWifi: false });
    expect(buildAttributes({})).toEqual({});
  });
});

describe('toPlaceSeeds', () => {
  it('loại trùng osmId', () => {
    const list = toPlaceSeeds([node({ name: 'A quán' }), node({ name: 'A quán' })]);
    expect(list).toHaveLength(1);
  });
});
