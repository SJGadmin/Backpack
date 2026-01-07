import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  accelerateUrl: process.env.PRISMA_DATABASE_URL,
  log: ['query', 'info', 'warn', 'error'],
});

async function createFreshBoard() {
  console.log('🎯 Creating fresh board with columns...\n');

  try {
    // Check if users exist
    const users = await prisma.user.findMany();
    if (users.length === 0) {
      console.log('⚠️  No users found. Please create users first.');
      return;
    }

    console.log(`Found ${users.length} users:`);
    users.forEach(u => console.log(`  - ${u.name} (${u.email})`));
    console.log();

    // Create main board
    console.log('1. Creating main board...');
    const board = await prisma.board.create({
      data: {
        name: 'Project Board',
        description: 'Main project management board',
      },
    });
    console.log(`   ✅ Created board: ${board.name} (ID: ${board.id})`);
    console.log();

    // Create default columns
    console.log('2. Creating default columns...');
    const columns = [
      { name: 'Backlog', orderIndex: 0 },
      { name: 'To Do', orderIndex: 1 },
      { name: 'In Progress', orderIndex: 2 },
      { name: 'Review', orderIndex: 3 },
      { name: 'Done', orderIndex: 4 },
    ];

    for (const col of columns) {
      const column = await prisma.column.create({
        data: {
          boardId: board.id,
          name: col.name,
          orderIndex: col.orderIndex,
        },
      });
      console.log(`   ✅ Created column: ${column.name}`);
    }

    console.log('\n✅ Fresh board created successfully!');
    console.log('\n📊 Database summary:');

    const counts = {
      users: await prisma.user.count(),
      boards: await prisma.board.count(),
      columns: await prisma.column.count(),
      cards: await prisma.card.count(),
      tasks: await prisma.task.count(),
    };

    console.log(`   - Users: ${counts.users}`);
    console.log(`   - Boards: ${counts.boards}`);
    console.log(`   - Columns: ${counts.columns}`);
    console.log(`   - Cards: ${counts.cards}`);
    console.log(`   - Tasks: ${counts.tasks}`);

    console.log('\n🚀 Board is ready! You can now access http://localhost:3001/board');

  } catch (error) {
    console.error('❌ Failed to create board:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createFreshBoard();
