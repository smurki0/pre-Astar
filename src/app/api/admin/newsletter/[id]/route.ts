import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';

// DELETE /api/admin/newsletter/[id] - Delete subscriber
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id } = await params;
    
    await db.newsletterSubscriber.delete({
      where: { id },
    });
    
    return NextResponse.json({ success: true, message: 'Subscriber deleted successfully' });
  } catch (error) {
    console.error('Error deleting subscriber:', error);
    return NextResponse.json(
      { error: 'Failed to delete subscriber', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/newsletter/[id] - Update subscriber status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id } = await params;
    const body = await request.json();
    const { active } = body;
    
    const subscriber = await db.newsletterSubscriber.update({
      where: { id },
      data: { active: active !== undefined ? active : undefined },
    });
    
    return NextResponse.json(subscriber);
  } catch (error) {
    console.error('Error updating subscriber:', error);
    return NextResponse.json(
      { error: 'Failed to update subscriber', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
