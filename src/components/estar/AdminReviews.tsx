'use client'
import { csrfFetch } from '@/lib/csrf-fetch'

import * as React from 'react'
import {
  Search,
  Filter,
  Star,
  MessageSquare,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Trash2,
  ThumbsUp,
  ThumbsDown,
  Flag,
  UserX,
  Pin,
  MessageCircle,
  Clock,
  Package,
  ShieldCheck,
  Ban,
  Loader2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState(value)

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

interface Review {
  id: string
  rating: number
  title: string | null
  comment: string
  verified: boolean
  status: string
  adminResponse: string | null
  rejectedReason: string | null
  isFeatured: boolean
  helpfulCount: number
  createdAt: string
  user: {
    id: string
    name: string | null
    email: string
    avatar: string | null
    isBlocked: boolean
  }
  product: {
    id: string
    nameAr: string
    nameEn: string
    images: { url: string }[]
  }
}

interface ReviewStats {
  total: number
  pending: number
  approved: number
  rejected: number
  spam: number
  averageRating: number
}

function ReviewCardSkeleton() {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4">
        <div className="flex gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
            <Skeleton className="h-16 w-full mt-2" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function AdminReviews() {
  const { toast } = useToast()
  
  // States
  const [reviews, setReviews] = React.useState<Review[]>([])
  const [stats, setStats] = React.useState<ReviewStats>({
    total: 0, pending: 0, approved: 0, rejected: 0, spam: 0, averageRating: 0
  })
  const [loading, setLoading] = React.useState(true)
  
  // DEBOUNCED search + filters
  const [rawSearchQuery, setRawSearchQuery] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState('all')
  const [ratingFilter, setRatingFilter] = React.useState('all')
  
  const debouncedSearchQuery = useDebounce(rawSearchQuery, 400)
  
  // Dialog states (unchanged)
  const [deleteDialog, setDeleteDialog] = React.useState<Review | null>(null)
  const [replyDialog, setReplyDialog] = React.useState<Review | null>(null)
  const [banDialog, setBanDialog] = React.useState<Review | null>(null)
  const [rejectDialog, setRejectDialog] = React.useState<Review | null>(null)
  const [replyText, setReplyText] = React.useState('')
  const [banReason, setBanReason] = React.useState('')
  const [rejectReason, setRejectReason] = React.useState('')
  const [actionLoading, setActionLoading] = React.useState<Record<string, boolean>>({})

  // OPTIMIZED fetchReviews - FIXED deps + debouncing
  const fetchReviews = React.useCallback(async (forceRefresh = false) => {
    if (loading && !forceRefresh) return
    
    try {
      setLoading(true)
      const params = new URLSearchParams({
        status: statusFilter === 'all' ? '' : statusFilter,
        rating: ratingFilter === 'all' ? '' : ratingFilter,
        search: debouncedSearchQuery || '',
        limit: '25',
        offset: '0'
      }).toString()
      
      const url = `/api/admin/reviews?${params}`
      const response = await csrfFetch(url)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error:', response.status, errorText)
        toast({
          title: 'خطأ الخادم',
          description: `(${response.status}) ${errorText.slice(0,100)}`,
          variant: 'destructive',
        })
        return
      }
      
      const data = await response.json()
      setReviews(data.reviews || [])
      setStats(data.stats || { total: 0, pending: 0, approved: 0, rejected: 0, spam: 0, averageRating: 0 })
      
    } catch (error) {
      console.error('Fetch failed:', error)
      toast({
        title: 'فشل التحميل',
        description: 'تحقق من الخادم أو أعد المحاولة',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [statusFilter, ratingFilter, debouncedSearchQuery, toast])

  // SEPARATE EFFECTS - FIXED infinite loop!
  // Initial load
  React.useEffect(() => {
    fetchReviews(true)
  }, []) // Empty deps = mount only

  // FIXED: Stable filter effect - no more loops!
  const filterKey = React.useMemo(() => 
    `${statusFilter}-${ratingFilter}-${debouncedSearchQuery}`, 
    [statusFilter, ratingFilter, debouncedSearchQuery]
  )

  React.useEffect(() => {
    const timer = setTimeout(() => fetchReviews(), 300)
    return () => clearTimeout(timer)
  }, [filterKey, fetchReviews])

  // Action handlers (unchanged - simplified for brevity)
  const handleStatusChange = async (review: Review, newStatus: string, rejectedReason?: string) => {
    // ... same implementation as before
    const actionKey = `status-${review.id}`
    setActionLoading(prev => ({ ...prev, [actionKey]: true }))
    
    try {
      const response = await csrfFetch(`/api/admin/reviews/${review.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, rejectedReason }),
      })

      if (response.ok) {
        toast({ title: 'تم التحديث', description: 'تم تحديث حالة التقييم' })
        fetchReviews(true) // Refresh
      }
    } catch (error) {
      toast({ title: 'خطأ', description: 'فشل في التحديث', variant: 'destructive' })
    } finally {
      setActionLoading(prev => ({ ...prev, [actionKey]: false }))
    }
  }

// NEW HANDLERS for additional buttons - FULL IMPLEMENTATIONS

  // Toggle Featured/Pin ⭐
  const handleToggleFeature = async (review: Review) => {
    const actionKey = `feature-${review.id}`
    setActionLoading(prev => ({ ...prev, [actionKey]: true }))

    try {
      const response = await csrfFetch(`/api/admin/reviews/${review.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFeatured: !review.isFeatured }),
      })

      if (response.ok) {
        toast({
          title: 'تم التحديث',
          description: !review.isFeatured ? 'تم جعل التقييم مميزًا' : 'تم إلغاء التمييز'
        })
        fetchReviews(true)
      } else {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في تحديث حالة المميز',
        variant: 'destructive'
      })
    } finally {
      setActionLoading(prev => ({ ...prev, [actionKey]: false }))
    }
  }

  // Block User 👤
  const handleBlockUser = async (user: Review['user']) => {
    const actionKey = `block-${user.id}`
    setActionLoading(prev => ({ ...prev, [actionKey]: true }))

    try {
      const response = await csrfFetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isBlocked: true })
      })

      if (response.ok) {
        toast({
          title: 'تم الحظر',
          description: `تم حظر ${user.name || user.email}`
        })
        fetchReviews(true)
      } else {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في حظر المستخدم',
        variant: 'destructive'
      })
    } finally {
      setActionLoading(prev => ({ ...prev, [actionKey]: false }))
    }
  }

  // Duplicate Review 📋 (for testing)
  const handleDuplicate = async (review: Review) => {
    const actionKey = `dup-${review.id}`
    setActionLoading(prev => ({ ...prev, [actionKey]: true }))

    try {
      // Create duplicate via POST to /api/reviews (public endpoint)
      const response = await csrfFetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: review.product.id,
          rating: review.rating,
          title: review.title,
          comment: `[نسخة مكررة] ${review.comment}`,
          verified: false
        })
      })

      if (response.ok) {
        toast({
          title: 'تم النسخ',
          description: 'تم إنشاء نسخة مكررة للتقييم'
        })
        fetchReviews(true)
      } else {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في النسخ',
        variant: 'destructive'
      })
    } finally {
      setActionLoading(prev => ({ ...prev, [actionKey]: false }))
    }
  }

  // Delete handler 🗑️
  const handleDelete = async (review: Review) => {
    const actionKey = `delete-${review.id}`
    setActionLoading(prev => ({ ...prev, [actionKey]: true }))

    try {
      const response = await csrfFetch(`/api/admin/reviews/${review.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast({ title: 'تم الحذف', description: 'تم حذف التقييم نهائيًا' })
        fetchReviews(true)
      }
    } catch (error) {
      toast({ title: 'خطأ', description: 'فشل في الحذف', variant: 'destructive' })
    } finally {
      setActionLoading(prev => ({ ...prev, [actionKey]: false }))
      setDeleteDialog(null)
    }
  }

  // Reply handler ✉️ (complete implementation)
  const handleReply = async (review: Review) => {
    const actionKey = `reply-${review.id}`
    setActionLoading(prev => ({ ...prev, [actionKey]: true }))

    try {
      const response = await csrfFetch(`/api/admin/reviews/${review.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminResponse: replyText })
      })

      if (response.ok) {
        toast({ title: 'تم الرد', description: 'تم نشر رد الإدارة' })
        fetchReviews(true)
        setReplyText('')
      }
    } catch (error) {
      toast({ title: 'خطأ', description: 'فشل في النشر', variant: 'destructive' })
    } finally {
      setActionLoading(prev => ({ ...prev, [actionKey]: false }))
      setReplyDialog(null)
    }
  }

  // Status config & helpers (unchanged)
  const statusConfig = {
    pending: { label: 'قيد المراجعة', color: 'bg-amber-100 text-amber-700' },
    approved: { label: 'معتمد', color: 'bg-emerald-100 text-emerald-700' },
    rejected: { label: 'مرفوض', color: 'bg-red-100 text-red-700' },
    spam: { label: 'رسائل مزعجة', color: 'bg-gray-100 text-gray-700' },
  } as const

  const renderStars = (rating: number) => Array.from({ length: 5 }).map((_, i) => (
    <Star key={i} className={cn('h-4 w-4', i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300')} />
  ))

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('ar-SA')

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">إدارة التقييمات</h1>
        <p className="text-gray-500">الآن محسن - بدون تكرار استفسارات!</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { icon: MessageSquare, count: stats.total, label: 'إجمالي' },
          { icon: Clock, count: stats.pending, label: 'قيد المراجعة', color: 'bg-amber-100' },
          { icon: CheckCircle, count: stats.approved, label: 'معتمدة', color: 'bg-emerald-100' },
          { icon: XCircle, count: stats.rejected, label: 'مرفوضة', color: 'bg-red-100' },
          { icon: Flag, count: stats.spam, label: 'مزعج', color: 'bg-gray-100' },
        ].map(({ icon: Icon, count, label, color }, i) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center', color)}>
                  <Icon className="h-5 w-5 text-current" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-xs text-gray-500">{label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters - NOW DEBOUNCED */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="ابحث في التقييمات..."
                value={rawSearchQuery}
                onChange={(e) => setRawSearchQuery(e.target.value)}
                className="pr-10"
              />
              {rawSearchQuery !== debouncedSearchQuery && (
                <span className="absolute right-12 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  كتابة...
                </span>
              )}
            </div>
            
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="pending">قيد المراجعة</SelectItem>
                  <SelectItem value="approved">معتمد</SelectItem>
                  <SelectItem value="rejected">مرفوض</SelectItem>
                  <SelectItem value="spam">مزعج</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={ratingFilter} onValueChange={setRatingFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="التقييم" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  {([5,4,3,2,1] as number[]).map(n => (
                    <SelectItem key={n} value={n.toString()}>{n} نجوم</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <ReviewCardSkeleton key={i} />)
        ) : reviews.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">لا توجد تقييمات</h3>
              <p className="text-muted-foreground mb-4">جرب تغيير الفلاتر أو أضف بيانات تجريبية</p>
              <Button variant="outline" onClick={() => fetchReviews(true)}>
                إعادة تحميل
              </Button>
            </CardContent>
          </Card>
        ) : (
          reviews.map((review) => {
            return (
              <Card key={review.id} className={cn("border-0 shadow-sm", review.isFeatured && "ring-2 ring-blue-200")}>
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <Avatar className="h-14 w-14">
                      <AvatarImage src={review.user.avatar || undefined} />
                      <AvatarFallback>{review.user.name?.charAt(0) || '?'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className="font-semibold text-lg">{review.user.name || 'غير معروف'}</span>
                        {review.user.isBlocked && <Badge variant="destructive">محظور</Badge>}
                        {review.verified && <Badge variant="secondary">موثق</Badge>}
                        {review.isFeatured && <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">⭐ مميز</Badge>}
                        <Badge className={
                          review.status === 'approved' ? 'bg-green-100 text-green-800' :
                          review.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          review.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }>
                          {review.status === 'approved' ? '✅ معتمد' : 
                           review.status === 'pending' ? '⏳ قيد المراجعة' :
                           review.status === 'rejected' ? '❌ مرفوض' : '🚫 مزعج'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-600 mb-4">
                        <Package className="h-4 w-4" />
                        <span>{review.product.nameAr}</span>
                      </div>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="flex">{renderStars(review.rating)}</div>
                        {review.title && <span className="font-medium">"{review.title}"</span>}
                      </div>
                      <p className="text-gray-700 mb-4 leading-relaxed">{review.comment}</p>
                      {review.adminResponse && (
                        <div className="bg-blue-50 p-3 rounded-lg mb-4 border-l-4 border-blue-500">
                          <div className="font-medium text-blue-900 mb-1 flex items-center gap-1">
                            <MessageCircle className="h-4 w-4" />
                            رد الإدارة
                          </div>
                          <p className="text-sm text-blue-900">{review.adminResponse}</p>
                        </div>
                      )}
                      {review.rejectedReason && (
                        <div className="bg-red-50 p-3 rounded-lg mb-4 border-l-4 border-red-500">
                          <div className="font-medium text-red-900 mb-1">سبب الرفض:</div>
                          <p className="text-sm text-red-900">{review.rejectedReason}</p>
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <div className="text-xs text-gray-500 flex items-center gap-2">
                          <span>{formatDate(review.createdAt)}</span>
                          <span><ThumbsUp className="h-3 w-3"/> {review.helpfulCount}</span>
                        </div>
                        <div className="flex gap-2">
                          {review.status === 'pending' && (
                            <>
                              <Button size="sm" variant="outline" onClick={() => handleStatusChange(review, 'approved')}>
                                ✅ اعتماد
                              </Button>
                              <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleStatusChange(review, 'rejected')}>
                                ❌ رفض
                              </Button>
                            </>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>خيارات</DropdownMenuLabel>
                              <DropdownMenuItem 
                                onClick={() => handleStatusChange(review, review.status === 'spam' ? 'pending' : 'spam')}
                                className={actionLoading[`status-${review.id}`] ? 'opacity-50 pointer-events-none' : ''}
                                disabled={actionLoading[`status-${review.id}`]}
                              >
                                {review.status === 'spam' ? '🔄 استعادة' : '🚫 مزعج'}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => setReplyDialog(review)}
                                disabled={actionLoading[`reply-${review.id}`]}
                              >
                                ✉️ رد
                              </DropdownMenuItem>
                              
                              {/* NEW BUTTONS ⭐👤📋📦 */}
                              <DropdownMenuItem 
                                onClick={() => handleToggleFeature(review)}
                                disabled={actionLoading[`feature-${review.id}`]}
                                className={review.isFeatured ? 'text-yellow-600' : ''}
                              >
                                ⭐ {review.isFeatured ? 'إلغاء مميز' : 'جعل مميز'}
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem 
                                onClick={() => handleBlockUser(review.user)}
                                disabled={actionLoading[`block-${review.user.id}`]}
                                className="text-orange-600"
                              >
                                👤 حظر المستخدم
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem 
                                onClick={() => handleDuplicate(review)}
                                disabled={actionLoading[`dup-${review.id}`]}
                              >
                                📋 تكرار (للاختبار)
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem 
                                onClick={() => window.open(`/products/${review.product.id}`, '_blank')}
                              >
                                📦 عرض المنتج
                              </DropdownMenuItem>
                              
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-destructive focus:text-destructive focus:bg-destructive/20"
                                onClick={() => setDeleteDialog(review)}
                                disabled={actionLoading[`delete-${review.id}`]}
                              >
                                🗑️ حذف نهائي
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })

        )}
      </div>

      {/* COMPLETE DIALOGS - Reply & Delete */}

      {/* Reply Dialog ✉️ */}
      <Dialog open={!!replyDialog} onOpenChange={() => setReplyDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>رد على التقييم</DialogTitle>
            <DialogDescription>
              اكتب رد الإدارة على تعليق <strong>{replyDialog?.user.name}</strong>
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="الرد الرسمي..."
            className="min-h-[100px]"
            disabled={actionLoading[`reply-${replyDialog?.id}`]}
          />
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setReplyDialog(null)}
              disabled={actionLoading[`reply-${replyDialog?.id}`]}
            >
              إلغاء
            </Button>
            <Button 
              onClick={() => replyDialog && handleReply(replyDialog)}
              disabled={!replyText.trim() || actionLoading[`reply-${replyDialog?.id}`]}
            >
              {actionLoading[`reply-${replyDialog?.id}`] ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  جاري النشر...
                </>
              ) : (
                'نشر الرد'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation 🗑️ */}
      <AlertDialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف تقييم <strong>{deleteDialog?.title || deleteDialog?.comment.slice(0,50)}...</strong>؟
              <br />هذا الإجراء نهائي ولا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading[`delete-${deleteDialog?.id}`]}>
              إلغاء
            </AlertDialogCancel>
            <Button 
              variant="destructive"
              onClick={() => deleteDialog && handleDelete(deleteDialog)}
              disabled={actionLoading[`delete-${deleteDialog?.id}`]}
            >
              {actionLoading[`delete-${deleteDialog?.id}`] ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  جاري الحذف...
                </>
              ) : (
                'حذف نهائي'
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

