import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';

const prisma = new PrismaClient({
  accelerateUrl: process.env.PRISMA_DATABASE_URL,
});

async function importData() {
  try {
    console.log('Starting data import from CSV files...\n');

    // Import Users
    console.log('1. Importing Users...');
    const usersCSV = readFileSync('prisma-vercel/User_rows.csv', 'utf-8');
    const users = parse(usersCSV, { columns: true, skip_empty_lines: true });

    for (const user of users) {
      await prisma.user.create({
        data: {
          id: user.id,
          email: user.email,
          password: user.password,
          name: user.name,
          createdAt: new Date(user.createdAt),
          updatedAt: new Date(user.updatedAt),
        },
      });
    }
    console.log(`✓ Imported ${users.length} users\n`);

    // Import Boards
    console.log('2. Importing Boards...');
    const boardsCSV = readFileSync('prisma-vercel/Board_rows.csv', 'utf-8');
    const boards = parse(boardsCSV, { columns: true, skip_empty_lines: true });

    for (const board of boards) {
      await prisma.board.create({
        data: {
          id: board.id,
          name: board.name,
          description: board.description || null,
          createdAt: new Date(board.createdAt),
          updatedAt: new Date(board.updatedAt),
        },
      });
    }
    console.log(`✓ Imported ${boards.length} boards\n`);

    // Import Columns
    console.log('3. Importing Columns...');
    const columnsCSV = readFileSync('prisma-vercel/Column_rows.csv', 'utf-8');
    const columns = parse(columnsCSV, { columns: true, skip_empty_lines: true });

    for (const column of columns) {
      await prisma.column.create({
        data: {
          id: column.id,
          boardId: column.boardId,
          name: column.name,
          orderIndex: parseInt(column.orderIndex),
          createdAt: new Date(column.createdAt),
          updatedAt: new Date(column.updatedAt),
        },
      });
    }
    console.log(`✓ Imported ${columns.length} columns\n`);

    // Import Cards
    console.log('4. Importing Cards...');
    const cardsCSV = readFileSync('prisma-vercel/Card_rows.csv', 'utf-8');
    const cards = parse(cardsCSV, { columns: true, skip_empty_lines: true });

    for (const card of cards) {
      await prisma.card.create({
        data: {
          id: card.id,
          columnId: card.columnId,
          title: card.title,
          description: card.description || null,
          descriptionPlain: card.descriptionPlain || null,
          dueDate: card.dueDate ? new Date(card.dueDate) : null,
          orderIndex: parseInt(card.orderIndex),
          createdById: card.createdById,
          createdAt: new Date(card.createdAt),
          updatedAt: new Date(card.updatedAt),
          searchVector: card.searchVector || null,
        },
      });
    }
    console.log(`✓ Imported ${cards.length} cards\n`);

    // Import Tasks
    console.log('5. Importing Tasks...');
    const tasksCSV = readFileSync('prisma-vercel/Task_rows.csv', 'utf-8');
    const tasks = parse(tasksCSV, { columns: true, skip_empty_lines: true });

    for (const task of tasks) {
      await prisma.task.create({
        data: {
          id: task.id,
          cardId: task.cardId,
          text: task.text,
          completed: task.completed === 'true' || task.completed === '1',
          dueDate: task.dueDate ? new Date(task.dueDate) : null,
          assignedToId: task.assignedToId || null,
          createdById: task.createdById,
          orderIndex: parseInt(task.orderIndex),
          createdAt: new Date(task.createdAt),
          updatedAt: new Date(task.updatedAt),
        },
      });
    }
    console.log(`✓ Imported ${tasks.length} tasks\n`);

    console.log('🎉 Data import completed successfully!');

    // Verify counts
    console.log('\nVerifying data:');
    const counts = await Promise.all([
      prisma.user.count(),
      prisma.board.count(),
      prisma.column.count(),
      prisma.card.count(),
      prisma.task.count(),
    ]);

    console.log(`- Users: ${counts[0]}`);
    console.log(`- Boards: ${counts[1]}`);
    console.log(`- Columns: ${counts[2]}`);
    console.log(`- Cards: ${counts[3]}`);
    console.log(`- Tasks: ${counts[4]}`);

  } catch (error) {
    console.error('Error importing data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

importData();
