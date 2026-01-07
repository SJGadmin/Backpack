const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

const prisma = new PrismaClient();

// Helper function to parse CSV file
function parseCSV(filePath) {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  return parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    cast: (value, context) => {
      // Handle empty strings
      if (value === '') return null;

      // Handle booleans
      if (value === 'true') return true;
      if (value === 'false') return false;

      // Return as-is for other values
      return value;
    }
  });
}

// Helper function to convert string dates to Date objects
function parseDate(dateString) {
  if (!dateString) return null;
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
}

async function main() {
  console.log('🚀 Starting database migration and data import...\n');

  const csvDir = path.join(__dirname, '..', 'prisma-vercel');

  // Step 1: Import Users
  console.log('📥 Importing Users...');
  try {
    const users = parseCSV(path.join(csvDir, 'User_rows.csv'));
    for (const user of users) {
      await prisma.user.create({
        data: {
          id: user.id,
          email: user.email,
          password: user.password,
          name: user.name,
          createdAt: parseDate(user.createdAt),
          updatedAt: parseDate(user.updatedAt),
        },
      });
    }
    console.log(`✅ Imported ${users.length} users\n`);
  } catch (error) {
    console.error('❌ Error importing users:', error.message);
    throw error;
  }

  // Step 2: Import Boards
  console.log('📥 Importing Boards...');
  try {
    const boards = parseCSV(path.join(csvDir, 'Board_rows.csv'));
    for (const board of boards) {
      await prisma.board.create({
        data: {
          id: board.id,
          name: board.name,
          description: board.description,
          createdAt: parseDate(board.createdAt),
          updatedAt: parseDate(board.updatedAt),
        },
      });
    }
    console.log(`✅ Imported ${boards.length} boards\n`);
  } catch (error) {
    console.error('❌ Error importing boards:', error.message);
    throw error;
  }

  // Step 3: Import Columns
  console.log('📥 Importing Columns...');
  try {
    const columns = parseCSV(path.join(csvDir, 'Column_rows.csv'));
    for (const column of columns) {
      await prisma.column.create({
        data: {
          id: column.id,
          boardId: column.boardId,
          name: column.name,
          orderIndex: parseInt(column.orderIndex),
          createdAt: parseDate(column.createdAt),
          updatedAt: parseDate(column.updatedAt),
        },
      });
    }
    console.log(`✅ Imported ${columns.length} columns\n`);
  } catch (error) {
    console.error('❌ Error importing columns:', error.message);
    throw error;
  }

  // Step 4: Import Cards
  console.log('📥 Importing Cards...');
  try {
    const cards = parseCSV(path.join(csvDir, 'Card_rows.csv'));
    for (const card of cards) {
      await prisma.card.create({
        data: {
          id: card.id,
          columnId: card.columnId,
          title: card.title,
          description: card.description,
          descriptionPlain: card.descriptionPlain,
          dueDate: parseDate(card.dueDate),
          orderIndex: parseInt(card.orderIndex),
          createdById: card.createdById,
          createdAt: parseDate(card.createdAt),
          updatedAt: parseDate(card.updatedAt),
          searchVector: card.searchVector,
        },
      });
    }
    console.log(`✅ Imported ${cards.length} cards\n`);
  } catch (error) {
    console.error('❌ Error importing cards:', error.message);
    throw error;
  }

  // Step 5: Import Tasks
  console.log('📥 Importing Tasks...');
  try {
    const tasks = parseCSV(path.join(csvDir, 'Task_rows.csv'));
    for (const task of tasks) {
      await prisma.task.create({
        data: {
          id: task.id,
          cardId: task.cardId,
          text: task.text,
          completed: task.completed === 'true' || task.completed === true,
          dueDate: parseDate(task.dueDate),
          assignedToId: task.assignedToId,
          createdById: task.createdById,
          orderIndex: parseInt(task.orderIndex),
          createdAt: parseDate(task.createdAt),
          updatedAt: parseDate(task.updatedAt),
        },
      });
    }
    console.log(`✅ Imported ${tasks.length} tasks\n`);
  } catch (error) {
    console.error('❌ Error importing tasks:', error.message);
    throw error;
  }

  // Step 6: Verify data import with row counts
  console.log('🔍 Verifying data import...\n');
  const counts = {
    users: await prisma.user.count(),
    boards: await prisma.board.count(),
    columns: await prisma.column.count(),
    cards: await prisma.card.count(),
    tasks: await prisma.task.count(),
  };

  console.log('📊 Database Row Counts:');
  console.log(`   Users:   ${counts.users}`);
  console.log(`   Boards:  ${counts.boards}`);
  console.log(`   Columns: ${counts.columns}`);
  console.log(`   Cards:   ${counts.cards}`);
  console.log(`   Tasks:   ${counts.tasks}\n`);

  // Step 7: Test basic queries
  console.log('🧪 Testing basic queries...\n');

  // Test 1: Fetch all users
  const allUsers = await prisma.user.findMany({
    select: { id: true, name: true, email: true }
  });
  console.log('✅ Query Test 1: Fetched all users');
  console.log('   Users:', allUsers);

  // Test 2: Fetch board with columns
  const boardWithColumns = await prisma.board.findFirst({
    include: {
      columns: {
        orderBy: { orderIndex: 'asc' }
      }
    }
  });
  console.log('\n✅ Query Test 2: Fetched board with columns');
  console.log('   Board:', boardWithColumns?.name);
  console.log('   Columns:', boardWithColumns?.columns.map(c => c.name).join(', '));

  // Test 3: Fetch cards with tasks
  const cardsWithTasks = await prisma.card.findMany({
    include: {
      tasks: true,
      createdBy: { select: { name: true } }
    }
  });
  console.log('\n✅ Query Test 3: Fetched cards with tasks');
  cardsWithTasks.forEach(card => {
    console.log(`   Card: "${card.title}" by ${card.createdBy.name} - ${card.tasks.length} tasks`);
  });

  console.log('\n🎉 Migration and import completed successfully!');
}

main()
  .catch((e) => {
    console.error('\n❌ Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
