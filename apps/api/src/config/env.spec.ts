import { validateEnv } from './env.js';

describe('validateEnv', () => {
  it('đặt giá trị mặc định', () => {
    expect(validateEnv({})).toMatchObject({ NODE_ENV: 'development', PORT: 3000 });
  });

  it('ép PORT từ chuỗi sang số', () => {
    expect(validateEnv({ PORT: '8080' }).PORT).toBe(8080);
  });

  it('ném lỗi khi biến sai', () => {
    expect(() => validateEnv({ PORT: 'abc' })).toThrow(/PORT/);
    expect(() => validateEnv({ JWT_ACCESS_SECRET: 'ngan' })).toThrow(/JWT_ACCESS_SECRET/);
  });
});
