import 'dotenv/config';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { setupApp } from '../src/setup-app.js';

const configured = Boolean(process.env.CLOUD_NAME && process.env.CLOUD_API_KEY && process.env.CLOUD_API_SECRET);

// Cần thông tin Cloudinary thật trong .env; không có (vd. CI) thì bỏ qua.
describe.skipIf(!configured)('Photos + moderation (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const http = () => request(app.getHttpServer());

  const stamp = Date.now();
  const token = `ph${stamp.toString(36)}`;
  const userEmail = `e2e-ph-user-${stamp}@vibespot.test`;
  const adminEmail = `e2e-ph-admin-${stamp}@vibespot.test`;
  let userToken: string;
  let adminToken: string;
  let placeId: string;
  const as = (t: string) => ({ Authorization: `Bearer ${t}` });
  const cloud = process.env.CLOUD_NAME!;
  const photo = (n: number) => ({
    url: `https://res.cloudinary.com/${cloud}/image/upload/v1/vibespot/places/${token}${n}.jpg`,
    publicId: `vibespot/places/${token}${n}`,
  });
  const publicPhotos = async () => (await http().get(`/api/places/${placeId}/photos`).expect(200)).body;
  const pendingIds = async () =>
    (await http().get('/api/admin/photos').set(as(adminToken)).expect(200)).body
      .filter((p: { place: { id: string } }) => p.place.id === placeId)
      .map((p: { id: string }) => p.id);

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
    // Cấp quyền admin thẳng trong DB (không có API tự nâng quyền); token cũ vẫn dùng được vì
    // AdminGuard đọc role từ DB.
    await prisma.user.update({ where: { email: adminEmail }, data: { role: 'ADMIN' } });

    // Quán do admin tạo thì tự duyệt.
    const created = await http().post('/api/places').set(as(adminToken)).send({
      name: `Quán ảnh ${token}`,
      address: '2 Lê Lợi, Quận 1',
      lat: 10.7731,
      lng: 106.6983,
      category: 'CAFE',
      attributes: {},
    });
    placeId = created.body.id;
  });

  afterAll(async () => {
    await prisma.$executeRaw`DELETE FROM "Place" WHERE "searchName" LIKE ${`%${token}%`}`;
    await prisma.user.deleteMany({ where: { email: { in: [userEmail, adminEmail] } } });
    await app.close();
  });

  it('cấp chữ ký cần đăng nhập, và không lộ API secret', async () => {
    await http().post('/api/uploads/signature').expect(401);
    const res = await http().post('/api/uploads/signature').set(as(userToken)).expect(200);
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
      .set(as(userToken))
      .send({ url: 'https://evil.example.com/x.jpg', publicId: 'vibespot/places/x' })
      .expect(400);
    await http()
      .post(`/api/places/${placeId}/photos`)
      .set(as(userToken))
      .send({ url: 'https://res.cloudinary.com/nguoi-khac/image/upload/v1/vibespot/places/x.jpg', publicId: 'vibespot/places/x' })
      .expect(400);
  });

  let pendingId: string;

  it('ảnh của người dùng thường luôn ở trạng thái PENDING và chưa hiện công khai', async () => {
    const added = await http().post(`/api/places/${placeId}/photos`).set(as(userToken)).send(photo(1)).expect(201);
    pendingId = added.body.id;
    expect(added.body).toMatchObject({ status: 'PENDING', url: photo(1).url });
    expect(await publicPhotos()).toEqual([]);
  });

  it('người dùng thường không vào được khu vực admin (403), chưa đăng nhập thì 401', async () => {
    await http().get('/api/admin/photos').expect(401);
    await http().get('/api/admin/photos').set(as(userToken)).expect(403);
    await http().patch(`/api/admin/photos/${pendingId}`).set(as(userToken)).send({ status: 'APPROVED' }).expect(403);
  });

  it('admin thấy ảnh chờ duyệt kèm tên quán và người đăng, không lộ email', async () => {
    const res = await http().get('/api/admin/photos').set(as(adminToken)).expect(200);
    const hit = res.body.find((p: { id: string }) => p.id === pendingId);
    expect(hit).toMatchObject({ status: 'PENDING', place: { name: `Quán ảnh ${token}` }, user: { displayName: 'Người dùng' } });
    expect(hit.user.email).toBeUndefined();
  });

  it('admin duyệt thì ảnh hiện công khai và rời khỏi hàng chờ', async () => {
    const res = await http().patch(`/api/admin/photos/${pendingId}`).set(as(adminToken)).send({ status: 'APPROVED' }).expect(200);
    expect(res.body.status).toBe('APPROVED');
    const list = await publicPhotos();
    expect(list.map((p: { id: string }) => p.id)).toEqual([pendingId]);
    expect(await pendingIds()).not.toContain(pendingId);
    const row = await prisma.photo.findUniqueOrThrow({ where: { id: pendingId } });
    expect(row.reviewedAt).not.toBeNull();
    expect(row.reviewedById).not.toBeNull();
  });

  it('admin từ chối thì ảnh không hiện công khai', async () => {
    const added = await http().post(`/api/places/${placeId}/photos`).set(as(userToken)).send(photo(2)).expect(201);
    await http().patch(`/api/admin/photos/${added.body.id}`).set(as(adminToken)).send({ status: 'REJECTED' }).expect(200);
    const list = await publicPhotos();
    expect(list.map((p: { id: string }) => p.id)).not.toContain(added.body.id);
  });

  it('kiểm tra dữ liệu: trạng thái không hợp lệ (400), id sai (400), id không tồn tại (404)', async () => {
    await http().patch(`/api/admin/photos/${pendingId}`).set(as(adminToken)).send({ status: 'PENDING' }).expect(400);
    await http().patch('/api/admin/photos/khong-phai-uuid').set(as(adminToken)).send({ status: 'APPROVED' }).expect(400);
    await http().patch('/api/admin/photos/00000000-0000-4000-8000-000000000000').set(as(adminToken)).send({ status: 'APPROVED' }).expect(404);
  });

  it('ảnh do chính admin đăng thì tự duyệt', async () => {
    const added = await http().post(`/api/places/${placeId}/photos`).set(as(adminToken)).send(photo(3)).expect(201);
    expect(added.body.status).toBe('APPROVED');
    const list = await publicPhotos();
    expect(list.map((p: { id: string }) => p.id)).toContain(added.body.id);
  });

  it('giới hạn 5 ảnh/người/quán không tính ảnh bị từ chối', async () => {
    // Người dùng đang có: 1 đã duyệt + 1 bị từ chối => đếm 1. Thêm 4 ảnh nữa cho đủ 5.
    for (let n = 4; n <= 7; n++) {
      await http().post(`/api/places/${placeId}/photos`).set(as(userToken)).send(photo(n)).expect(201);
    }
    await http().post(`/api/places/${placeId}/photos`).set(as(userToken)).send(photo(8)).expect(409);

    // Từ chối một ảnh thì được gửi lại.
    const [first] = await pendingIds();
    await http().patch(`/api/admin/photos/${first}`).set(as(adminToken)).send({ status: 'REJECTED' }).expect(200);
    await http().post(`/api/places/${placeId}/photos`).set(as(userToken)).send(photo(9)).expect(201);
  });
});
