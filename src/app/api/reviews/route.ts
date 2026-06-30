import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Fetch reviews for a product or all featured reviews
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const featured = searchParams.get('featured')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (productId) {
      // Fetch reviews for a specific product
      const reviews = await db.review.findMany({
        where: { productId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      })

      // Calculate rating stats
      const stats = await db.review.aggregate({
        where: { productId },
        _avg: { rating: true },
        _count: { id: true },
      })

      // Get rating breakdown
      const breakdown = await db.review.groupBy({
        by: ['rating'],
        where: { productId },
        _count: { rating: true },
      })

      const ratingBreakdown = [0, 0, 0, 0, 0] // 1, 2, 3, 4, 5 stars
      breakdown.forEach((b) => {
        ratingBreakdown[b.rating - 1] = b._count.rating
      })

      return NextResponse.json({
        reviews,
        stats: {
          averageRating: stats._avg.rating || 0,
          totalReviews: stats._count.id,
          breakdown: ratingBreakdown.reverse(), // 5, 4, 3, 2, 1
        }
      })
    }

    // Fetch featured reviews for testimonials section
    const reviews = await db.review.findMany({
      where: featured === 'true' ? { rating: { gte: 4 } } : undefined,
      include: {
        user: {
          select: {
            id: true,
            name: true,
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
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    })

    return NextResponse.json({ reviews })
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    )
  }
}

// POST - Create a new review
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, productId, rating, title, comment } = body

    // Validate required fields
    if (!userId || !productId || !rating || !comment) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await db.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if product exists
    const product = await db.product.findUnique({
      where: { id: productId },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Check if user has already reviewed this product
    const existingReview = await db.review.findUnique({
      where: {
        userId_productId: { userId, productId },
      },
    })

    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this product' },
        { status: 400 }
      )
    }

    // Check if user has purchased this product (for verified badge)
    const hasPurchased = await db.orderItem.findFirst({
      where: {
        productId,
        order: {
          userId,
          status: 'delivered',
        },
      },
    })

    // Create the review
    const review = await db.review.create({
      data: {
        userId,
        productId,
        rating: parseInt(rating),
        title: title || null,
        comment,
        verified: !!hasPurchased,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          }
        }
      }
    })

    // Create notification for new review
    await db.notification.create({
      data: {
        type: 'new_review',
        title: 'تقييم جديد',
        message: `${user.name || 'مستخدم'} قام بتقييم ${product.nameAr} بـ ${rating} نجوم`,
        data: JSON.stringify({ reviewId: review.id, productId, rating, userId }),
        link: `/?view=admin&section=reviews`,
      },
    })

    return NextResponse.json({ review }, { status: 201 })
  } catch (error) {
    console.error('Error creating review:', error)
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    )
  }
}
