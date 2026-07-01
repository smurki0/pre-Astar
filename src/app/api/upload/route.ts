import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { randomUUID } from 'crypto';
import path from 'path';
import { requireAdmin } from '@/lib/auth';

// This route handles binary uploads, so it must run on the Node.js runtime.
export const runtime = 'nodejs';

// Map allowed MIME types to a safe, server-controlled file extension.
const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'image/x-icon': 'ico',
  'image/vnd.microsoft.icon': 'ico',
};
const ALLOWED_CONTENT_TYPES = Object.keys(ALLOWED_TYPES);

// Whitelist of destination folders to prevent path traversal.
const ALLOWED_FOLDERS = new Set(['general', 'products', 'logos', 'favicons', 'seo', 'banners', 'categories']);

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

function safeFolder(f: unknown): string {
  return typeof f === 'string' && ALLOWED_FOLDERS.has(f) ? f : 'general';
}

// POST /api/upload
// Two modes:
//  1) content-type: application/json  -> Vercel Blob CLIENT upload handshake.
//     The browser streams the file straight to Blob storage (bypassing the
//     serverless 4.5MB request-body limit and the read-only filesystem). This
//     route only signs/authorises the upload.
//  2) multipart/form-data             -> server-side upload. Used for local dev
//     (writes to public/uploads) and as a no-JS fallback.
export async function POST(request: NextRequest) {
  const contentType = request.headers.get('content-type') || '';

  // ---------------------------------------------------------------------
  // Mode 1: Vercel Blob client-upload handshake (production, any file size)
  // ---------------------------------------------------------------------
  if (contentType.includes('application/json')) {
    const { handleUpload } = await import('@vercel/blob/client');
    const body = await request.json();

    try {
      const jsonResponse = await handleUpload({
        request,
        body,
        onBeforeGenerateToken: async (_pathname, clientPayload) => {
          // Only authenticated admins may obtain an upload token.
          const authResult = await requireAdmin(request);
          if (authResult instanceof NextResponse) {
            throw new Error('Unauthorized');
          }
          const folder = safeFolder(clientPayload ? JSON.parse(clientPayload)?.folder : undefined);
          return {
            allowedContentTypes: ALLOWED_CONTENT_TYPES,
            addRandomSuffix: true,
            maximumSizeInBytes: MAX_SIZE,
            tokenPayload: JSON.stringify({ folder }),
          };
        },
        onUploadCompleted: async () => {
          // No-op: the product/banner/etc. record is saved separately by the
          // form once it receives the returned blob URL.
        },
      });
      return NextResponse.json(jsonResponse);
    } catch (error) {
      // handleUpload also transparently processes the
      // "blob.upload-completed" webhook callback from Blob storage.
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Upload authorisation failed' },
        { status: 400 }
      );
    }
  }

  // ---------------------------------------------------------------------
  // Mode 2: multipart server-side upload (local dev / fallback)
  // ---------------------------------------------------------------------
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = safeFolder(formData.get('folder'));

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const extension = ALLOWED_TYPES[file.type];
    if (!extension) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images are allowed (JPEG, PNG, GIF, WEBP)' },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large. Maximum size is 5MB' }, { status: 400 });
    }

    const filename = `${Date.now()}-${randomUUID()}.${extension}`;
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // If a Blob token is configured, upload to Blob even from the multipart path.
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const { put } = await import('@vercel/blob');
      const blob = await put(`${folder}/${filename}`, buffer, {
        access: 'public',
        contentType: file.type,
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
      return NextResponse.json({ success: true, url: blob.url, filename, size: file.size, type: file.type });
    }

    // Local development: write into public/uploads (served statically by dev server).
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', folder);
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }
    await writeFile(path.join(uploadDir, filename), buffer);
    return NextResponse.json({
      success: true,
      url: `/uploads/${folder}/${filename}`,
      filename,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
