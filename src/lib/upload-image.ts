'use client'

/**
 * Uploads a single image and returns its public URL.
 *
 * Two strategies, chosen at build time via NEXT_PUBLIC_BLOB_UPLOAD:
 *  - "1"  -> Vercel Blob CLIENT upload: the browser streams the file directly
 *           to Blob storage. This bypasses Vercel's 4.5MB serverless request
 *           body limit and works on the read-only serverless filesystem.
 *  - else -> multipart POST to /api/upload (local dev / self-hosted).
 *
 * Both paths hit the SAME /api/upload route, which authorises the request as
 * an admin, so the storefront cannot upload.
 */
import { csrfFetch } from '@/lib/csrf-fetch'

export async function uploadImage(file: File, folder: string): Promise<string> {
  if (process.env.NEXT_PUBLIC_BLOB_UPLOAD === '1') {
    // Direct browser -> Blob upload (production on Vercel).
    const { upload } = await import('@vercel/blob/client')
    const blob = await upload(`${folder}/${file.name}`, file, {
      access: 'public',
      handleUploadUrl: '/api/upload',
      contentType: file.type,
      clientPayload: JSON.stringify({ folder }),
    })
    return blob.url
  }

  // Multipart server upload (local dev / fallback).
  const formData = new FormData()
  formData.append('file', file)
  formData.append('folder', folder)

  const response = await csrfFetch('/api/upload', { method: 'POST', body: formData })
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data?.error || data?.details || 'Failed to upload file')
  }
  return data.url as string
}
