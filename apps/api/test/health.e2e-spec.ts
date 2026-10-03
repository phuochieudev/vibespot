import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { setupApp } from '../src/setup-app.js';

describe('Health (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    setupApp(app, '*');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/health trả về status ok', async () => {
    const res = await request(app.getHttpServer()).get('/api/health').expect(200);
    expect(res.body.status).toBe('ok');
  });

  it('GET /api/health/db kết nối được Postgres có PostGIS', async () => {
    const res = await request(app.getHttpServer()).get('/api/health/db').expect(200);
    expect(res.body.postgis).toMatch(/^\d/);
  });

  it('có header bảo mật của helmet', async () => {
    const res = await request(app.getHttpServer()).get('/api/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  it('GET /docs trả về Swagger UI', async () => {
    await request(app.getHttpServer()).get('/docs').expect(200);
  });
});
