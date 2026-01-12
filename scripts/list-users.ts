import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  accelerateUrl: process.env.PRISMA_DATABASE_URL,
});

async function listUsers() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true },
  });

  console.log('Users in database:');
  users.forEach(u => console.log(`  - ${u.name} (${u.email}) [ID: ${u.id}]`));

  await prisma.$disconnect();
}

listUsers();
