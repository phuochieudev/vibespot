import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { setupApp } from '../src/setup-app.js';

describe('Favorites, stats and cover photo (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const http = () => request(app.getHttpServer());

  const stamp = Date.now();
  const token = `fv${stamp.toString(36)}`;
  const emails = [`e2e-fv-a-${stamp}@vibespot.test`, `e2e-fv-b-${stamp}@vibespot.test`];
  const tokens: string[] = [];
  const as = (i: number) => ({ Authorization: `Bearer ${tokens[i]}` });
  let placeId: string;
  let userId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    setupApp(app, '*');
    await app.init();
    prisma = app.get(PrismaService);

    for (const email of emails) {
      const res = await http().post('/api/auth/register').send({ email, password: 'matkhau-manh-123', displayName: 'Người lưu' });
      tokens.push(res.body.accessToken);
      if (!userId) userId = res.body.user.id;
    }
    const created = await http().post('/api/places').set(as(0)).send({
      name: `Quán yêu thích ${token}`,
      address: '4 Pasteur, Quận 1',
      lat: 10.7762,
      lng: 106.6992,
      category: 'CAFE',
      attributes: {},
    });
    placeId = created.body.id;
  });

  afterAll(async () => {
    await prisma.$executeRaw`DELETE FROM "Place" WHERE "searchName" LIKE ${`%${token}%`}`;
    await prisma.user.deleteMany({ where: { email: { in: emails } } });
    await app.close();
  });

  const favorites = async (i: number) => (await http().get('/api/me/favorites').set(as(i)).expect(200)).body;

  it('cần đăng nhập, và không lưu được quán chưa duyệt (404)', async () => {
    await http().get('/api/me/favorites').expect(401);
    await http().put(`/api/places/${placeId}/favorite`).expect(401);
    await http().put(`/api/places/${placeId}/favorite`).set(as(0)).expect(404);
  });

  describe('sau khi quán được duyệt', () => {
    beforeAll(async () => {
      await prisma.$executeRaw`UPDATE "Place" SET status = 'APPROVED' WHERE id = ${placeId}::uuid`;
    });

    it('lưu quán (lặp lại vẫn ổn), liệt kê, rồi bỏ lưu', async () => {
      await http().put(`/api/places/${placeId}/favorite`).set(as(0)).expect(204);
      await http().put(`/api/places/${placeId}/favorite`).set(as(0)).expect(204);
      const list = await favorites(0);
      expect(list).toHaveLength(1);
      expect(list[0]).toMatchObject({ id: placeId, coverUrl: null });

      await http().delete(`/api/places/${placeId}/favorite`).set(as(0)).expect(204);
      await http().delete(`/api/places/${placeId}/favorite`).set(as(0)).expect(204); // bỏ lưu quán chưa lưu cũng ổn
      expect(await favorites(0)).toEqual([]);
    });

    it('danh sách yêu thích là của riêng mỗi người', async () => {
      await http().put(`/api/places/${placeId}/favorite`).set(as(0)).expect(204);
      expect(await favorites(1)).toEqual([]);
    });

    it('thống kê hồ sơ đếm đúng đánh giá, quán đã lưu và quán đã đóng góp', async () => {
      await http().post(`/api/places/${placeId}/reviews`).set(as(0)).send({ rating: 4 }).expect(200);
      const stats = await http().get('/api/me/stats').set(as(0)).expect(200);
      expect(stats.body).toEqual({ reviewCount: 1, favoriteCount: 1, placeCount: 1 });
      const other = await http().get('/api/me/stats').set(as(1)).expect(200);
      expect(other.body).toEqual({ reviewCount: 0, favoriteCount: 0, placeCount: 0 });
      await http().get('/api/me/stats').expect(401);
    });

    it('ảnh bìa là ảnh đã duyệt đầu tiên; ảnh chờ duyệt không được dùng', async () => {
      const mk = (status: 'PENDING' | 'APPROVED', n: number, ago: number) =>
        prisma.photo.create({
          data: {
            placeId,
            userId,
            url: `https://res.cloudinary.com/demo/image/upload/v1/vibespot/places/${token}${n}.jpg`,
            publicId: `vibespot/places/${token}${n}`,
            status,
            createdAt: new Date(Date.now() - ago),
          },
        });
      await mk('PENDING', 1, 3000); // cũ nhất nhưng chưa duyệt
      await mk('APPROVED', 2, 2000);
      await mk('APPROVED', 3, 1000);

      const detail = await http().get(`/api/places/${placeId}`).expect(200);
      expect(detail.body.coverUrl).toContain(`${token}2.jpg`);
      const list = await favorites(0);
      expect(list[0].coverUrl).toContain(`${token}2.jpg`);
    });
  });
});
