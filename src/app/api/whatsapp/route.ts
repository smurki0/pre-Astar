import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import {
  WHATSAPP_SETTINGS_KEY,
  defaultWhatsAppSettings,
  parseWhatsAppSettings,
} from '@/lib/whatsapp'

// The storefront reads this on every page load, so keep it cheap. It is a
// single indexed row lookup. A short shared-cache TTL keeps repeated visitors
// off the DB while `stale-while-revalidate` avoids a latency spike on expiry.
// The client also refetches with `cache: 'no-store'` right after an admin save
// (via the settings-updated event), so edits still appear immediately.
export const dynamic = 'force-dynamic'

// GET /api/whatsapp - public: current WhatsApp button configuration
export async function GET() {
  try {
    const row = await db.setting.findUnique({
      where: { key: WHATSAPP_SETTINGS_KEY },
    })
    const settings = parseWhatsAppSettings(row?.value ?? null)

    return NextResponse.json(
      { settings },
      {
        headers: {
          'Cache-Control': 'public, max-age=0, s-maxage=15, stale-while-revalidate=60',
        },
      },
    )
  } catch (error) {
    console.error('Error fetching WhatsApp settings:', error)
    // Never break the storefront: fall back to disabled defaults.
    return NextResponse.json({ settings: defaultWhatsAppSettings })
  }
}
