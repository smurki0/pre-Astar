import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { randomUUID } from 'crypto';
import path from 'path';
import { requireAdmin } from '@/lib/auth';

// Binary uploads must run on the Node.js runtime.
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

// Whitelist of destination folders to prevent path traversal.
const ALLOWED_FOLDERS = new Set(['general', 'products', 'logos', 'favicons', 'seo', 'banners', 'categories']);

// Vercel serverless functions reject request bodies larger than 4.5MB, so we
// cap uploads a little below that to leave room for multipart overhead.
const MAX_SIZE = 4 * 1024 * 1024; // 4MB

function safeFolder(f: unknown): string {
  return typeof f === 'string' && ALLOWED_FOLDERS.has(f) ? f : 'general';
}

// Vercel Blob stores can be created with either "public" or "private" access.
// A public store returns a directly-viewable CDN URL; a private store returns a
// URL that needs authentication, so we serve those through the /api/media proxy.
// We auto-detect the store's mode once and cache it for the lifetime of the
// serverless instance so we don't repeatedly probe with a failing public put.
let cachedStoreMode: 'public' | 'private' | null = null;

async function uploadToBlob(
  key: string,
  buffer: Buffer,
  contentType: string,
  token: string
): Promise<string> {
  const { put } = await import('@vercel/blob');

  // Known-private store: upload private and return a proxy URL.
  if (cachedStoreMode === 'private') {
    const blob = await put(key, buffer, { access: 'private', contentType, token });
    return `/api/media/${blob.pathname}`;
  }

  try {
    const blob = await put(key, buffer, { access: 'public', contentType, token });
    cachedStoreMode = 'public';
    return blob.url;
  } catch (error) {
    const msg = error instanceof Error ? error.message.toLowerCase() : '';
    // "Cannot use public access on a private store" -> retry as private.
    if (msg.includes('private')) {
      cachedStoreMode = 'private';
      const blob = await put(key, buffer, { access: 'private', contentType, token });
      return `/api/media/${blob.pathname}`;
    }
    throw error;
  }
}

// POST /api/upload - Upload an image (admin only).
//
// Storage strategy:
//   - If BLOB_READ_WRITE_TOKEN is set  -> upload to Vercel Blob (works on the
//     read-only serverless filesystem and returns a permanent public URL).
//   - Otherwise (local dev)            -> write into ./public/uploads.
export async function POST(request: NextRequest) {
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
        { error: 'Invalid file type. Only images are allowed (JPEG, PNG, GIF, WEBP, SVG, ICO)' },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 4MB' },
        { status: 400 }
      );
    }

    const filename = `${Date.now()}-${randomUUID()}.${extension}`;
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // --- Production: Vercel Blob (works with public OR private stores) ---
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const url = await uploadToBlob(
        `${folder}/${filename}`,
        buffer,
        file.type,
        process.env.BLOB_READ_WRITE_TOKEN
      );
      return NextResponse.json({
        success: true,
        url,
        filename,
        size: file.size,
        type: file.type,
      });
    }

    // --- On a serverless host without a token, writing to disk will fail.
    //     Return a clear, actionable error instead of a confusing EROFS crash.
    if (process.env.VERCEL) {
      return NextResponse.json(
        {
          error:
            'Image storage is not configured. Add a Vercel Blob store and set BLOB_READ_WRITE_TOKEN in the project Environment Variables, then redeploy.',
        },
        { status: 500 }
      );
    }

    // --- Local development: write into public/uploads (served by the dev server). ---
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
