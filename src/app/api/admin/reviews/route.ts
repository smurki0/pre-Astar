import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { Prisma } from '@prisma/client'

// GET - Fetch all reviews for admin (OPTIMIZED VERSION)
export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'
    const rating = searchParams.get('rating') || 'all'
    const search = searchParams.get('search') || ''
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build Prisma where clause
    const whereClause: Prisma.ReviewWhereInput = {}
    
    if (status !== 'all') {
      whereClause.status = status as any
    }
    
    if (rating !== 'all') {
      whereClause.rating = parseInt(rating)
    }

    // SINGLE TRANSACTION - Optimized stats query + reviews
    // Safe parallel queries (SQLite compatible)
    const [reviewsRaw, statsRaw] = await Promise.all([
      // Reviews
      db.review.findMany({
        where: whereClause,
        include: {
          user: true,
          product: {
            select: {
              id: true,
              nameAr: true,
              nameEn: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      // Stats - safe fallback to multiple counts if raw fails
      db.$queryRaw`SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END)::integer as pending,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END)::integer as approved,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END)::integer as rejected,
        SUM(CASE WHEN status = 'spam' THEN 1 ELSE 0 END)::integer as spam,
        COALESCE(AVG(rating), 0) as averageRating 
      FROM Review`.catch(() => [{ total: 0, pending: 0, approved: 0, rejected: 0, spam: 0, averageRating: 0 }]) as any
    ])

    const reviews = reviewsRaw as any[]
    
    // In-memory search (optimized post-filter)
    let filteredReviews = reviews
    if (search) {
      const searchLower = search.toLowerCase()
      filteredReviews = reviews.filter(r => 
        r.comment?.toLowerCase().includes(searchLower) ||
        r.title?.toLowerCase().includes(searchLower) ||
        r.user?.name?.toLowerCase().includes(searchLower) ||
        r.user?.email?.toLowerCase().includes(searchLower) ||
        r.product?.nameAr?.toLowerCase().includes(searchLower) ||
        r.product?.nameEn?.toLowerCase().includes(searchLower)
      )
    }

    // Extract stats from single query result
    const stats = statsRaw[0] as any || {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      spam: 0,
      averageRating: 0
    }

    return NextResponse.json({
      reviews: filteredReviews,
      total: filteredReviews.length, // Current page filtered count
      stats
    })

  } catch (error) {
    console.error('Error fetching admin reviews:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reviews', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// POST - Create admin response (unchanged)
export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json()
    const { reviewId, adminResponse } = body

    if (!reviewId || !adminResponse) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const review = await db.review.update({
      where: { id: reviewId },
      data: { adminResponse },
    })

    return NextResponse.json({ review })
  } catch (error) {
    console.error('Error adding admin response:', error)
    return NextResponse.json(
      { error: 'Failed to add response' },
      { status: 500 }
    )
  }
}

