import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { normalizeAddress, toUiAddress } from '@/lib/address';

// PUT /api/addresses/[id] - update an address (also handles "set as default")
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const existing = await db.address.findFirst({ where: { id, userId: user.id } });
    if (!existing) return NextResponse.json({ error: 'Address not found' }, { status: 404 });

    const body = await request.json();

    // Lightweight "set default only" call.
    if (body.setDefaultOnly === true) {
      await db.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
      const updated = await db.address.update({ where: { id }, data: { isDefault: true } });
      return NextResponse.json({ address: toUiAddress(updated) });
    }

    const result = normalizeAddress(body);
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const makeDefault = result.data.isDefault;
    if (makeDefault) {
      await db.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
    }

    const updated = await db.address.update({
      where: { id },
      data: { ...result.data, isDefault: makeDefault || existing.isDefault },
    });
    return NextResponse.json({ address: toUiAddress(updated) });
  } catch (error) {
    console.error('Error updating address:', error);
    return NextResponse.json({ error: 'Failed to update address' }, { status: 500 });
  }
}

// DELETE /api/addresses/[id] - delete an address (promotes another to default)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const existing = await db.address.findFirst({ where: { id, userId: user.id } });
    if (!existing) return NextResponse.json({ error: 'Address not found' }, { status: 404 });

    await db.address.delete({ where: { id } });

    // If we removed the default, promote the most recent remaining address.
    if (existing.isDefault) {
      const next = await db.address.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      });
      if (next) {
        await db.address.update({ where: { id: next.id }, data: { isDefault: true } });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting address:', error);
    return NextResponse.json({ error: 'Failed to delete address' }, { status: 500 });
  }
}
