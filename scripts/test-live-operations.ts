import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  accelerateUrl: process.env.PRISMA_DATABASE_URL,
  log: ['query', 'info', 'warn', 'error'],
});

async function testLiveOperations() {
  console.log('🧪 Testing live database operations...\n');

  try {
    const user = await prisma.user.findFirst();
    if (!user) {
      console.log('❌ No user found');
      return;
    }

    const board = await prisma.board.findFirst({
      include: { columns: true },
    });

    if (!board || board.columns.length === 0) {
      console.log('❌ No board or columns found');
      return;
    }

    const column = board.columns[0];
    console.log(`Using column: ${column.name} (${column.id})`);
    console.log(`Using user: ${user.name} (${user.id})\n`);

    // Test 1: CREATE a card
    console.log('1️⃣ Testing CREATE card...');
    const card = await prisma.card.create({
      data: {
        columnId: column.id,
        title: 'Test Card - ' + new Date().toISOString(),
        createdById: user.id,
        orderIndex: 0,
      },
      include: {
        createdBy: true,
        tasks: true,
      },
    });
    console.log(`   ✅ Created card: ${card.title} (ID: ${card.id})`);
    console.log();

    // Test 2: READ the card
    console.log('2️⃣ Testing READ card...');
    const foundCard = await prisma.card.findUnique({
      where: { id: card.id },
      include: {
        createdBy: true,
        tasks: true,
      },
    });
    console.log(`   ✅ Found card: ${foundCard?.title}`);
    console.log();

    // Test 3: UPDATE the card
    console.log('3️⃣ Testing UPDATE card...');
    const updatedCard = await prisma.card.update({
      where: { id: card.id },
      data: {
        title: 'Updated Test Card - ' + new Date().toISOString(),
        description: '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"This is a test description"}]}]}',
        descriptionPlain: 'This is a test description',
      },
    });
    console.log(`   ✅ Updated card: ${updatedCard.title}`);
    console.log();

    // Test 4: CREATE a task on the card
    console.log('4️⃣ Testing CREATE task...');
    const task = await prisma.task.create({
      data: {
        cardId: card.id,
        text: 'Test task - ' + new Date().toISOString(),
        completed: false,
        createdById: user.id,
        orderIndex: 0,
      },
    });
    console.log(`   ✅ Created task: ${task.text} (ID: ${task.id})`);
    console.log();

    // Test 5: UPDATE the task
    console.log('5️⃣ Testing UPDATE task...');
    const updatedTask = await prisma.task.update({
      where: { id: task.id },
      data: {
        completed: true,
        text: 'Updated test task',
      },
    });
    console.log(`   ✅ Updated task: ${updatedTask.text}, completed: ${updatedTask.completed}`);
    console.log();

    // Test 6: DELETE the task
    console.log('6️⃣ Testing DELETE task...');
    await prisma.task.delete({
      where: { id: task.id },
    });
    console.log(`   ✅ Deleted task ${task.id}`);
    console.log();

    // Test 7: DELETE the card
    console.log('7️⃣ Testing DELETE card...');
    await prisma.card.delete({
      where: { id: card.id },
    });
    console.log(`   ✅ Deleted card ${card.id}`);
    console.log();

    // Test 8: Verify deletion
    console.log('8️⃣ Verifying deletion...');
    const shouldBeNull = await prisma.card.findUnique({
      where: { id: card.id },
    });
    console.log(`   ✅ Card is ${shouldBeNull ? 'still there (BAD)' : 'gone (GOOD)'}`);
    console.log();

    console.log('✅ All live operations working correctly!');
    console.log('\n📊 Final database state:');
    const finalCounts = {
      cards: await prisma.card.count(),
      tasks: await prisma.task.count(),
    };
    console.log(`   - Cards: ${finalCounts.cards}`);
    console.log(`   - Tasks: ${finalCounts.tasks}`);

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testLiveOperations();
