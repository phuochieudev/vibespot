// Cấp quyền ADMIN cho một tài khoản đã đăng ký. Cố ý chỉ làm được qua dòng lệnh trên máy chủ,
// không có API nào tự nâng quyền.
//   pnpm --filter @vibespot/api db:make-admin email@example.com
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../src/generated/prisma/client.js';

const email = process.argv[2]?.toLowerCase();
if (!email) {
  console.error('Cách dùng: pnpm --filter @vibespot/api db:make-admin <email>');
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
try {
  const { count } = await prisma.user.updateMany({ where: { email }, data: { role: 'ADMIN' } });
  if (count === 0) throw new Error(`Không có người dùng ${email}`);
  console.log(`${email} giờ là ADMIN`);
} finally {
  await prisma.$disconnect();
}
