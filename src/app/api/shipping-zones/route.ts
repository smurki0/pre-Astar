import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET /api/shipping-zones - Public list of ACTIVE shipping zones for checkout.
// Only exposes fields the storefront needs (no internal metadata).
export async function GET() {
  try {
    const zones = await db.shippingZone.findMany({
      where: { active: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        name: true,
        cost: true,
        freeShippingMin: true,
        estimatedDays: true,
      },
    });
    return NextResponse.json({ zones });
  } catch (error) {
    console.error('Error fetching public shipping zones:', error);
    // Fail gracefully so checkout never breaks because of a shipping lookup.
    return NextResponse.json({ zones: [] });
  }
}
