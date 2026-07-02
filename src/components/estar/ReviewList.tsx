'use client'

import { useState, useEffect } from 'react'
import { Star, ThumbsUp, MessageSquare, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { ReviewForm } from './ReviewForm'
import { csrfFetch } from '@/lib/csrf-fetch'

interface Review {
  id: string
  userName: string
  userAvatar?: string
  rating: number
  title?: string
  comment: string
  date: string
  verified: boolean
}

interface ReviewStats {
  averageRating: number
  totalReviews: number
  breakdown: number[]
}

interface ReviewListProps {
  productId: string
  userId?: string
  className?: string
}

// Individual Review Card
function ReviewCard({ review }: { review: Review }) {
  const [helpfulClicked, setHelpfulClicked] = useState(false)
  const [helpfulCount, setHelpfulCount] = useState(0)

  const handleHelpful = () => {
    if (!helpfulClicked) {
      setHelpfulCount(helpfulCount + 1)
      setHelpfulClicked(true)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="py-6 first:pt-0">
      <div className="flex gap-4">
        <Avatar className="h-10 w-10 border-2 border-primary/20 flex-shrink-0">
          <AvatarImage src={review.userAvatar} alt={review.userName} />
          <AvatarFallback className="bg-primary/20 text-primary font-medium">
            {review.userName.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-medium text-foreground">{review.userName}</span>
            {review.verified && (
              <Badge variant="secondary" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                مشتري موثق
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={cn(
                    'w-4 h-4',
                    star <= review.rating
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-muted stroke-muted-foreground'
                  )}
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">{formatDate(review.date)}</span>
          </div>
          {review.title && (
            <h4 className="font-medium text-foreground mb-2">{review.title}</h4>
          )}
          <p className="text-muted-foreground text-sm leading-relaxed mb-3">
            {review.comment}
          </p>

          {/* Helpful Button */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleHelpful}
              disabled={helpfulClicked}
              className={cn(
                'text-muted-foreground hover:text-primary hover:bg-primary/10',
                helpfulClicked && 'text-primary bg-primary/10'
              )}
            >
              <ThumbsUp className="h-4 w-4 ml-1" />
              مفيد {helpfulCount > 0 && `(${helpfulCount})`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function ReviewList({ productId, userId, className }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState<ReviewStats>({
    averageRating: 0,
    totalReviews: 0,
    breakdown: [0, 0, 0, 0, 0],
  })
  const [loading, setLoading] = useState(true)
  const [showReviewForm, setShowReviewForm] = useState(false)

  const fetchReviews = async () => {
    try {
      setLoading(true)
      const response = await csrfFetch(`/api/reviews?productId=${productId}`)
      if (response.ok) {
        const data = await response.json()
        
        // Transform reviews
        const transformedReviews: Review[] = data.reviews.map((review: {
          id: string;
          rating: number;
          title?: string;
          comment: string;
          verified: boolean;
          createdAt: string;
          user: {
            name: string;
            avatar?: string;
          };
        }) => ({
          id: review.id,
          userName: review.user.name || 'عميل',
          userAvatar: review.user.avatar,
          rating: review.rating,
          title: review.title,
          comment: review.comment,
          date: review.createdAt,
          verified: review.verified,
        }))
        
        setReviews(transformedReviews)
        setStats(data.stats)
      }
    } catch (error) {
      // Handle error silently
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews()
  }, [productId])

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              'w-5 h-5',
              star <= rating
                ? 'text-amber-400 fill-amber-400'
                : 'text-muted stroke-muted-foreground'
            )}
          />
        ))}
      </div>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className={cn('', className)}>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  // Empty state
  if (reviews.length === 0) {
    return (
      <div className={cn('', className)}>
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">لا توجد تقييمات بعد</h3>
            <p className="text-muted-foreground text-sm mb-6">
              كن أول من يقيم هذا المنتج!
            </p>
            <Button
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              اكتب تقييماً
            </Button>
          </div>
        </div>

        {showReviewForm && (
          <div className="mt-4">
            <ReviewForm 
              productId={productId} 
              userId={userId}
              onReviewSubmitted={() => {
                setShowReviewForm(false)
                fetchReviews()
              }}
            />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={cn('', className)}>
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Rating Summary */}
        <div className="lg:col-span-1">
          <div className="bg-card rounded-xl p-6 border border-border">
            {/* Overall Rating */}
            <div className="text-center mb-6">
              <div className="text-4xl sm:text-5xl font-bold text-foreground mb-2">
                {stats.averageRating.toFixed(1)}
              </div>
              <div className="flex justify-center mb-1">
                {renderStars(Math.round(stats.averageRating))}
              </div>
              <p className="text-sm text-muted-foreground">
                بناءً على {stats.totalReviews} {stats.totalReviews === 1 ? 'تقييم' : 'تقييمات'}
              </p>
            </div>

            {/* Rating Breakdown */}
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((star, index) => (
                <div key={star} className="flex items-center gap-2">
                  <span className="text-sm text-foreground w-8">{star} نجوم</span>
                  <Progress
                    value={stats.totalReviews > 0 ? (stats.breakdown[index] / stats.totalReviews) * 100 : 0}
                    className="flex-1 h-2 bg-muted"
                  />
                  <span className="text-sm text-muted-foreground w-8 text-left">
                    {stats.breakdown[index]}
                  </span>
                </div>
              ))}
            </div>

            {/* Write Review Button */}
            <Button
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="w-full mt-6 bg-primary hover:bg-primary/90 text-white"
            >
              اكتب تقييماً
            </Button>
          </div>

          {/* Review Form (collapsible) */}
          {showReviewForm && (
            <div className="mt-4">
              <ReviewForm 
                productId={productId}
                userId={userId}
                onReviewSubmitted={() => {
                  setShowReviewForm(false)
                  fetchReviews()
                }}
              />
            </div>
          )}
        </div>

        {/* Reviews List */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">
              التقييمات ({stats.totalReviews})
            </h3>
          </div>

          <Separator className="mb-2" />

          <div className="divide-y divide-border">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
