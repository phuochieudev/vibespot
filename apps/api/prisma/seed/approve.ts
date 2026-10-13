// Công cụ cho giai đoạn phát triển: duyệt tất cả quán đang chờ của một người dùng.
//   pnpm --filter @vibespot/api db:approve email@example.com
// (Giao diện/API duyệt dành cho admin sẽ làm ở giai đoạn sau.)
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../src/generated/prisma/client.js';

const email = process.argv[2]?.toLowerCase();
if (!email) {
  console.error('Cách dùng: pnpm --filter @vibespot/api db:approve <email>');
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
try {
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) throw new Error(`Không có người dùng ${email}`);
  const { count } = await prisma.place.updateMany({
    where: { createdById: user.id, status: 'PENDING' },
    data: { status: 'APPROVED' },
  });
  console.log(`Đã duyệt ${count} quán của ${email}`);
} finally {
  await prisma.$disconnect();
}
