'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from './auth';
import { uploadFile, deleteFile } from '@/lib/supabase';

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

  // Upload to Supabase Storage
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

  if (!attachment) throw new Error('Attachment not found');

  // Extract path from URL
  const urlParts = attachment.fileUrl.split('/');
  const bucketIndex = urlParts.findIndex((part: string) => part === process.env.SUPABASE_STORAGE_BUCKET || part === 'attachments');
  const path = urlParts.slice(bucketIndex + 1).join('/');

  // Delete from Supabase Storage
  try {
    await deleteFile(path);
  } catch (error) {
    console.error('Failed to delete file from storage:', error);
  }

  // Delete from database
  await prisma.attachment.delete({
    where: { id: attachmentId },
  });

  revalidatePath('/board');
}
