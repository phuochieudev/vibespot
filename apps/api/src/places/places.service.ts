import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  isInServiceArea,
  toSearchText,
  type CreatePlaceInput,
  type NearbyQuery,
  type Place,
  type SearchQuery,
} from '@vibespot/shared';
import { randomUUID } from 'node:crypto';
import type { AuthUser } from '../auth/auth.types.js';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

// Cột trả về cho client. `location` là kiểu geography nên phải tách ra lat/lng bằng PostGIS.
const COLUMNS = Prisma.sql`
  id, name, category, address, district, attributes, "openingHours", status, source,
  "avgRating", "reviewCount",
  (SELECT ph.url FROM "Photo" ph
    WHERE ph."placeId" = "Place".id AND ph.status = 'APPROVED'
    ORDER BY ph."createdAt" ASC LIMIT 1) AS "coverUrl",
  ST_Y(location::geometry) AS lat, ST_X(location::geometry) AS lng`;

type PlaceRow = Omit<Place, 'distanceMeters'> & { distanceMeters?: number | null };

// Khoảng cách tối đa (mét) để coi hai địa điểm cùng tên là trùng nhau.
const DUPLICATE_RADIUS_M = 50;

const point = (lat: number, lng: number) =>
  Prisma.sql`ST_SetSRID(ST_MakePoint(${lng}::float8, ${lat}::float8), 4326)::geography`;

// DB trả null cho distanceMeters khi không có điểm tham chiếu; schema chỉ cho phép vắng mặt.
const toPlace = ({ distanceMeters, ...rest }: PlaceRow): Place =>
  distanceMeters == null ? rest : { ...rest, distanceMeters: Math.round(distanceMeters) };

@Injectable()
export class PlacesService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async nearby(q: NearbyQuery): Promise<Place[]> {
    const here = point(q.lat, q.lng);

    // Gom các bộ lọc người dùng đã bật, bỏ những cái không gửi (undefined).
    const wanted = Object.fromEntries(
      Object.entries({ hasWifi: q.hasWifi, airConditioned: q.airConditioned }).filter(
        ([, value]) => value !== undefined,
      ),
    );
    // `attributes @> '{"hasWifi":true}'` = attributes chứa cặp khoá/giá trị đó.
    // Giá trị vẫn đi qua tham số của Prisma nên không bị SQL injection.
    const attrFilter =
      Object.keys(wanted).length > 0
        ? Prisma.sql`AND attributes @> ${JSON.stringify(wanted)}::jsonb`
        : Prisma.empty;

    const rows = await this.prisma.$queryRaw<PlaceRow[]>`
      SELECT ${COLUMNS}, ST_Distance(location, ${here}) AS "distanceMeters"
      FROM "Place"
      WHERE status = 'APPROVED'
        AND category = ${q.category}::"PlaceCategory"
        AND ST_DWithin(location, ${here}, ${q.radius}::float8)
        ${attrFilter}
      ORDER BY "distanceMeters"
      LIMIT ${q.limit}`;
    return rows.map(toPlace);
  }

  // Tìm không dấu: khớp chuỗi con (ILIKE) hoặc gần giống (pg_trgm), xếp theo độ giống.
  async search(q: SearchQuery): Promise<Place[]> {
    const text = toSearchText(q.q);
    const like = `%${text.replace(/[\\%_]/g, '\\$&')}%`;
    const hasPoint = q.lat !== undefined && q.lng !== undefined;
    const distance = hasPoint
      ? Prisma.sql`ST_Distance(location, ${point(q.lat!, q.lng!)})`
      : Prisma.sql`NULL::float8`;

    const rows = await this.prisma.$queryRaw<PlaceRow[]>`
      SELECT ${COLUMNS}, ${distance} AS "distanceMeters"
      FROM "Place"
      WHERE status = 'APPROVED'
        AND ("searchName" ILIKE ${like} OR "searchName" % ${text})
      ORDER BY similarity("searchName", ${text}) DESC, "distanceMeters" ASC NULLS LAST
      LIMIT ${q.limit}`;
    return rows.map(toPlace);
  }

  // Quán do chính người dùng đóng góp, mọi trạng thái (kể cả đang chờ duyệt).
  async findMine(userId: string): Promise<Place[]> {
    const rows = await this.prisma.$queryRaw<PlaceRow[]>`
      SELECT ${COLUMNS} FROM "Place"
      WHERE "createdById" = ${userId}::uuid
      ORDER BY "createdAt" DESC
      LIMIT 100`;
    return rows.map(toPlace);
  }

  // Dành cho admin: liệt kê theo trạng thái kiểm duyệt (cũ nhất trước).
  async findByStatus(status: 'PENDING' | 'APPROVED' | 'REJECTED', limit: number): Promise<Place[]> {
    const rows = await this.prisma.$queryRaw<PlaceRow[]>`
      SELECT ${COLUMNS} FROM "Place"
      WHERE status = ${status}::"PlaceStatus"
      ORDER BY "createdAt" ASC
      LIMIT ${limit}`;
    return rows.map(toPlace);
  }

  // Quán đã lưu của người dùng, mới lưu xếp trước. Chỉ trả quán còn được duyệt.
  async findFavorites(userId: string): Promise<Place[]> {
    const rows = await this.prisma.$queryRaw<PlaceRow[]>`
      SELECT ${COLUMNS} FROM "Place"
      WHERE status = 'APPROVED'
        AND id IN (SELECT "placeId" FROM "Favorite" WHERE "userId" = ${userId}::uuid)
      ORDER BY (SELECT f."createdAt" FROM "Favorite" f
                WHERE f."userId" = ${userId}::uuid AND f."placeId" = "Place".id) DESC
      LIMIT 200`;
    return rows.map(toPlace);
  }

  async findOne(id: string): Promise<Place> {
    const rows = await this.prisma.$queryRaw<PlaceRow[]>`
      SELECT ${COLUMNS} FROM "Place" WHERE id = ${id}::uuid AND status = 'APPROVED'`;
    if (!rows[0]) throw new NotFoundException('Không tìm thấy địa điểm');
    return toPlace(rows[0]);
  }

  async create(input: CreatePlaceInput, user: AuthUser): Promise<Place> {
    if (!isInServiceArea(input.lat, input.lng)) {
      throw new BadRequestException('Vị trí nằm ngoài khu vực phục vụ (TP.HCM)');
    }

    const searchName = toSearchText(input.name);
    const here = point(input.lat, input.lng);

    const duplicate = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM "Place"
      WHERE "searchName" = ${searchName}
        AND status <> 'REJECTED'
        AND ST_DWithin(location, ${here}, ${DUPLICATE_RADIUS_M}::float8)
      LIMIT 1`;
    if (duplicate.length > 0) throw new ConflictException('Địa điểm này đã tồn tại');

    // Admin đăng thì duyệt luôn; người dùng thường chờ duyệt. Tra role trong DB thay vì token
    // (token sống 15 phút) để quyền admin vừa được cấp/gỡ có hiệu lực ngay.
    const author = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });
    const status = author?.role === 'ADMIN' ? 'APPROVED' : 'PENDING';

    // Prisma không ghi được cột geography nên dùng SQL thô. id và updatedAt do Prisma
    // (không phải DB) sinh mặc định, nên ở đây phải tự điền.
    const rows = await this.prisma.$queryRaw<PlaceRow[]>`
      INSERT INTO "Place"
        (id, name, "searchName", category, address, district, location, attributes,
         status, source, "createdById", "updatedAt")
      VALUES
        (${randomUUID()}::uuid, ${input.name}, ${searchName}, ${input.category}::"PlaceCategory",
         ${input.address}, ${input.district ?? null}, ${here}, ${JSON.stringify(input.attributes)}::jsonb,
         ${status}::"PlaceStatus", 'USER', ${user.id}::uuid, now())
      RETURNING ${COLUMNS}`;
    return toPlace(rows[0]!);
  }
}
