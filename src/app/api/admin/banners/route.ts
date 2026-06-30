import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';

// GET /api/admin/banners - List all banners
export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { searchParams } = new URL(request.url);
    const position = searchParams.get('position');
    
    const where: Record<string, unknown> = {};
    if (position) {
      where.position = position;
    }
    
    const banners = await db.banner.findMany({
      where,
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });
    
    return NextResponse.json({ banners });
  } catch (error) {
    console.error('Error fetching banners:', error);
    return NextResponse.json(
      { error: 'Failed to fetch banners', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/banners - Create banner
export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const { 
      titleEn, 
      titleAr, 
      subtitleEn, 
      subtitleAr, 
      buttonTextEn,
      buttonTextAr,
      image, 
      link, 
      position, 
      order, 
      startDate, 
      endDate, 
      active 
    } = body;
    
    if (!image) {
      return NextResponse.json(
        { error: 'Image is required' },
        { status: 400 }
      );
    }
    
    const banner = await db.banner.create({
      data: {
        titleEn: titleEn || null,
        titleAr: titleAr || null,
        subtitleEn: subtitleEn || null,
        subtitleAr: subtitleAr || null,
        buttonTextEn: buttonTextEn || null,
        buttonTextAr: buttonTextAr || null,
        image,
        link: link || null,
        position: position || 'hero',
        order: order || 0,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        active: active !== false,
      },
    });
    
    return NextResponse.json(banner);
  } catch (error) {
    console.error('Error creating banner:', error);
    return NextResponse.json(
      { error: 'Failed to create banner', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
