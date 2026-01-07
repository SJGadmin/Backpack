'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from './auth';
import { uploadFile, deleteFile } from '@/lib/storage';

export async function createAttachment(
  cardId: string,
  formData: FormData
) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const file = formData.get('file') as File;
  if (!file) throw new Error('No file provided');

  // Generate unique file path
  const timestamp = Date.now();
  const fileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const path = `cards/${cardId}/${timestamp}-${fileName}`;

  // Upload to Vercel Blob Storage
  const { url } = await uploadFile(file, path);

  const attachment = await prisma.attachment.create({
    data: {
      cardId,
      fileName: file.name,
      fileUrl: url,
      fileSize: file.size,
      mimeType: file.type,
    },
  });

  revalidatePath('/board');
  return attachment;
}

export async function deleteAttachment(attachmentId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const attachment = await prisma.attachment.findUnique({
    where: { id: attachmentId },
  });

  if (!attachment) {
    console.log(`Attachment ${attachmentId} not found`);
    revalidatePath('/board');
    return;
  }

  // Delete from Vercel Blob Storage
  // Vercel Blob's del() can accept the full URL directly
  try {
    await deleteFile(attachment.fileUrl);
  } catch (error) {
    console.error('Failed to delete file from storage:', error);
  }

  // Delete from database
  try {
    await prisma.attachment.delete({
      where: { id: attachmentId },
    });
  } catch (error: any) {
    // If record not found, it's already deleted - don't throw error
    if (error.code === 'P2025') {
      console.log(`Attachment ${attachmentId} already deleted from database`);
      revalidatePath('/board');
      return;
    }
    throw error;
  }

  revalidatePath('/board');
}
