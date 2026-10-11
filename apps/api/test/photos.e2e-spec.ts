import 'dotenv/config';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { setupApp } from '../src/setup-app.js';

const configured = Boolean(process.env.CLOUD_NAME && process.env.CLOUD_API_KEY && process.env.CLOUD_API_SECRET);

// Cần thông tin Cloudinary thật trong .env; không có (vd. CI) thì bỏ qua.
describe.skipIf(!configured)('Photos (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const http = () => request(app.getHttpServer());

  const stamp = Date.now();
  const token = `ph${stamp.toString(36)}`;
  const email = `e2e-ph-${stamp}@vibespot.test`;
  let accessToken: string;
  let placeId: string;
  const auth = () => ({ Authorization: `Bearer ${accessToken}` });
  const cloud = process.env.CLOUD_NAME!;
  const photo = (n: number) => ({
    url: `https://res.cloudinary.com/${cloud}/image/upload/v1/vibespot/places/${token}${n}.jpg`,
    publicId: `vibespot/places/${token}${n}`,
  });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    setupApp(app, '*');
    await app.init();
    prisma = app.get(PrismaService);

    const reg = await http()
      .post('/api/auth/register')
      .send({ email, password: 'matkhau-manh-123', displayName: 'Ảnh E2E' });
    accessToken = reg.body.accessToken;

    const created = await http().post('/api/places').set(auth()).send({
      name: `Quán ảnh ${token}`,
      address: '2 Lê Lợi, Quận 1',
      lat: 10.7731,
      lng: 106.6983,
      category: 'CAFE',
      attributes: {},
    });
    placeId = created.body.id;
    await prisma.$executeRaw`UPDATE "Place" SET status = 'APPROVED' WHERE id = ${placeId}::uuid`;
  });

  afterAll(async () => {
    await prisma.$executeRaw`DELETE FROM "Place" WHERE "searchName" LIKE ${`%${token}%`}`;
    await prisma.user.deleteMany({ where: { email } });
    await app.close();
  });

  it('cấp chữ ký cần đăng nhập, và không lộ API secret', async () => {
    await http().post('/api/uploads/signature').expect(401);
    const res = await http().post('/api/uploads/signature').set(auth()).expect(200);
    expect(res.body).toMatchObject({ cloudName: cloud, folder: 'vibespot/places' });
    expect(res.body.signature).toMatch(/^[0-9a-f]{40}$/);
    expect(JSON.stringify(res.body)).not.toContain(process.env.CLOUD_API_SECRET!);
  });

  it('thêm ảnh cần đăng nhập (401)', async () => {
    await http().post(`/api/places/${placeId}/photos`).send(photo(1)).expect(401);
  });

  it('từ chối ảnh không thuộc tài khoản Cloudinary của mình (400)', async () => {
    await http()
      .post(`/api/places/${placeId}/photos`)
      .set(auth())
      .send({ url: 'https://evil.example.com/x.jpg', publicId: 'vibespot/places/x' })
      .expect(400);
    await http()
      .post(`/api/places/${placeId}/photos`)
      .set(auth())
      .send({ url: 'https://res.cloudinary.com/nguoi-khac/image/upload/v1/vibespot/places/x.jpg', publicId: 'vibespot/places/x' })
      .expect(400);
  });

  it('thêm ảnh hợp lệ rồi liệt kê được, không lộ email', async () => {
    const added = await http().post(`/api/places/${placeId}/photos`).set(auth()).send(photo(1)).expect(201);
    expect(added.body.url).toBe(photo(1).url);
    const list = await http().get(`/api/places/${placeId}/photos`).expect(200);
    expect(list.body).toHaveLength(1);
    expect(list.body[0].user.email).toBeUndefined();
  });

  it('mỗi người tối đa 5 ảnh cho một quán (409)', async () => {
    for (let n = 2; n <= 5; n++) {
      await http().post(`/api/places/${placeId}/photos`).set(auth()).send(photo(n)).expect(201);
    }
    await http().post(`/api/places/${placeId}/photos`).set(auth()).send(photo(6)).expect(409);
  });
});
