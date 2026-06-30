import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';

// GET /api/admin/discounts/[id] - Get single discount
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id } = await params;
    
    const discount = await db.discountCode.findUnique({
      where: { id },
    });
    
    if (!discount) {
      return NextResponse.json(
        { error: 'Discount not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(discount);
  } catch (error) {
    console.error('Error fetching discount:', error);
    return NextResponse.json(
      { error: 'Failed to fetch discount', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/discounts/[id] - Update discount
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id } = await params;
    const body = await request.json();
    const { code, type, value, minOrder, maxDiscount, usageLimit, startDate, endDate, active } = body;
    
    // Check if code already exists for another discount
    if (code) {
      const existing = await db.discountCode.findFirst({
        where: {
          code: code.toUpperCase(),
          NOT: { id },
        },
      });
      
      if (existing) {
        return NextResponse.json(
          { error: 'Discount code already exists' },
          { status: 400 }
        );
      }
    }
    
    const updateData: Record<string, unknown> = {};
    if (code) updateData.code = code.toUpperCase();
    if (type) updateData.type = type;
    if (value !== undefined) updateData.value = parseFloat(value);
    if (minOrder !== undefined) updateData.minOrder = minOrder ? parseFloat(minOrder) : null;
    if (maxDiscount !== undefined) updateData.maxDiscount = maxDiscount ? parseFloat(maxDiscount) : null;
    if (usageLimit !== undefined) updateData.usageLimit = usageLimit ? parseInt(usageLimit) : null;
    if (startDate) updateData.startDate = new Date(startDate);
    if (endDate) updateData.endDate = new Date(endDate);
    if (active !== undefined) updateData.active = active;
    
    const discount = await db.discountCode.update({
      where: { id },
      data: updateData,
    });
    
    return NextResponse.json(discount);
  } catch (error) {
    console.error('Error updating discount:', error);
    return NextResponse.json(
      { error: 'Failed to update discount', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/discounts/[id] - Delete discount
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id } = await params;
    
    await db.discountCode.delete({
      where: { id },
    });
    
    return NextResponse.json({ success: true, message: 'Discount deleted successfully' });
  } catch (error) {
    console.error('Error deleting discount:', error);
    return NextResponse.json(
      { error: 'Failed to delete discount', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
