import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { setupApp } from '../src/setup-app.js';

// Giới hạn tốc độ tính theo IP. Sau proxy (Render...), IP thật nằm trong X-Forwarded-For.
async function createApp(trustProxy: number) {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication();
  setupApp(app, '*', trustProxy);
  await app.init();
  return app;
}

const remaining = async (app: INestApplication, ip: string) => {
  const res = await request(app.getHttpServer()).get('/api/health').set('X-Forwarded-For', ip);
  return Number(res.headers['x-ratelimit-remaining']);
};

describe('trust proxy (e2e)', () => {
  it('bật trust proxy: mỗi IP trong X-Forwarded-For có hạn mức riêng', async () => {
    const app = await createApp(1);
    try {
      const a1 = await remaining(app, '203.0.113.1');
      const b1 = await remaining(app, '203.0.113.2');
      const a2 = await remaining(app, '203.0.113.1');
      expect(b1).toBe(a1); // IP thứ hai bắt đầu hạn mức riêng của nó
      expect(a2).toBe(a1 - 1); // IP thứ nhất bị trừ tiếp
    } finally {
      await app.close();
    }
  });

  it('không bật trust proxy: bỏ qua X-Forwarded-For (client không giả IP để né giới hạn)', async () => {
    const app = await createApp(0);
    try {
      const first = await remaining(app, '203.0.113.1');
      const second = await remaining(app, '203.0.113.2');
      expect(second).toBe(first - 1); // vẫn là cùng một IP thật => chung hạn mức
    } finally {
      await app.close();
    }
  });
});
