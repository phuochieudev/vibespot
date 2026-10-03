import { describe, expect, it } from 'vitest';
import { DEFAULT_CENTER, isInServiceArea } from './geo';

describe('isInServiceArea', () => {
  it('Quận 1 nằm trong khu vực', () => {
    expect(isInServiceArea(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng)).toBe(true);
  });

  it('Hà Nội và toạ độ (0,0) nằm ngoài', () => {
    expect(isInServiceArea(21.0285, 105.8542)).toBe(false);
    expect(isInServiceArea(0, 0)).toBe(false);
  });
});
