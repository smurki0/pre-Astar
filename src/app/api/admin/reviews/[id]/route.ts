import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

// PUT - Update review status, feature, or add response
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id } = await params
    const body = await request.json()
    const { 
      status, 
      isFeatured, 
      adminResponse, 
      rejectedReason 
    } = body

    const updateData: any = {}
    
    if (status) {
      updateData.status = status
      if (status === 'rejected' && rejectedReason) {
        updateData.rejectedReason = rejectedReason
      }
    }
    
    if (typeof isFeatured === 'boolean') {
      updateData.isFeatured = isFeatured
    }
    
    if (adminResponse !== undefined) {
      updateData.adminResponse = adminResponse
    }

    const review = await db.review.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          }
        },
        product: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
          }
        }
      }
    })

    return NextResponse.json({ review })
  } catch (error) {
    console.error('Error updating review:', error)
    return NextResponse.json(
      { error: 'Failed to update review' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a review
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id } = await params

    await db.review.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting review:', error)
    return NextResponse.json(
      { error: 'Failed to delete review' },
      { status: 500 }
    )
  }
}
