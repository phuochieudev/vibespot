import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { setupApp } from '../src/setup-app.js';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const email = `e2e-${Date.now()}@vibespot.test`;
  const password = 'matkhau-manh-123';
  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    setupApp(app, '*');
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email } }); // refresh token xoá theo (cascade)
    await app.close();
  });

  let accessToken: string;
  let refreshToken: string;

  it('đăng ký tài khoản mới và không lộ passwordHash', async () => {
    const res = await http()
      .post('/api/auth/register')
      .send({ email: email.toUpperCase(), password, displayName: 'E2E User' })
      .expect(201);
    expect(res.body.user).toMatchObject({ email, displayName: 'E2E User', role: 'USER' });
    expect(res.body.user.passwordHash).toBeUndefined();
    expect(res.body.accessToken).toBeTruthy();
  });

  it('từ chối đăng ký trùng email (409)', async () => {
    await http()
      .post('/api/auth/register')
      .send({ email, password, displayName: 'Trùng' })
      .expect(409);
  });

  it('từ chối dữ liệu sai định dạng (400)', async () => {
    const res = await http()
      .post('/api/auth/register')
      .send({ email: 'khong-phai-email', password: '123', displayName: 'a' })
      .expect(400);
    expect(res.body.errors.length).toBeGreaterThanOrEqual(3);
  });

  it('đăng nhập sai mật khẩu trả 401', async () => {
    await http().post('/api/auth/login').send({ email, password: 'sai-mat-khau' }).expect(401);
  });

  it('đăng nhập đúng trả token', async () => {
    const res = await http().post('/api/auth/login').send({ email, password }).expect(200);
    accessToken = res.body.accessToken;
    refreshToken = res.body.refreshToken;
    expect(refreshToken).toBeTruthy();
  });

  it('GET /me cần token', async () => {
    await http().get('/api/me').expect(401);
    await http().get('/api/me').set('Authorization', 'Bearer rac').expect(401);
    const res = await http()
      .get('/api/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(res.body.email).toBe(email);
  });

  it('PATCH /me cập nhật tên hiển thị', async () => {
    const res = await http()
      .patch('/api/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ displayName: 'Tên Mới' })
      .expect(200);
    expect(res.body.displayName).toBe('Tên Mới');
    await http()
      .patch('/api/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({})
      .expect(400);
  });

  it('refresh xoay vòng token; token cũ dùng lại bị từ chối và thu hồi mọi phiên', async () => {
    const first = await http().post('/api/auth/refresh').send({ refreshToken }).expect(200);
    const newRefresh = first.body.refreshToken;
    expect(newRefresh).not.toBe(refreshToken);

    // Dùng lại token cũ => 401, và token mới (cùng user) cũng bị thu hồi.
    await http().post('/api/auth/refresh').send({ refreshToken }).expect(401);
    await http().post('/api/auth/refresh').send({ refreshToken: newRefresh }).expect(401);
  });

  it('logout thu hồi refresh token', async () => {
    const login = await http().post('/api/auth/login').send({ email, password }).expect(200);
    await http()
      .post('/api/auth/logout')
      .send({ refreshToken: login.body.refreshToken })
      .expect(204);
    await http()
      .post('/api/auth/refresh')
      .send({ refreshToken: login.body.refreshToken })
      .expect(401);
  });
});
