import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  accelerateUrl: process.env.PRISMA_DATABASE_URL,
  log: ['query', 'info', 'warn', 'error'],
});

async function resetDatabase() {
  console.log('🗑️  Resetting database (keeping users)...\n');

  try {
    // Delete in correct order due to foreign keys
    console.log('1. Deleting card custom field values...');
    const deletedCustomFieldValues = await prisma.cardCustomFieldValue.deleteMany({});
    console.log(`   ✓ Deleted ${deletedCustomFieldValues.count} custom field values`);

    console.log('2. Deleting custom fields...');
    const deletedCustomFields = await prisma.cardCustomField.deleteMany({});
    console.log(`   ✓ Deleted ${deletedCustomFields.count} custom fields`);

    console.log('3. Deleting attachments...');
    const deletedAttachments = await prisma.attachment.deleteMany({});
    console.log(`   ✓ Deleted ${deletedAttachments.count} attachments`);

    console.log('4. Deleting comments...');
    const deletedComments = await prisma.comment.deleteMany({});
    console.log(`   ✓ Deleted ${deletedComments.count} comments`);

    console.log('5. Deleting tasks...');
    const deletedTasks = await prisma.task.deleteMany({});
    console.log(`   ✓ Deleted ${deletedTasks.count} tasks`);

    console.log('6. Deleting cards...');
    const deletedCards = await prisma.card.deleteMany({});
    console.log(`   ✓ Deleted ${deletedCards.count} cards`);

    console.log('7. Deleting columns...');
    const deletedColumns = await prisma.column.deleteMany({});
    console.log(`   ✓ Deleted ${deletedColumns.count} columns`);

    console.log('8. Deleting boards...');
    const deletedBoards = await prisma.board.deleteMany({});
    console.log(`   ✓ Deleted ${deletedBoards.count} boards`);

    console.log('\n✅ Database reset complete!');
    console.log('\n📊 Remaining data:');

    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true },
    });
    console.log(`   Users: ${users.length}`);
    users.forEach(u => console.log(`   - ${u.name} (${u.email})`));

    console.log('\n🎯 Database is now clean and ready for fresh data!');

  } catch (error) {
    console.error('❌ Reset failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

resetDatabase();
