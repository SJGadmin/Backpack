const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyMigration() {
  console.log('🔍 Database Migration Verification\n');
  console.log('================================\n');

  try {
    // Check row counts
    const counts = {
      users: await prisma.user.count(),
      boards: await prisma.board.count(),
      columns: await prisma.column.count(),
      cards: await prisma.card.count(),
      tasks: await prisma.task.count(),
      comments: await prisma.comment.count(),
      attachments: await prisma.attachment.count(),
    };

    console.log('📊 Current Database Row Counts:');
    console.log(`   Users:       ${counts.users}`);
    console.log(`   Boards:      ${counts.boards}`);
    console.log(`   Columns:     ${counts.columns}`);
    console.log(`   Cards:       ${counts.cards}`);
    console.log(`   Tasks:       ${counts.tasks}`);
    console.log(`   Comments:    ${counts.comments}`);
    console.log(`   Attachments: ${counts.attachments}\n`);

    // Expected counts from CSV files
    const expected = {
      users: 2,
      boards: 1,
      columns: 5,
      cards: 2,
      tasks: 2,
    };

    console.log('✅ Expected vs Actual:');
    let allMatch = true;
    for (const [table, expectedCount] of Object.entries(expected)) {
      const actualCount = counts[table];
      const status = actualCount === expectedCount ? '✅' : '❌';
      console.log(`   ${status} ${table}: expected ${expectedCount}, got ${actualCount}`);
      if (actualCount !== expectedCount) allMatch = false;
    }

    console.log('\n🧪 Running Relationship Tests:\n');

    // Test 1: Check user-card relationship
    const usersWithCards = await prisma.user.findMany({
      include: {
        cardsCreated: true,
      },
    });
    console.log('✅ Test 1: User-Card Relationship');
    usersWithCards.forEach(user => {
      console.log(`   ${user.name}: created ${user.cardsCreated.length} cards`);
    });

    // Test 2: Check board-column-card hierarchy
    const boardHierarchy = await prisma.board.findFirst({
      include: {
        columns: {
          include: {
            cards: true,
          },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });
    console.log('\n✅ Test 2: Board-Column-Card Hierarchy');
    console.log(`   Board: ${boardHierarchy?.name}`);
    if (boardHierarchy) {
      boardHierarchy.columns.forEach(column => {
        console.log(`      → Column: ${column.name} (${column.cards.length} cards)`);
      });
    }

    // Test 3: Check card-task relationship
    const cardsWithDetails = await prisma.card.findMany({
      include: {
        tasks: { orderBy: { orderIndex: 'asc' } },
        createdBy: { select: { name: true } },
        column: { select: { name: true } },
      },
    });
    console.log('\n✅ Test 3: Card-Task Relationship');
    cardsWithDetails.forEach(card => {
      console.log(`   Card: "${card.title}"`);
      console.log(`      Column: ${card.column.name}`);
      console.log(`      Created by: ${card.createdBy.name}`);
      console.log(`      Tasks: ${card.tasks.length}`);
      card.tasks.forEach((task, idx) => {
        const status = task.completed ? '✓' : '○';
        console.log(`         ${status} ${task.text}`);
      });
    });

    // Test 4: Check for orphaned records
    console.log('\n✅ Test 4: Checking for Orphaned Records');
    const orphanedCards = await prisma.card.count({
      where: {
        OR: [
          { column: null },
          { createdBy: null },
        ],
      },
    });
    const orphanedTasks = await prisma.task.count({
      where: {
        OR: [
          { card: null },
          { createdBy: null },
        ],
      },
    });
    console.log(`   Orphaned cards: ${orphanedCards === 0 ? '✅ None' : `❌ ${orphanedCards} found`}`);
    console.log(`   Orphaned tasks: ${orphanedTasks === 0 ? '✅ None' : `❌ ${orphanedTasks} found`}`);

    // Final verdict
    console.log('\n================================');
    if (allMatch && orphanedCards === 0 && orphanedTasks === 0) {
      console.log('🎉 Migration verification PASSED!');
      console.log('   Your database is ready to use.\n');
      process.exit(0);
    } else {
      console.log('⚠️  Migration verification completed with warnings.');
      console.log('   Please review the results above.\n');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Verification failed:', error.message);
    console.error('\nThis could mean:');
    console.error('  - The migration has not been run yet');
    console.error('  - There is a database connection issue');
    console.error('  - The schema does not match the expected structure\n');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyMigration();
