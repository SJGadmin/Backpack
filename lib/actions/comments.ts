'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from './auth';
import { extractMentions, sendCommentMentionNotification } from '@/lib/slack';

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
}

export async function createComment(cardId: string, text: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const textPlain = stripHtml(text);

  const comment = await prisma.comment.create({
    data: {
      cardId,
      text,
      textPlain,
      createdById: user.id,
    },
    include: {
      createdBy: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  // Check for mentions and send Slack notifications
  const mentions = await extractMentions(textPlain);
  if (mentions.length > 0) {
    const card = await prisma.card.findUnique({
      where: { id: cardId },
      select: { title: true },
    });

    if (card) {
      for (const mention of mentions) {
        await sendCommentMentionNotification(
          card.title,
          cardId,
          textPlain,
          mention,
          user.name
        );
      }
    }
  }

  revalidatePath('/board');
  return comment;
}

export async function updateComment(commentId: string, text: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const textPlain = stripHtml(text);

  try {
    const comment = await prisma.comment.update({
      where: { id: commentId },
      data: {
        text,
        textPlain,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    revalidatePath('/board');
    return comment;
  } catch (error: any) {
    // If record not found, return null instead of throwing
    if (error.code === 'P2025') {
      console.log(`Comment ${commentId} not found for update`);
      revalidatePath('/board');
      return null;
    }
    throw error;
  }
}

export async function deleteComment(commentId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  try {
    await prisma.comment.delete({
      where: { id: commentId },
    });
  } catch (error: any) {
    // If record not found, it's already deleted - don't throw error
    if (error.code === 'P2025') {
      console.log(`Comment ${commentId} already deleted or doesn't exist`);
      revalidatePath('/board');
      return;
    }
    throw error;
  }

  revalidatePath('/board');
}
