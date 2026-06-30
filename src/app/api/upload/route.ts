import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { randomUUID } from 'crypto';
import path from 'path';
import { requireAdmin } from '@/lib/auth';

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

// POST /api/upload - Upload image (admin only)
export async function POST(request: NextRequest) {
  // Require an authenticated admin
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const requestedFolder = (formData.get('folder') as string) || 'general';
    const folder = ALLOWED_FOLDERS.has(requestedFolder) ? requestedFolder : 'general';
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    // Validate file type and derive a safe extension from the MIME type
    const extension = ALLOWED_TYPES[file.type];
    if (!extension) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images are allowed (JPEG, PNG, GIF, WEBP)' },
        { status: 400 }
      );
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB' },
        { status: 400 }
      );
    }
    
    // Create upload directory (folder is from a fixed whitelist, no traversal possible)
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', folder);
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }
    
    // Generate unique filename with a server-controlled extension
    const filename = `${Date.now()}-${randomUUID()}.${extension}`;
    const filepath = path.join(uploadDir, filename);
    
    // Write file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);
    
    // Return public URL
    const publicUrl = `/uploads/${folder}/${filename}`;
    
    return NextResponse.json({
      success: true,
      url: publicUrl,
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
