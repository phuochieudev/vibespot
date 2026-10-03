import { describe, expect, it } from 'vitest';
import { toSearchText } from './search';

describe('toSearchText', () => {
  it('bỏ dấu tiếng Việt và đổi đ thành d', () => {
    expect(toSearchText('Cà Phê Thủ Đức')).toBe('ca phe thu duc');
  });

  it('gộp khoảng trắng và cắt đầu cuối', () => {
    expect(toSearchText('  Cộng   Cà  Phê ')).toBe('cong ca phe');
  });

  it('chuỗi không dấu giữ nguyên (chữ thường)', () => {
    expect(toSearchText('WiFi Cafe')).toBe('wifi cafe');
  });
});
