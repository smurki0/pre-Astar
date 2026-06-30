import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';

// GET /api/admin/orders/[id] - Get single order
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id } = await params;
    
    const order = await db.order.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        items: {
          include: {
            product: { include: { images: { take: 1 } } },
          },
        },
        discountCode: true,
      },
    });
    
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/orders/[id] - Update order status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id } = await params;
    const body = await request.json();
    const { status, paymentStatus, trackingNumber, notes } = body;

    // Load the current order (with items) so we can react to status changes.
    const current = await db.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!current) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;
    if (trackingNumber !== undefined) updateData.trackingNumber = trackingNumber;
    if (notes !== undefined) updateData.notes = notes;

    // Stock reconciliation on cancellation transitions.
    // - Entering "cancelled" from a non-cancelled state  -> restore stock (increment).
    // - Leaving "cancelled" back to an active state       -> re-deduct stock (decrement).
    const wasCancelled = current.status === 'cancelled';
    const willBeCancelled = status === 'cancelled';

    const adjustStock = async (direction: 'increment' | 'decrement') => {
      for (const item of current.items) {
        if (item.variantId) {
          await db.productVariant.update({
            where: { id: item.variantId },
            data: { quantity: { [direction]: item.quantity } },
          }).catch(() => {/* variant may have been removed; ignore */});
        }
        if (item.productId) {
          await db.product.update({
            where: { id: item.productId },
            data: { quantity: { [direction]: item.quantity } },
          }).catch(() => {/* product may have been removed; ignore */});
        }
      }
    };

    if (status && willBeCancelled && !wasCancelled) {
      await adjustStock('increment'); // restore stock to inventory
    } else if (status && !willBeCancelled && wasCancelled) {
      await adjustStock('decrement'); // order reactivated -> take stock again
    }

    const order = await db.order.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: true,
      },
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Failed to update order', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
