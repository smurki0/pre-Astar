import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';

// GET /api/admin/users/[id] - Get single user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id } = await params;
    
    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        role: true,
        isBlocked: true,
        emailVerified: true,
        createdAt: true,
        addresses: {
          orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
        },
        _count: {
          select: {
            orders: true,
            wishlistItems: true,
          },
        },
      },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/users/[id] - Update user (block/unblock, change role)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id } = await params;
    const body = await request.json();
    const { isBlocked, role, name, phone, blockedReason } = body;
    
    const updateData: Record<string, unknown> = {};
    if (isBlocked !== undefined) {
      updateData.isBlocked = isBlocked;
      if (isBlocked) {
        // When blocking, set reason and date
        updateData.blockedReason = blockedReason || 'لم يتم تحديد السبب';
        updateData.blockedAt = new Date();
      } else {
        // When unblocking, clear reason and date
        updateData.blockedReason = null;
        updateData.blockedAt = null;
      }
    }
    if (role) updateData.role = role;
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    
    const user = await db.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        role: true,
        isBlocked: true,
        blockedReason: true,
        blockedAt: true,
        emailVerified: true,
        createdAt: true,
      },
    });
    
    return NextResponse.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[id] - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id } = await params;
    
    // Delete related records first (full cascade)
    await db.order.deleteMany({ where: { userId: id } });
    await db.review.deleteMany({ where: { userId: id } });
    await db.cartItem.deleteMany({ where: { userId: id } });
    await db.wishlistItem.deleteMany({ where: { userId: id } });
    await db.address.deleteMany({ where: { userId: id } });
    
    // Delete user
    await db.user.delete({
      where: { id },
    });
    
    return NextResponse.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
