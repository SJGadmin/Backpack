import { put, del } from '@vercel/blob';

// Storage configuration
export const STORAGE_BUCKET = 'attachments'; // Kept for compatibility

/**
 * Upload a file to Vercel Blob storage
 * @param file - The file to upload
 * @param path - The path/pathname for the file in storage
 * @returns Object with path and url properties
 */
export async function uploadFile(file: File, path: string) {
  try {
    const blob = await put(path, file, {
      access: 'public',
      addRandomSuffix: false, // We're generating our own unique paths
    });

    return {
      path: blob.pathname,
      url: blob.url,
    };
  } catch (error) {
    console.error('Failed to upload file to Vercel Blob:', error);
    throw new Error(`File upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Delete a file from Vercel Blob storage
 * @param path - The path/URL of the file to delete
 */
export async function deleteFile(path: string) {
  try {
    // Vercel Blob's del() can accept either a full URL or just the pathname
    await del(path);
  } catch (error) {
    console.error('Failed to delete file from Vercel Blob:', error);
    throw new Error(`File deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get the public URL for a file
 * @param path - The path of the file in storage
 * @returns The public URL string
 *
 * Note: With Vercel Blob, URLs are returned during upload.
 * This function is maintained for API compatibility but assumes
 * the path is already a full URL from Vercel Blob.
 */
export function getPublicUrl(path: string): string {
  // If it's already a full URL (from Vercel Blob), return it
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // If it's just a pathname, construct the URL
  // Note: This is a fallback - in practice, we should always have full URLs
  console.warn('getPublicUrl called with a pathname instead of full URL:', path);
  return path;
}
