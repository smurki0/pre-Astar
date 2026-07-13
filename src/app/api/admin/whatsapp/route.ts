import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import {
  WHATSAPP_SETTINGS_KEY,
  parseWhatsAppSettings,
} from '@/lib/whatsapp'

export const dynamic = 'force-dynamic'

// GET /api/admin/whatsapp - admin: current (validated) WhatsApp button config
export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const row = await db.setting.findUnique({
      where: { key: WHATSAPP_SETTINGS_KEY },
    })
    return NextResponse.json({ settings: parseWhatsAppSettings(row?.value ?? null) })
  } catch (error) {
    console.error('Error fetching WhatsApp settings:', error)
    return NextResponse.json({ error: 'Failed to fetch WhatsApp settings' }, { status: 500 })
  }
}

// POST /api/admin/whatsapp - admin: persist WhatsApp button config
export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const body = await request.json()
    const incoming = body?.settings

    if (!incoming || typeof incoming !== 'object') {
      return NextResponse.json({ error: 'Invalid settings data' }, { status: 400 })
    }

    // Always run the incoming payload through the validator/coercer so only a
    // well-formed, bounded config is ever written to the DB.
    const clean = parseWhatsAppSettings(incoming as Record<string, unknown>)
    const value = JSON.stringify(clean)

    await db.setting.upsert({
      where: { key: WHATSAPP_SETTINGS_KEY },
      create: { key: WHATSAPP_SETTINGS_KEY, value, type: 'json' },
      update: { value, type: 'json' },
    })

    return NextResponse.json({ success: true, settings: clean })
  } catch (error) {
    console.error('Error updating WhatsApp settings:', error)
    return NextResponse.json({ error: 'Failed to update WhatsApp settings' }, { status: 500 })
  }
}
