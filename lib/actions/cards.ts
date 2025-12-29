'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from './auth';

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
}

function extractPlainText(description: string | null): string {
  if (!description) return '';

  try {
    const json = JSON.parse(description);
    let text = '';

    const extractText = (node: any): void => {
      if (node.text) {
        text += node.text + ' ';
      }
      if (node.content && Array.isArray(node.content)) {
        node.content.forEach(extractText);
      }
    };

    extractText(json);
    return text.trim();
  } catch {
    return stripHtml(description);
  }
}

export async function createCard(columnId: string, title: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  // Get max order index in column
  const maxCard = await prisma.card.findFirst({
    where: { columnId },
    orderBy: { orderIndex: 'desc' },
  });

  const card = await prisma.card.create({
    data: {
      columnId,
      title,
      createdById: user.id,
      orderIndex: (maxCard?.orderIndex ?? -1) + 1,
    },
    include: {
      createdBy: {
        select: { id: true, name: true, email: true },
      },
      tasks: true,
      comments: true,
      attachments: true,
    },
  });

  revalidatePath('/board');
  return card;
}

export async function updateCard(
  cardId: string,
  data: {
    title?: string;
    description?: string;
    dueDate?: Date | null;
  }
) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const descriptionPlain = data.description ? extractPlainText(data.description) : undefined;

  const card = await prisma.card.update({
    where: { id: cardId },
    data: {
      ...data,
      descriptionPlain,
    },
    include: {
      createdBy: {
        select: { id: true, name: true, email: true },
      },
      tasks: {
        include: {
          assignedTo: {
            select: { id: true, name: true, email: true },
          },
        },
      },
      comments: {
        include: {
          createdBy: {
            select: { id: true, name: true, email: true },
          },
        },
      },
      attachments: true,
    },
  });

  revalidatePath('/board');
  return card;
}

export async function deleteCard(cardId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  await prisma.card.delete({
    where: { id: cardId },
  });

  revalidatePath('/board');
}

export async function moveCard(
  cardId: string,
  destinationColumnId: string,
  newIndex: number
) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const card = await prisma.card.findUnique({
    where: { id: cardId },
  });

  if (!card) throw new Error('Card not found');

  // If moving to a different column
  if (card.columnId !== destinationColumnId) {
    // Get cards in destination column
    const destinationCards = await prisma.card.findMany({
      where: { columnId: destinationColumnId },
      orderBy: { orderIndex: 'asc' },
    });

    // Update all cards in destination column
    await prisma.$transaction([
      // Update the moved card
      prisma.card.update({
        where: { id: cardId },
        data: {
          columnId: destinationColumnId,
          orderIndex: newIndex,
        },
      }),
      // Update cards that come after the insertion point
      ...destinationCards
        .filter((c: { id: string; orderIndex: number }) => c.orderIndex >= newIndex)
        .map((c: { id: string; orderIndex: number }) =>
          prisma.card.update({
            where: { id: c.id },
            data: { orderIndex: c.orderIndex + 1 },
          })
        ),
    ]);
  } else {
    // Reordering within the same column
    const cards = await prisma.card.findMany({
      where: { columnId: card.columnId },
      orderBy: { orderIndex: 'asc' },
    });

    const oldIndex = cards.findIndex((c: { id: string }) => c.id === cardId);
    if (oldIndex === -1) throw new Error('Card not found in column');

    const reorderedCards = [...cards];
    const [movedCard] = reorderedCards.splice(oldIndex, 1);
    reorderedCards.splice(newIndex, 0, movedCard);

    await prisma.$transaction(
      reorderedCards.map((c: { id: string }, index: number) =>
        prisma.card.update({
          where: { id: c.id },
          data: { orderIndex: index },
        })
      )
    );
  }

  revalidatePath('/board');
}

export async function getCard(cardId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const card = await prisma.card.findUnique({
    where: { id: cardId },
    include: {
      createdBy: {
        select: { id: true, name: true, email: true },
      },
      tasks: {
        orderBy: { orderIndex: 'asc' },
        include: {
          createdBy: {
            select: { id: true, name: true, email: true },
          },
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
  });

  return card;
}

export async function searchCards(query: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const cards = await prisma.card.findMany({
    where: {
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { descriptionPlain: { contains: query, mode: 'insensitive' } },
        {
          comments: {
            some: {
              textPlain: { contains: query, mode: 'insensitive' },
            },
          },
        },
      ],
    },
    include: {
      column: true,
      createdBy: {
        select: { id: true, name: true, email: true },
      },
      tasks: true,
      comments: true,
      attachments: true,
    },
    orderBy: { updatedAt: 'desc' },
  });

  return cards;
}
