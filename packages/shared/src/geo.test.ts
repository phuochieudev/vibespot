import { describe, expect, it } from 'vitest';
import { DEFAULT_CENTER, haversineMeters, isInServiceArea } from './geo';

describe('isInServiceArea', () => {
  it('Quận 1 nằm trong khu vực', () => {
    expect(isInServiceArea(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng)).toBe(true);
  });

  it('Hà Nội và toạ độ (0,0) nằm ngoài', () => {
    expect(isInServiceArea(21.0285, 105.8542)).toBe(false);
    expect(isInServiceArea(0, 0)).toBe(false);
  });
});

describe('haversineMeters', () => {
  it('cùng một điểm thì bằng 0', () => {
    expect(haversineMeters(DEFAULT_CENTER, DEFAULT_CENTER)).toBe(0);
  });

  it('lệch 0.01 độ vĩ ~ 1.11 km', () => {
    const b = { lat: DEFAULT_CENTER.lat + 0.01, lng: DEFAULT_CENTER.lng };
    expect(haversineMeters(DEFAULT_CENTER, b)).toBeGreaterThan(1100);
    expect(haversineMeters(DEFAULT_CENTER, b)).toBeLessThan(1125);
  });

  it('TP.HCM - Hà Nội ~ 1.150 km', () => {
    const d = haversineMeters(DEFAULT_CENTER, { lat: 21.0285, lng: 105.8542 }) / 1000;
    expect(d).toBeGreaterThan(1130);
    expect(d).toBeLessThan(1170);
  });
});
