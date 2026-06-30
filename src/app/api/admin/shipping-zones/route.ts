import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { validateZonePayload } from '@/lib/shipping';

// GET /api/admin/shipping-zones - List all shipping zones (admin)
export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const zones = await db.shippingZone.findMany({
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });
    return NextResponse.json({ zones });
  } catch (error) {
    console.error('Error fetching shipping zones:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shipping zones' },
      { status: 500 }
    );
  }
}

// POST /api/admin/shipping-zones - Create a shipping zone (admin)
export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const result = validateZonePayload(body);
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Prevent duplicate zone names (case-insensitive).
    const existing = await db.shippingZone.findMany({ select: { name: true } });
    const isDuplicate = existing.some(
      (z) => z.name.trim().toLowerCase() === result.data.name.toLowerCase()
    );
    if (isDuplicate) {
      return NextResponse.json(
        { error: 'توجد منطقة شحن بنفس الاسم بالفعل' },
        { status: 409 }
      );
    }

    const zone = await db.shippingZone.create({ data: result.data });
    return NextResponse.json({ zone }, { status: 201 });
  } catch (error) {
    console.error('Error creating shipping zone:', error);
    return NextResponse.json(
      { error: 'Failed to create shipping zone' },
      { status: 500 }
    );
  }
}
