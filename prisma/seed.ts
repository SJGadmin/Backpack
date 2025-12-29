import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Hash the password
  const password = 'WhoisJane!59';
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create users
  const justin = await prisma.user.upsert({
    where: { email: 'justin@stewartandjane.com' },
    update: {},
    create: {
      email: 'justin@stewartandjane.com',
      password: hashedPassword,
      name: 'Justin',
    },
  });

  const grant = await prisma.user.upsert({
    where: { email: 'grant@stewartandjane.com' },
    update: {},
    create: {
      email: 'grant@stewartandjane.com',
      password: hashedPassword,
      name: 'Grant',
    },
  });

  console.log('Created users:', { justin: justin.email, grant: grant.email });

  // Create the single board
  const board = await prisma.board.upsert({
    where: { id: 'main-board' },
    update: {},
    create: {
      id: 'main-board',
      name: 'Stewart & Jane Group',
      description: 'Project management board for Stewart & Jane',
    },
  });

  console.log('Created board:', board.name);

  // Create default columns
  const columns = [
    { name: 'Backlog', orderIndex: 0 },
    { name: 'Next Up', orderIndex: 1 },
    { name: 'In Progress', orderIndex: 2 },
    { name: 'Waiting', orderIndex: 3 },
    { name: 'Done', orderIndex: 4 },
  ];

  for (const column of columns) {
    await prisma.column.upsert({
      where: {
        id: `${board.id}-${column.name.toLowerCase().replace(/\s+/g, '-')}`
      },
      update: {},
      create: {
        id: `${board.id}-${column.name.toLowerCase().replace(/\s+/g, '-')}`,
        boardId: board.id,
        name: column.name,
        orderIndex: column.orderIndex,
      },
    });
  }

  console.log('Created columns:', columns.map(c => c.name).join(', '));

  // Create a sample card
  const backlogColumn = await prisma.column.findFirst({
    where: {
      boardId: board.id,
      name: 'Backlog',
    },
  });

  if (backlogColumn) {
    await prisma.card.create({
      data: {
        title: 'Welcome to Backpack',
        description: JSON.stringify({
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: 'This is your first project card. Click to edit and add details, tasks, attachments, and comments.',
                },
              ],
            },
          ],
        }),
        descriptionPlain: 'This is your first project card. Click to edit and add details, tasks, attachments, and comments.',
        columnId: backlogColumn.id,
        createdById: justin.id,
        orderIndex: 0,
      },
    });

    console.log('Created sample card');
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
