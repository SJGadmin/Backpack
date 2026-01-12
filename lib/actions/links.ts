'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from './auth';

export async function createLink(cardId: string, url: string, title?: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  // Get max order index
  const maxLink = await prisma.link.findFirst({
    where: { cardId },
    orderBy: { orderIndex: 'desc' },
  });

  const link = await prisma.link.create({
    data: {
      cardId,
      url,
      title: title || url,
      orderIndex: (maxLink?.orderIndex ?? -1) + 1,
    },
  });

  revalidatePath('/board');
  return link;
}

export async function updateLink(
  linkId: string,
  data: {
    url?: string;
    title?: string;
  }
) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const link = await prisma.link.update({
    where: { id: linkId },
    data,
  });

  revalidatePath('/board');
  return link;
}

export async function deleteLink(linkId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  try {
    await prisma.link.delete({
      where: { id: linkId },
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      console.log(`Link ${linkId} already deleted or doesn't exist`);
      revalidatePath('/board');
      return;
    }
    throw error;
  }

  revalidatePath('/board');
}

export async function reorderLinks(cardId: string, linkIds: string[]) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  try {
    const existingLinks = await prisma.link.findMany({
      where: {
        id: { in: linkIds },
        cardId: cardId,
      },
      select: { id: true },
    });

    const existingLinkIds = new Set(existingLinks.map(l => l.id));
    const validLinkIds = linkIds.filter(id => existingLinkIds.has(id));

    if (validLinkIds.length > 0) {
      await prisma.$transaction(
        validLinkIds.map((id, index) =>
          prisma.link.update({
            where: { id },
            data: { orderIndex: index },
          })
        )
      );
    }

    revalidatePath('/board');
  } catch (error: any) {
    console.error('Error reordering links:', error);
    revalidatePath('/board');
    throw error;
  }
}
