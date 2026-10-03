// Import quán cà phê TP.HCM từ OpenStreetMap vào bảng Place.
//   pnpm --filter @vibespot/api db:import-osm              (dùng cache nếu có)
//   pnpm --filter @vibespot/api db:import-osm --refresh    (tải lại từ Overpass)
//   pnpm --filter @vibespot/api db:import-osm --dry-run    (chỉ thống kê, không ghi DB)
// Dữ liệu © OpenStreetMap contributors, giấy phép ODbL: https://www.openstreetmap.org/copyright
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Prisma, PrismaClient } from '../../src/generated/prisma/client.js';
import { toPlaceSeeds, type OsmElement, type PlaceSeed } from './osm.js';

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const QUERY = `[out:json][timeout:120];
area["name"="Thành phố Hồ Chí Minh"]["admin_level"="4"]->.a;
nwr["amenity"="cafe"](area.a);
out center tags;`;
const CACHE = join(dirname(fileURLToPath(import.meta.url)), '.cache', 'osm-cafes.json');
const CHUNK = 200;

const args = new Set(process.argv.slice(2));

async function loadElements(): Promise<OsmElement[]> {
  if (!args.has('--refresh') && existsSync(CACHE)) {
    console.log(`Dùng cache: ${CACHE}`);
    return JSON.parse(await readFile(CACHE, 'utf8')) as OsmElement[];
  }
  console.log('Tải dữ liệu từ Overpass API (có thể mất vài chục giây)...');
  const res = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'vibespot-import/0.1 (portfolio project)',
    },
    body: new URLSearchParams({ data: QUERY }),
  });
  if (!res.ok) throw new Error(`Overpass trả về ${res.status} ${res.statusText}`);
  const { elements } = (await res.json()) as { elements: OsmElement[] };
  await mkdir(dirname(CACHE), { recursive: true });
  await writeFile(CACHE, JSON.stringify(elements));
  return elements;
}

function row(p: PlaceSeed) {
  const location = Prisma.sql`ST_SetSRID(ST_MakePoint(${p.lng}::float8, ${p.lat}::float8), 4326)::geography`;
  const hours = p.openingHours ? JSON.stringify(p.openingHours) : null;
  return Prisma.sql`(${randomUUID()}::uuid, ${p.name}, ${p.searchName}, 'CAFE'::"PlaceCategory",
    ${p.address}, ${p.district}, ${location}, ${JSON.stringify(p.attributes)}::jsonb,
    ${hours}::jsonb, 'APPROVED'::"PlaceStatus", 'OSM'::"PlaceSource", ${p.osmId}, now())`;
}

async function main() {
  const seeds = toPlaceSeeds(await loadElements());
  console.log(`Địa điểm hợp lệ: ${seeds.length}`);
  if (args.has('--dry-run')) return;

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });
  try {
    for (let i = 0; i < seeds.length; i += CHUNK) {
      const chunk = seeds.slice(i, i + CHUNK);
      // Chạy lại nhiều lần vẫn an toàn: trùng osmId thì cập nhật. Thuộc tính do người dùng
      // đóng góp (vd. wifiMbps) được giữ lại vì `||` chỉ ghi đè các khoá có trong dữ liệu OSM.
      await prisma.$executeRaw`
        INSERT INTO "Place"
          (id, name, "searchName", category, address, district, location, attributes,
           "openingHours", status, source, "osmId", "updatedAt")
        VALUES ${Prisma.join(chunk.map(row))}
        ON CONFLICT ("osmId") DO UPDATE SET
          name = EXCLUDED.name, "searchName" = EXCLUDED."searchName", address = EXCLUDED.address,
          district = EXCLUDED.district, location = EXCLUDED.location,
          attributes = "Place".attributes || EXCLUDED.attributes,
          "openingHours" = EXCLUDED."openingHours", "updatedAt" = now()`;
      console.log(`  ${Math.min(i + CHUNK, seeds.length)}/${seeds.length}`);
    }
    const [{ n }] = await prisma.$queryRaw<{ n: number }[]>`
      SELECT count(*)::int AS n FROM "Place" WHERE source = 'OSM'`;
    console.log(`Xong. Tổng số địa điểm từ OSM trong DB: ${n}`);
  } finally {
    await prisma.$disconnect();
  }
}

await main();
