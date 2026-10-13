import { validateEnv } from './env.js';

const base = {
  DATABASE_URL: 'postgresql://u:p@localhost/db',
  JWT_ACCESS_SECRET: 'x'.repeat(32),
};

describe('validateEnv', () => {
  it('đặt giá trị mặc định', () => {
    expect(validateEnv(base)).toMatchObject({ NODE_ENV: 'development', PORT: 3000 });
  });

  it('ép PORT từ chuỗi sang số', () => {
    expect(validateEnv({ ...base, PORT: '8080' }).PORT).toBe(8080);
  });

  it('ném lỗi khi thiếu DATABASE_URL', () => {
    expect(() => validateEnv({})).toThrow(/DATABASE_URL/);
  });

  it('ném lỗi khi biến sai', () => {
    expect(() => validateEnv({ ...base, PORT: 'abc' })).toThrow(/PORT/);
    expect(() => validateEnv({ ...base, JWT_ACCESS_SECRET: 'ngan' })).toThrow(/JWT_ACCESS_SECRET/);
  });

  it('biến tuỳ chọn để trống được coi như chưa đặt', () => {
    const env = validateEnv({ ...base, DIRECT_URL: '', CLOUD_NAME: '   ', CLOUD_API_KEY: '' });
    expect(env.DIRECT_URL).toBeUndefined();
    expect(env.CLOUD_NAME).toBeUndefined();
    expect(env.CLOUD_API_KEY).toBeUndefined();
  });

  it('biến tuỳ chọn có giá trị thì giữ nguyên', () => {
    expect(validateEnv({ ...base, DIRECT_URL: 'postgresql://direct' }).DIRECT_URL).toBe(
      'postgresql://direct',
    );
  });
});
