'use client'

import { useState } from 'react'
import { Star, Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { csrfFetch } from '@/lib/csrf-fetch'

interface ReviewFormProps {
  productId: string
  userId?: string
  onReviewSubmitted?: () => void
  className?: string
}

export function ReviewForm({ productId, userId, onReviewSubmitted, className }: ReviewFormProps) {
  const { toast } = useToast()
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!userId) {
      setError('يجب تسجيل الدخول لإضافة تقييم')
      return
    }

    if (rating === 0) {
      setError('الرجاء اختيار التقييم')
      return
    }

    if (!title.trim()) {
      setError('الرجاء إدخال عنوان التقييم')
      return
    }

    if (!comment.trim()) {
      setError('الرجاء كتابة التقييم')
      return
    }

    setIsSubmitting(true)
    setError(null)
    
    try {
      const response = await csrfFetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          productId,
          rating,
          title,
          comment,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'فشل في إرسال التقييم')
      }

      // Reset form
      setRating(0)
      setTitle('')
      setComment('')
      setSuccess(true)
      
      toast({
        title: 'تم إرسال التقييم',
        description: 'شكراً لمشاركة تجربتك معنا!',
      })

      // Callback to refresh reviews
      onReviewSubmitted?.()

      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء إرسال التقييم')
    } finally {
      setIsSubmitting(false)
    }
  }

  const ratingLabels: Record<number, string> = {
    1: 'سيء جداً',
    2: 'سيء',
    3: 'متوسط',
    4: 'جيد',
    5: 'ممتاز',
  }

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-6', className)}>
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">أضف تقييمك</h3>
        
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 bg-emerald-50 border-emerald-200 text-emerald-800">
            <AlertDescription>تم إرسال تقييمك بنجاح! شكراً لمشاركتك.</AlertDescription>
          </Alert>
        )}
        
        {/* Star Rating */}
        <div className="mb-6">
          <Label className="text-sm font-medium text-foreground mb-2 block">التقييم *</Label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="p-1 transition-transform hover:scale-110 focus:outline-none"
                disabled={isSubmitting}
              >
                <Star
                  className={cn(
                    'w-8 h-8 transition-colors',
                    (hoveredRating || rating) >= star
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-muted stroke-muted-foreground'
                  )}
                />
              </button>
            ))}
            {(hoveredRating || rating) > 0 && (
              <span className="mr-2 text-sm text-muted-foreground">
                {ratingLabels[hoveredRating || rating]}
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <div className="mb-4">
          <Label htmlFor="review-title" className="text-sm font-medium text-foreground mb-2 block">
            عنوان التقييم *
          </Label>
          <Input
            id="review-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="أضف عنواناً مختصراً لتقييمك"
            className="border-border focus:border-primary focus:ring-primary"
            required
            disabled={isSubmitting}
            maxLength={100}
          />
          <p className="text-xs text-muted-foreground mt-1">{title.length}/100</p>
        </div>

        {/* Comment */}
        <div className="mb-6">
          <Label htmlFor="review-comment" className="text-sm font-medium text-foreground mb-2 block">
            التقييم *
          </Label>
          <Textarea
            id="review-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="شاركنا رأيك في المنتج..."
            rows={4}
            className="border-border focus:border-primary focus:ring-primary resize-none"
            required
            disabled={isSubmitting}
            maxLength={1000}
          />
          <p className="text-xs text-muted-foreground mt-1">{comment.length}/1000</p>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={rating === 0 || !title.trim() || !comment.trim() || isSubmitting || !userId}
          className="w-full bg-primary hover:bg-primary/90 text-white"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 ml-2 animate-spin" />
              جاري الإرسال...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 ml-2" />
              إرسال التقييم
            </>
          )}
        </Button>

        {!userId && (
          <p className="text-sm text-muted-foreground text-center mt-3">
            يجب تسجيل الدخول لإضافة تقييم
          </p>
        )}
      </div>
    </form>
  )
}
