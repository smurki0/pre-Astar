import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { validateZonePayload } from '@/lib/shipping';

// PUT /api/admin/shipping-zones/[id] - Update a shipping zone (admin)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await db.shippingZone.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Shipping zone not found' }, { status: 404 });
    }

    const result = validateZonePayload(body);
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Prevent duplicate names against OTHER zones (case-insensitive).
    const others = await db.shippingZone.findMany({
      where: { id: { not: id } },
      select: { name: true },
    });
    const isDuplicate = others.some(
      (z) => z.name.trim().toLowerCase() === result.data.name.toLowerCase()
    );
    if (isDuplicate) {
      return NextResponse.json(
        { error: 'توجد منطقة شحن بنفس الاسم بالفعل' },
        { status: 409 }
      );
    }

    const zone = await db.shippingZone.update({ where: { id }, data: result.data });
    return NextResponse.json({ zone });
  } catch (error) {
    console.error('Error updating shipping zone:', error);
    return NextResponse.json(
      { error: 'Failed to update shipping zone' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/shipping-zones/[id] - Delete a shipping zone (admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id } = await params;

    const existing = await db.shippingZone.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Shipping zone not found' }, { status: 404 });
    }

    // Orders keep a reference to the zone; detach it so historical orders are
    // preserved (shippingZoneName is already stored on the order) while the
    // zone row can be safely removed.
    await db.order.updateMany({
      where: { shippingZoneId: id },
      data: { shippingZoneId: null },
    });

    await db.shippingZone.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Shipping zone deleted successfully' });
  } catch (error) {
    console.error('Error deleting shipping zone:', error);
    return NextResponse.json(
      { error: 'Failed to delete shipping zone' },
      { status: 500 }
    );
  }
}
