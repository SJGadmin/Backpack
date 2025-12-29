'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from './auth';

export async function createTask(
  cardId: string,
  text: string,
  assignedToId?: string,
  dueDate?: Date
) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  // Get max order index
  const maxTask = await prisma.task.findFirst({
    where: { cardId },
    orderBy: { orderIndex: 'desc' },
  });

  const task = await prisma.task.create({
    data: {
      cardId,
      text,
      assignedToId,
      dueDate,
      createdById: user.id,
      orderIndex: (maxTask?.orderIndex ?? -1) + 1,
    },
    include: {
      assignedTo: {
        select: { id: true, name: true, email: true },
      },
      createdBy: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  revalidatePath('/board');
  return task;
}

export async function updateTask(
  taskId: string,
  data: {
    text?: string;
    completed?: boolean;
    assignedToId?: string | null;
    dueDate?: Date | null;
  }
) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const task = await prisma.task.update({
    where: { id: taskId },
    data,
    include: {
      assignedTo: {
        select: { id: true, name: true, email: true },
      },
      createdBy: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  revalidatePath('/board');
  return task;
}

export async function deleteTask(taskId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  await prisma.task.delete({
    where: { id: taskId },
  });

  revalidatePath('/board');
}

export async function reorderTasks(cardId: string, taskIds: string[]) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  await prisma.$transaction(
    taskIds.map((id, index) =>
      prisma.task.update({
        where: { id },
        data: { orderIndex: index },
      })
    )
  );

  revalidatePath('/board');
}
