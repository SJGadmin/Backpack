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

  try {
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
  } catch (error: any) {
    // If record not found, return null instead of throwing
    if (error.code === 'P2025') {
      console.log(`Task ${taskId} not found for update`);
      revalidatePath('/board');
      return null;
    }
    throw error;
  }
}

export async function deleteTask(taskId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  try {
    await prisma.task.delete({
      where: { id: taskId },
    });
  } catch (error: any) {
    // If record not found, it's already deleted - don't throw error
    if (error.code === 'P2025') {
      console.log(`Task ${taskId} already deleted or doesn't exist`);
      revalidatePath('/board');
      return;
    }
    throw error;
  }

  revalidatePath('/board');
}

export async function reorderTasks(cardId: string, taskIds: string[]) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  try {
    // Filter out any tasks that don't exist before attempting to reorder
    const existingTasks = await prisma.task.findMany({
      where: {
        id: { in: taskIds },
        cardId: cardId,
      },
      select: { id: true },
    });

    const existingTaskIds = new Set(existingTasks.map(t => t.id));
    const validTaskIds = taskIds.filter(id => existingTaskIds.has(id));

    if (validTaskIds.length > 0) {
      await prisma.$transaction(
        validTaskIds.map((id, index) =>
          prisma.task.update({
            where: { id },
            data: { orderIndex: index },
          })
        )
      );
    }

    revalidatePath('/board');
  } catch (error: any) {
    console.error('Error reordering tasks:', error);
    revalidatePath('/board');
    throw error;
  }
}
