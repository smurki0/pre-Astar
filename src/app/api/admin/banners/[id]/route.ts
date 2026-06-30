import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';

// GET /api/admin/banners/[id] - Get single banner
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id } = await params;
    
    const banner = await db.banner.findUnique({
      where: { id },
    });
    
    if (!banner) {
      return NextResponse.json(
        { error: 'Banner not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(banner);
  } catch (error) {
    console.error('Error fetching banner:', error);
    return NextResponse.json(
      { error: 'Failed to fetch banner', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/banners/[id] - Update banner
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id } = await params;
    const body = await request.json();
    
    const updateData: Record<string, unknown> = {};
    if (body.titleEn !== undefined) updateData.titleEn = body.titleEn;
    if (body.titleAr !== undefined) updateData.titleAr = body.titleAr;
    if (body.subtitleEn !== undefined) updateData.subtitleEn = body.subtitleEn;
    if (body.subtitleAr !== undefined) updateData.subtitleAr = body.subtitleAr;
    if (body.buttonTextEn !== undefined) updateData.buttonTextEn = body.buttonTextEn;
    if (body.buttonTextAr !== undefined) updateData.buttonTextAr = body.buttonTextAr;
    if (body.image !== undefined) updateData.image = body.image;
    if (body.link !== undefined) updateData.link = body.link;
    if (body.position !== undefined) updateData.position = body.position;
    if (body.order !== undefined) updateData.order = body.order;
    if (body.startDate !== undefined) updateData.startDate = body.startDate ? new Date(body.startDate) : null;
    if (body.endDate !== undefined) updateData.endDate = body.endDate ? new Date(body.endDate) : null;
    if (body.active !== undefined) updateData.active = body.active;
    
    const banner = await db.banner.update({
      where: { id },
      data: updateData,
    });
    
    return NextResponse.json(banner);
  } catch (error) {
    console.error('Error updating banner:', error);
    return NextResponse.json(
      { error: 'Failed to update banner', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/banners/[id] - Delete banner
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id } = await params;
    
    await db.banner.delete({
      where: { id },
    });
    
    return NextResponse.json({ success: true, message: 'Banner deleted successfully' });
  } catch (error) {
    console.error('Error deleting banner:', error);
    return NextResponse.json(
      { error: 'Failed to delete banner', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
