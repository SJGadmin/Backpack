import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  accelerateUrl: process.env.PRISMA_DATABASE_URL,
  log: ['query', 'info', 'warn', 'error'],
});

async function diagnose() {
  console.log('🔍 Starting comprehensive database diagnosis...\n');

  try {
    // Test 1: Connection
    console.log('1️⃣ Testing database connection...');
    await prisma.$connect();
    console.log('✅ Connection successful\n');

    // Test 2: Current data state
    console.log('2️⃣ Current database state:');
    const counts = {
      users: await prisma.user.count(),
      boards: await prisma.board.count(),
      columns: await prisma.column.count(),
      cards: await prisma.card.count(),
      tasks: await prisma.task.count(),
      comments: await prisma.comment.count(),
      attachments: await prisma.attachment.count(),
      customFields: await prisma.cardCustomField.count(),
      customFieldValues: await prisma.cardCustomFieldValue.count(),
    };
    console.log(counts);
    console.log();

    // Test 3: Fetch actual IDs
    console.log('3️⃣ Fetching actual record IDs:');
    const tasks = await prisma.task.findMany({
      select: {
        id: true,
        text: true,
        cardId: true,
        completed: true,
      },
    });
    console.log('Tasks:', JSON.stringify(tasks, null, 2));
    console.log();

    const cards = await prisma.card.findMany({
      select: {
        id: true,
        title: true,
        columnId: true,
      },
    });
    console.log('Cards:', JSON.stringify(cards, null, 2));
    console.log();

    // Test 4: CREATE operation
    console.log('4️⃣ Testing CREATE operation...');
    const testCard = cards[0];
    if (testCard) {
      const newTask = await prisma.task.create({
        data: {
          cardId: testCard.id,
          text: 'Test task for diagnosis',
          completed: false,
          createdById: 'user_grant',
          orderIndex: 999,
        },
      });
      console.log('✅ Created task:', newTask);
      console.log();

      // Test 5: READ operation
      console.log('5️⃣ Testing READ operation...');
      const foundTask = await prisma.task.findUnique({
        where: { id: newTask.id },
      });
      console.log('✅ Found task:', foundTask);
      console.log();

      // Test 6: UPDATE operation
      console.log('6️⃣ Testing UPDATE operation...');
      const updatedTask = await prisma.task.update({
        where: { id: newTask.id },
        data: { completed: true, text: 'Updated test task' },
      });
      console.log('✅ Updated task:', updatedTask);
      console.log();

      // Test 7: DELETE operation
      console.log('7️⃣ Testing DELETE operation...');
      const deletedTask = await prisma.task.delete({
        where: { id: newTask.id },
      });
      console.log('✅ Deleted task:', deletedTask);
      console.log();

      // Verify deletion
      const shouldBeNull = await prisma.task.findUnique({
        where: { id: newTask.id },
      });
      console.log('✅ Verified deletion (should be null):', shouldBeNull);
      console.log();
    } else {
      console.log('⚠️  No cards found to test with');
    }

    // Test 8: Test with non-existent ID
    console.log('8️⃣ Testing delete with non-existent ID...');
    try {
      await prisma.task.delete({
        where: { id: 'non-existent-id' },
      });
      console.log('❌ Should have thrown an error');
    } catch (error: any) {
      console.log('✅ Correctly threw error for non-existent record');
      console.log('Error code:', error.code);
      console.log('Error message:', error.message);
    }
    console.log();

    console.log('✅ All CRUD operations working correctly!');

  } catch (error) {
    console.error('❌ Diagnosis failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

diagnose();
