import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  accelerateUrl: process.env.PRISMA_DATABASE_URL,
});

async function testDatabase() {
  try {
    console.log('Testing Vercel Postgres database connection...\n');

    // Test 1: Count records
    console.log('📊 Counting records:');
    const userCount = await prisma.user.count();
    const boardCount = await prisma.board.count();
    const columnCount = await prisma.column.count();
    const cardCount = await prisma.card.count();
    const taskCount = await prisma.task.count();

    console.log(`✓ Users: ${userCount}`);
    console.log(`✓ Boards: ${boardCount}`);
    console.log(`✓ Columns: ${columnCount}`);
    console.log(`✓ Cards: ${cardCount}`);
    console.log(`✓ Tasks: ${taskCount}\n`);

    // Test 2: Fetch sample data
    console.log('📋 Fetching sample data:');
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true },
    });
    console.log('Users:', users);

    const boards = await prisma.board.findMany({
      include: {
        columns: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });
    console.log('\nBoards with columns:', JSON.stringify(boards, null, 2));

    // Test 3: Test relationships
    console.log('\n🔗 Testing relationships:');
    const cardsWithRelations = await prisma.card.findMany({
      include: {
        createdBy: { select: { name: true } },
        tasks: { select: { text: true, completed: true } },
        column: { select: { name: true } },
      },
    });
    console.log('Cards with relations:', JSON.stringify(cardsWithRelations, null, 2));

    console.log('\n✅ All database tests passed!');
    console.log('🎉 Vercel Postgres migration successful!');

  } catch (error) {
    console.error('❌ Database test failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();
