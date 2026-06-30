import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// Public endpoint for frontend banners (no admin auth required)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const position = searchParams.get('position') || 'hero'
    
    const banners = await db.banner.findMany({
      where: {
        active: true,
        position,
        // Scheduling window: show when started (or no start) AND not expired (or no end).
        // Previously this required startDate to be exactly null, which permanently
        // hid every banner that had a scheduled start date.
        AND: [
          { OR: [{ startDate: null }, { startDate: { lte: new Date() } }] },
          { OR: [{ endDate: null }, { endDate: { gte: new Date() } }] },
        ],
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        titleEn: true,
        titleAr: true,
        subtitleEn: true,
        subtitleAr: true,
        image: true,
        link: true,
        buttonTextEn: true,
        buttonTextAr: true,
        active: true,
      }
    })
    
    return NextResponse.json({ banners })
  } catch (error) {
    console.error('Public banners fetch error:', error)
    return NextResponse.json({ banners: [], error: 'Failed to fetch banners' }, { status: 500 })
  }
}

