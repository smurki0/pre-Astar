import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { normalizeAddress, toUiAddress } from '@/lib/address';

// GET /api/addresses - list the current user's addresses
export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const rows = await db.address.findMany({
      where: { userId: user.id },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
    return NextResponse.json({ addresses: rows.map(toUiAddress) });
  } catch (error) {
    console.error('Error fetching addresses:', error);
    return NextResponse.json({ error: 'Failed to fetch addresses' }, { status: 500 });
  }
}

// POST /api/addresses - create a new address for the current user
export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const result = normalizeAddress(body);
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // First address is always default; if marked default, clear the others.
    const count = await db.address.count({ where: { userId: user.id } });
    const makeDefault = result.data.isDefault || count === 0;
    if (makeDefault) {
      await db.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
    }

    const created = await db.address.create({
      data: { ...result.data, isDefault: makeDefault, userId: user.id, country: 'Egypt' },
    });
    return NextResponse.json({ address: toUiAddress(created) }, { status: 201 });
  } catch (error) {
    console.error('Error creating address:', error);
    return NextResponse.json({ error: 'Failed to create address' }, { status: 500 });
  }
}
