import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// A tiny, bounded whitelist so a malicious client cannot store arbitrary /
// oversized strings in the analytics table.
const ALLOWED_DEVICES = new Set(['mobile', 'desktop'])
const ALLOWED_PAGES = new Set([
  'home',
  'shop',
  'product',
  'cart',
  'checkout',
  'wishlist',
  'about',
  'contact',
  'login',
  'profile',
  'orders',
  'other',
])

// POST /api/whatsapp/click - public: record a single button click.
// Body: { device?: 'mobile' | 'desktop', page?: string }
export async function POST(request: NextRequest) {
  try {
    let device = 'desktop'
    let page: string | null = null

    try {
      const body = await request.json()
      if (typeof body?.device === 'string' && ALLOWED_DEVICES.has(body.device)) {
        device = body.device
      }
      if (typeof body?.page === 'string') {
        const p = body.page.toLowerCase()
        page = ALLOWED_PAGES.has(p) ? p : 'other'
      }
    } catch {
      // Empty / invalid body -> record a click with defaults.
    }

    await db.whatsAppClick.create({ data: { device, page } })

    // 204-style: nothing to return, keeps the beacon cheap.
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error recording WhatsApp click:', error)
    // A failed analytics write must never surface to the user, so still 204.
    return new NextResponse(null, { status: 204 })
  }
}
