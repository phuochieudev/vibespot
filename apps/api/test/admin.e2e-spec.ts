import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { setupApp } from '../src/setup-app.js';

describe('Admin moderation of places (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const http = () => request(app.getHttpServer());

  const stamp = Date.now();
  const token = `ad${stamp.toString(36)}`;
  const userEmail = `e2e-ad-user-${stamp}@vibespot.test`;
  const adminEmail = `e2e-ad-admin-${stamp}@vibespot.test`;
  let userToken: string;
  let adminToken: string;
  let placeId: string;
  const as = (t: string) => ({ Authorization: `Bearer ${t}` });
  const nearbyIds = async () =>
    (
      await http().get('/api/places/nearby?lat=10.7600&lng=106.6600&radius=300').expect(200)
    ).body.map((p: { id: string }) => p.id);

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    setupApp(app, '*');
    await app.init();
    prisma = app.get(PrismaService);

    const reg = (email: string, displayName: string) =>
      http().post('/api/auth/register').send({ email, password: 'matkhau-manh-123', displayName });
    userToken = (await reg(userEmail, 'Người dùng')).body.accessToken;
    adminToken = (await reg(adminEmail, 'Quản trị')).body.accessToken;
    await prisma.user.update({ where: { email: adminEmail }, data: { role: 'ADMIN' } });

    const created = await http()
      .post('/api/places')
      .set(as(userToken))
      .send({
        name: `Quán chờ duyệt ${token}`,
        address: '3 Hậu Giang, Quận 6',
        lat: 10.76,
        lng: 106.66,
        category: 'CAFE',
        attributes: { hasWifi: true },
      });
    placeId = created.body.id;
  });

  afterAll(async () => {
    await prisma.$executeRaw`DELETE FROM "Place" WHERE "searchName" LIKE ${`%${token}%`}`;
    await prisma.user.deleteMany({ where: { email: { in: [userEmail, adminEmail] } } });
    await app.close();
  });

  it('quán do người dùng thường tạo chưa hiện công khai', async () => {
    expect(await nearbyIds()).not.toContain(placeId);
  });

  it('khu vực admin: 401 khi chưa đăng nhập, 403 với người dùng thường', async () => {
    await http().get('/api/admin/places').expect(401);
    await http().get('/api/admin/places').set(as(userToken)).expect(403);
    await http()
      .patch(`/api/admin/places/${placeId}`)
      .set(as(userToken))
      .send({ status: 'APPROVED' })
      .expect(403);
  });

  it('admin thấy quán trong hàng chờ', async () => {
    const res = await http().get('/api/admin/places').set(as(adminToken)).expect(200);
    const hit = res.body.find((p: { id: string }) => p.id === placeId);
    expect(hit).toMatchObject({ status: 'PENDING', name: `Quán chờ duyệt ${token}` });
  });

  it('duyệt thì quán hiện công khai; từ chối thì ẩn đi', async () => {
    await http()
      .patch(`/api/admin/places/${placeId}`)
      .set(as(adminToken))
      .send({ status: 'APPROVED' })
      .expect(200);
    expect(await nearbyIds()).toContain(placeId);

    await http()
      .patch(`/api/admin/places/${placeId}`)
      .set(as(adminToken))
      .send({ status: 'REJECTED' })
      .expect(200);
    expect(await nearbyIds()).not.toContain(placeId);
    const rejected = await http()
      .get('/api/admin/places?status=REJECTED')
      .set(as(adminToken))
      .expect(200);
    expect(rejected.body.map((p: { id: string }) => p.id)).toContain(placeId);
  });

  it('kiểm tra dữ liệu: trạng thái lạ (400), trả về PENDING không cho phép (400), id không tồn tại (404)', async () => {
    await http().get('/api/admin/places?status=XYZ').set(as(adminToken)).expect(400);
    await http()
      .patch(`/api/admin/places/${placeId}`)
      .set(as(adminToken))
      .send({ status: 'PENDING' })
      .expect(400);
    await http()
      .patch('/api/admin/places/00000000-0000-4000-8000-000000000000')
      .set(as(adminToken))
      .send({ status: 'APPROVED' })
      .expect(404);
  });

  it('gỡ quyền admin có hiệu lực ngay dù token vẫn còn hạn', async () => {
    await http().get('/api/admin/places').set(as(adminToken)).expect(200);
    await prisma.user.update({ where: { email: adminEmail }, data: { role: 'USER' } });
    await http().get('/api/admin/places').set(as(adminToken)).expect(403);
  });
});
