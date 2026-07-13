import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET /api/admin/whatsapp/analytics - admin: aggregated click analytics.
export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const now = new Date()

    const startOfToday = new Date(now)
    startOfToday.setHours(0, 0, 0, 0)

    // Rolling windows (last 7 / 30 days) - simple and locale-independent.
    const startOfWeek = new Date(now)
    startOfWeek.setDate(startOfWeek.getDate() - 6)
    startOfWeek.setHours(0, 0, 0, 0)

    const startOfMonth = new Date(now)
    startOfMonth.setDate(startOfMonth.getDate() - 29)
    startOfMonth.setHours(0, 0, 0, 0)

    const [
      total,
      today,
      week,
      month,
      lastClick,
      byDevice,
      topPagesRaw,
    ] = await Promise.all([
      db.whatsAppClick.count(),
      db.whatsAppClick.count({ where: { createdAt: { gte: startOfToday } } }),
      db.whatsAppClick.count({ where: { createdAt: { gte: startOfWeek } } }),
      db.whatsAppClick.count({ where: { createdAt: { gte: startOfMonth } } }),
      db.whatsAppClick.findFirst({ orderBy: { createdAt: 'desc' } }),
      db.whatsAppClick.groupBy({ by: ['device'], _count: { _all: true } }),
      db.whatsAppClick.groupBy({
        by: ['page'],
        _count: { _all: true },
        orderBy: { _count: { page: 'desc' } },
        take: 10,
      }),
    ])

    const devices = { mobile: 0, desktop: 0 }
    for (const d of byDevice) {
      if (d.device === 'mobile') devices.mobile = d._count._all
      else if (d.device === 'desktop') devices.desktop = d._count._all
    }

    const topPages = topPagesRaw.map((p) => ({
      page: p.page ?? 'unknown',
      count: p._count._all,
    }))

    return NextResponse.json({
      analytics: {
        total,
        today,
        week,
        month,
        lastClickedAt: lastClick?.createdAt ?? null,
        devices,
        topPages,
      },
    })
  } catch (error) {
    console.error('Error fetching WhatsApp analytics:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
