'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from './auth';

export async function getBoard() {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const board = await prisma.board.findFirst({
    include: {
      columns: {
        orderBy: { orderIndex: 'asc' },
        include: {
          cards: {
            orderBy: { orderIndex: 'asc' },
            include: {
              createdBy: {
                select: { id: true, name: true, email: true },
              },
              tasks: {
                orderBy: { orderIndex: 'asc' },
                include: {
                  assignedTo: {
                    select: { id: true, name: true, email: true },
                  },
                },
              },
              comments: {
                orderBy: { createdAt: 'desc' },
                include: {
                  createdBy: {
                    select: { id: true, name: true, email: true },
                  },
                },
              },
              attachments: {
                orderBy: { createdAt: 'desc' },
              },
            },
          },
        },
      },
    },
  });

  return board;
}

export async function createColumn(boardId: string, name: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  // Get max order index
  const maxColumn = await prisma.column.findFirst({
    where: { boardId },
    orderBy: { orderIndex: 'desc' },
  });

  const column = await prisma.column.create({
    data: {
      boardId,
      name,
      orderIndex: (maxColumn?.orderIndex ?? -1) + 1,
    },
  });

  revalidatePath('/board');
  return column;
}

export async function updateColumn(columnId: string, name: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const column = await prisma.column.update({
    where: { id: columnId },
    data: { name },
  });

  revalidatePath('/board');
  return column;
}

export async function deleteColumn(columnId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  await prisma.column.delete({
    where: { id: columnId },
  });

  revalidatePath('/board');
}

export async function reorderColumns(boardId: string, columnIds: string[]) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  await prisma.$transaction(
    columnIds.map((id, index) =>
      prisma.column.update({
        where: { id },
        data: { orderIndex: index },
      })
    )
  );

  revalidatePath('/board');
}
