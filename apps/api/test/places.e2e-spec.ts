import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { setupApp } from '../src/setup-app.js';

describe('Places (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const http = () => request(app.getHttpServer());

  // Tên duy nhất để test không lẫn với dữ liệu thật (sau này có dữ liệu OSM).
  const token = `zq${Date.now().toString(36)}`;
  const email = `e2e-places-${Date.now()}@vibespot.test`;
  const otherEmail = `e2e-places-other-${Date.now()}@vibespot.test`;
  const place = {
    name: `Cà Phê ${token}`,
    address: '26 Lý Tự Trọng, Quận 1',
    lat: 10.7769,
    lng: 106.7009,
    category: 'CAFE',
    attributes: { outlets: 'MANY', wifiMbps: 80, noise: 'QUIET' },
  };

  let accessToken: string;
  let placeId: string;
  const auth = () => ({ Authorization: `Bearer ${accessToken}` });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    setupApp(app, '*');
    await app.init();
    prisma = app.get(PrismaService);

    const res = await http()
      .post('/api/auth/register')
      .send({ email, password: 'matkhau-manh-123', displayName: 'Places E2E' });
    accessToken = res.body.accessToken;
  });

  afterAll(async () => {
    // Place.createdById là SetNull (xoá user không xoá địa điểm), nên phải xoá địa điểm riêng.
    await prisma.$executeRaw`DELETE FROM "Place" WHERE "searchName" LIKE ${`%${token}%`}`;
    await prisma.user.deleteMany({ where: { email: { in: [email, otherEmail] } } });
    await app.close();
  });

  it('POST /places cần đăng nhập', async () => {
    await http().post('/api/places').send(place).expect(401);
  });

  it('từ chối thuộc tính không khớp loại địa điểm (400)', async () => {
    await http()
      .post('/api/places')
      .set(auth())
      .send({ ...place, category: 'EV_CHARGING', attributes: { powerKw: 'nhanh' } })
      .expect(400);
  });

  it('từ chối vị trí ngoài TP.HCM (400)', async () => {
    await http()
      .post('/api/places')
      .set(auth())
      .send({ ...place, lat: 21.0285, lng: 105.8542 })
      .expect(400);
  });

  it('tạo địa điểm mới ở trạng thái PENDING', async () => {
    const res = await http().post('/api/places').set(auth()).send(place).expect(201);
    placeId = res.body.id;
    expect(res.body).toMatchObject({
      name: place.name,
      status: 'PENDING',
      source: 'USER',
      lat: place.lat,
      lng: place.lng,
      attributes: place.attributes,
    });
  });

  it('GET /me/places liệt kê quán của mình (cả chờ duyệt), người khác không thấy', async () => {
    await http().get('/api/me/places').expect(401);
    const mine = await http().get('/api/me/places').set(auth()).expect(200);
    const hit = mine.body.find((p: { id: string }) => p.id === placeId);
    expect(hit).toMatchObject({ name: place.name, status: 'PENDING' });

    const other = await http()
      .post('/api/auth/register')
      .send({ email: otherEmail, password: 'matkhau-manh-123', displayName: 'Người khác' });
    const theirs = await http()
      .get('/api/me/places')
      .set({ Authorization: `Bearer ${other.body.accessToken}` })
      .expect(200);
    expect(theirs.body).toEqual([]);
  });

  it('chặn tạo trùng (cùng tên, cách nhau < 50m) bằng 409', async () => {
    await http()
      .post('/api/places')
      .set(auth())
      .send({ ...place, lat: 10.77695 })
      .expect(409);
  });

  it('địa điểm chờ duyệt không hiện ở nearby, search và chi tiết', async () => {
    const near = await http()
      .get('/api/places/nearby?lat=10.7769&lng=106.7009&radius=500')
      .expect(200);
    expect(near.body.find((p: { id: string }) => p.id === placeId)).toBeUndefined();
    const found = await http().get(`/api/places/search?q=${token}`).expect(200);
    expect(found.body).toHaveLength(0);
    await http().get(`/api/places/${placeId}`).expect(404);
  });

  describe('sau khi được duyệt', () => {
    beforeAll(async () => {
      await prisma.$executeRaw`UPDATE "Place" SET status = 'APPROVED' WHERE id = ${placeId}::uuid`;
    });

    it('nearby trả về địa điểm kèm khoảng cách', async () => {
      const res = await http()
        .get('/api/places/nearby?lat=10.7779&lng=106.7009&radius=500&category=CAFE')
        .expect(200);
      const hit = res.body.find((p: { id: string }) => p.id === placeId);
      expect(hit).toBeDefined();
      // 0.001 độ vĩ ~ 111m
      expect(hit.distanceMeters).toBeGreaterThan(90);
      expect(hit.distanceMeters).toBeLessThan(130);
    });

    it('nearby ngoài bán kính thì không trả về', async () => {
      const res = await http()
        .get('/api/places/nearby?lat=10.80&lng=106.7009&radius=500')
        .expect(200);
      expect(res.body.find((p: { id: string }) => p.id === placeId)).toBeUndefined();
    });

    it('nearby lọc theo loại địa điểm', async () => {
      const res = await http()
        .get('/api/places/nearby?lat=10.7769&lng=106.7009&radius=500&category=PARKING')
        .expect(200);
      expect(res.body.find((p: { id: string }) => p.id === placeId)).toBeUndefined();
    });

    it('lọc hasWifi: quán chưa ghi thông tin wifi thì bị loại, có ghi thì hiện', async () => {
      const url = '/api/places/nearby?lat=10.7769&lng=106.7009&radius=500&hasWifi=true';
      const found = (body: { id: string }[]) => body.find((p) => p.id === placeId);

      let res = await http().get(url).expect(200);
      expect(found(res.body)).toBeUndefined();

      await prisma.$executeRaw`
        UPDATE "Place" SET attributes = attributes || '{"hasWifi": true}'::jsonb
        WHERE id = ${placeId}::uuid`;

      res = await http().get(url).expect(200);
      expect(found(res.body)).toBeDefined();
    });

    it('lọc airConditioned: quán không khớp thì bị loại', async () => {
      const res = await http()
        .get('/api/places/nearby?lat=10.7769&lng=106.7009&radius=500&airConditioned=true')
        .expect(200);
      expect(res.body.find((p: { id: string }) => p.id === placeId)).toBeUndefined();
    });

    it('bộ lọc không hợp lệ trả 400', async () => {
      await http().get('/api/places/nearby?lat=10&lng=106&hasWifi=abc').expect(400);
    });

    it('nearby kiểm tra tham số (400)', async () => {
      await http().get('/api/places/nearby?lat=abc&lng=106').expect(400);
      await http().get('/api/places/nearby?lat=10&lng=106&radius=999999').expect(400);
    });

    it('search tìm được khi gõ không dấu và sai hoa thường', async () => {
      const res = await http()
        .get(`/api/places/search?q=${encodeURIComponent(`CA PHE ${token}`)}`)
        .expect(200);
      expect(res.body.map((p: { id: string }) => p.id)).toContain(placeId);
    });

    it('search có dấu tiếng Việt cũng ra', async () => {
      const res = await http()
        .get(`/api/places/search?q=${encodeURIComponent(`Cà Phê ${token}`)}`)
        .expect(200);
      expect(res.body.map((p: { id: string }) => p.id)).toContain(placeId);
    });

    it('search kèm vị trí thì có khoảng cách', async () => {
      const res = await http()
        .get(`/api/places/search?q=${token}&lat=10.7779&lng=106.7009`)
        .expect(200);
      expect(res.body[0].distanceMeters).toBeGreaterThan(0);
    });

    it('search không bị lỗi khi có ký tự đặc biệt của LIKE', async () => {
      await http()
        .get(`/api/places/search?q=${encodeURIComponent('100%_\\')}`)
        .expect(200);
    });

    it('GET /places/:id trả về chi tiết', async () => {
      const res = await http().get(`/api/places/${placeId}`).expect(200);
      expect(res.body).toMatchObject({ id: placeId, name: place.name, status: 'APPROVED' });
    });

    it('GET /places/:id với id không hợp lệ trả 400, không tồn tại trả 404', async () => {
      await http().get('/api/places/khong-phai-uuid').expect(400);
      await http().get('/api/places/00000000-0000-4000-8000-000000000000').expect(404);
    });
  });
});
