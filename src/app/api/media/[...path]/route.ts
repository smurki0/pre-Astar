import { NextRequest, NextResponse } from 'next/server';

// Serve images that live in a PRIVATE Vercel Blob store.
//
// A private store's blob URLs require authentication, which cannot be used
// directly in <img>/next Image tags on the public storefront. This route
// streams the blob using the server-side token and marks it publicly
// cacheable, so product/banner/etc. images load for every visitor while the
// underlying store stays private. (When the Blob store is public, uploads
// return a direct CDN URL and this route is never used.)
export const runtime = 'nodejs';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return new NextResponse('Blob storage not configured', { status: 404 });
  }

  const { path } = await params;
  const pathname = (path || []).join('/');
  if (!pathname) {
    return new NextResponse('Not found', { status: 404 });
  }

  try {
    const { get } = await import('@vercel/blob');
    const result = await get(pathname, { access: 'private', token });

    if (!result) {
      return new NextResponse('Not found', { status: 404 });
    }
    if (!result.stream) {
      // Not-modified / empty response.
      return new NextResponse(null, { status: 304 });
    }

    // The blob metadata carries the stored MIME type reliably; the raw response
    // headers can be empty. Fall back to the response header, then octet-stream.
    const contentType =
      result.blob?.contentType ||
      result.headers?.get?.('content-type') ||
      'application/octet-stream';

    return new NextResponse(result.stream as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        // Blob keys carry a random suffix, so the content at a path never
        // changes -> cache aggressively at the browser and the CDN.
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return new NextResponse('Not found', { status: 404 });
  }
}
