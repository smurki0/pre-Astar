'use client'

/**
 * Uploads a single image and returns its public URL.
 *
 * Posts the file (multipart) to /api/upload, which authorises the request as an
 * admin and stores the file in Vercel Blob (production) or ./public/uploads
 * (local dev). Keeping a single server route means uploads need only ONE piece
 * of configuration in production: the BLOB_READ_WRITE_TOKEN environment variable.
 */
import { csrfFetch } from '@/lib/csrf-fetch'

export async function uploadImage(file: File, folder: string): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('folder', folder)

  const response = await csrfFetch('/api/upload', { method: 'POST', body: formData })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data?.error || data?.details || 'Failed to upload file')
  }
  return data.url as string
}
