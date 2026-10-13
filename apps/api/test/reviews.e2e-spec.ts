import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { setupApp } from '../src/setup-app.js';

describe('Reviews (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const http = () => request(app.getHttpServer());

  const stamp = Date.now();
  const token = `rv${stamp.toString(36)}`;
  const emails = [`e2e-rv-a-${stamp}@vibespot.test`, `e2e-rv-b-${stamp}@vibespot.test`];
  const tokens: string[] = [];
  const bearer = (i: number) => ({ Authorization: `Bearer ${tokens[i]}` });
  let placeId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    setupApp(app, '*');
    await app.init();
    prisma = app.get(PrismaService);

    for (const email of emails) {
      const res = await http()
        .post('/api/auth/register')
        .send({ email, password: 'matkhau-manh-123', displayName: `Người ${email.slice(8, 12)}` });
      tokens.push(res.body.accessToken);
    }

    const created = await http()
      .post('/api/places')
      .set(bearer(0))
      .send({
        name: `Quán đánh giá ${token}`,
        address: '1 Nguyễn Huệ, Quận 1',
        lat: 10.7745,
        lng: 106.7035,
        category: 'CAFE',
        attributes: {},
      });
    placeId = created.body.id;
  });

  afterAll(async () => {
    // Xoá địa điểm trước (đánh giá xoá theo), rồi xoá user.
    await prisma.$executeRaw`DELETE FROM "Place" WHERE "searchName" LIKE ${`%${token}%`}`;
    await prisma.user.deleteMany({ where: { email: { in: emails } } });
    await app.close();
  });

  const place = async () => (await http().get(`/api/places/${placeId}`).expect(200)).body;

  it('quán chờ duyệt thì không xem hay đánh giá được (404)', async () => {
    await http().get(`/api/places/${placeId}/reviews`).expect(404);
    await http()
      .post(`/api/places/${placeId}/reviews`)
      .set(bearer(0))
      .send({ rating: 5 })
      .expect(404);
  });

  describe('sau khi được duyệt', () => {
    beforeAll(async () => {
      await prisma.$executeRaw`UPDATE "Place" SET status = 'APPROVED' WHERE id = ${placeId}::uuid`;
    });

    it('chưa có đánh giá: danh sách rỗng, điểm 0', async () => {
      const res = await http().get(`/api/places/${placeId}/reviews`).expect(200);
      expect(res.body).toEqual([]);
      expect(await place()).toMatchObject({ avgRating: 0, reviewCount: 0 });
    });

    it('cần đăng nhập để đánh giá (401)', async () => {
      await http().post(`/api/places/${placeId}/reviews`).send({ rating: 5 }).expect(401);
    });

    it('từ chối điểm ngoài 1-5 và id sai định dạng (400)', async () => {
      for (const rating of [0, 6, 3.5, 'năm']) {
        await http()
          .post(`/api/places/${placeId}/reviews`)
          .set(bearer(0))
          .send({ rating })
          .expect(400);
      }
      await http()
        .post('/api/places/khong-phai-uuid/reviews')
        .set(bearer(0))
        .send({ rating: 5 })
        .expect(400);
    });

    it('đánh giá đầu tiên cập nhật điểm trung bình của quán', async () => {
      const res = await http()
        .post(`/api/places/${placeId}/reviews`)
        .set(bearer(0))
        .send({ rating: 5, comment: '  Wifi mạnh, nhiều ổ cắm  ' })
        .expect(200);
      expect(res.body).toMatchObject({ rating: 5, comment: 'Wifi mạnh, nhiều ổ cắm' });
      expect(res.body.user.email).toBeUndefined(); // không lộ email
      expect(await place()).toMatchObject({ avgRating: 5, reviewCount: 1 });
    });

    it('gửi lại thì cập nhật đánh giá cũ chứ không tạo thêm', async () => {
      await http()
        .post(`/api/places/${placeId}/reviews`)
        .set(bearer(0))
        .send({ rating: 3 })
        .expect(200);
      const list = await http().get(`/api/places/${placeId}/reviews`).expect(200);
      expect(list.body).toHaveLength(1);
      expect(list.body[0]).toMatchObject({ rating: 3, comment: null });
      expect(await place()).toMatchObject({ avgRating: 3, reviewCount: 1 });
    });

    it('người thứ hai đánh giá: điểm trung bình và số lượng tính lại đúng', async () => {
      await http()
        .post(`/api/places/${placeId}/reviews`)
        .set(bearer(1))
        .send({ rating: 4 })
        .expect(200);
      expect(await place()).toMatchObject({ avgRating: 3.5, reviewCount: 2 });
      const list = await http().get(`/api/places/${placeId}/reviews`).expect(200);
      expect(list.body).toHaveLength(2);
      expect(list.body[0].rating).toBe(4); // mới nhất đứng đầu
    });
  });
});
