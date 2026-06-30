'use client'
import { csrfFetch } from '@/lib/csrf-fetch'

import * as React from 'react'
import {
  Search,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Tag,
  Percent,
  DollarSign,
  Calendar,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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

interface DiscountCode {
  id: string
  code: string
  type: string
  value: number
  minOrder: number | null
  maxDiscount: number | null
  usageLimit: number | null
  usageCount: number
  startDate: string
  endDate: string
  active: boolean
  createdAt: string
}

function DiscountRowSkeleton() {
  return (
    <TableRow>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
      <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
      <TableCell><Skeleton className="h-8 w-8 rounded" /></TableCell>
    </TableRow>
  )
}

export function AdminDiscounts() {
  const { toast } = useToast()
  const [discounts, setDiscounts] = React.useState<DiscountCode[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [deleteDialog, setDeleteDialog] = React.useState<DiscountCode | null>(null)
  const [editDialog, setEditDialog] = React.useState<DiscountCode | null>(null)
  const [addDialog, setAddDialog] = React.useState(false)
  const [saving, setSaving] = React.useState(false)

  // Form state
  const [formData, setFormData] = React.useState({
    code: '',
    type: 'percentage',
    value: '',
    minOrder: '',
    maxDiscount: '',
    usageLimit: '',
    startDate: '',
    endDate: '',
    active: true,
  })

  // Fetch discounts
  const fetchDiscounts = React.useCallback(async () => {
    try {
      setLoading(true)
      const response = await csrfFetch('/api/admin/discounts')
      if (response.ok) {
        const data = await response.json()
        setDiscounts(data.discounts || [])
      }
    } catch (error) {
      // Handle error silently
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل أكواد الخصم',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  React.useEffect(() => {
    fetchDiscounts()
  }, [fetchDiscounts])

  // Filter discounts
  const filteredDiscounts = React.useMemo(() => {
    return discounts.filter((discount) => {
      return discount.code.toLowerCase().includes(searchQuery.toLowerCase())
    })
  }, [discounts, searchQuery])

  // Toggle active status
  const handleToggleActive = async (discount: DiscountCode) => {
    try {
      const response = await csrfFetch(`/api/admin/discounts/${discount.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !discount.active }),
      })
      
      if (response.ok) {
        setDiscounts(discounts.map(d => 
          d.id === discount.id ? { ...d, active: !d.active } : d
        ))
        toast({
          title: 'تم التحديث',
          description: `تم ${discount.active ? 'إلغاء تفعيل' : 'تفعيل'} كود الخصم`,
        })
      }
    } catch (error) {
      // Handle error silently
      toast({
        title: 'خطأ',
        description: 'فشل في تحديث حالة كود الخصم',
        variant: 'destructive',
      })
    }
  }

  // Delete discount
  const handleDelete = async (discount: DiscountCode) => {
    try {
      const response = await csrfFetch(`/api/admin/discounts/${discount.id}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        setDiscounts(discounts.filter(d => d.id !== discount.id))
        setDeleteDialog(null)
        toast({
          title: 'تم الحذف',
          description: 'تم حذف كود الخصم بنجاح',
        })
      }
    } catch (error) {
      // Handle error silently
      toast({
        title: 'خطأ',
        description: 'فشل في حذف كود الخصم',
        variant: 'destructive',
      })
    }
  }

  // Open edit dialog
  const openEditDialog = (discount: DiscountCode) => {
    setFormData({
      code: discount.code,
      type: discount.type,
      value: discount.value.toString(),
      minOrder: discount.minOrder?.toString() || '',
      maxDiscount: discount.maxDiscount?.toString() || '',
      usageLimit: discount.usageLimit?.toString() || '',
      startDate: new Date(discount.startDate).toISOString().split('T')[0],
      endDate: new Date(discount.endDate).toISOString().split('T')[0],
      active: discount.active,
    })
    setEditDialog(discount)
  }

  // Open add dialog
  const openAddDialog = () => {
    const today = new Date().toISOString().split('T')[0]
    const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    setFormData({
      code: '',
      type: 'percentage',
      value: '',
      minOrder: '',
      maxDiscount: '',
      usageLimit: '',
      startDate: today,
      endDate: nextMonth,
      active: true,
    })
    setAddDialog(true)
  }

  // Handle form submit
  const handleFormSubmit = async (e: React.FormEvent, isEdit: boolean, discountId?: string) => {
    e.preventDefault()
    setSaving(true)
    
    try {
      const payload = {
        code: formData.code.toUpperCase(),
        type: formData.type,
        value: parseFloat(formData.value),
        minOrder: formData.minOrder ? parseFloat(formData.minOrder) : null,
        maxDiscount: formData.maxDiscount ? parseFloat(formData.maxDiscount) : null,
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
        startDate: formData.startDate,
        endDate: formData.endDate,
        active: formData.active,
      }
      
      const url = isEdit 
        ? `/api/admin/discounts/${discountId}` 
        : '/api/admin/discounts'
      
      const response = await csrfFetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      
      if (response.ok) {
        toast({
          title: isEdit ? 'تم التحديث' : 'تمت الإضافة',
          description: isEdit ? 'تم تحديث كود الخصم بنجاح' : 'تم إضافة كود الخصم بنجاح',
        })
        fetchDiscounts()
        setEditDialog(null)
        setAddDialog(false)
      } else {
        const error = await response.json()
        toast({
          title: 'خطأ',
          description: error.error || 'فشل في حفظ كود الخصم',
          variant: 'destructive',
        })
      }
    } catch (error) {
      // Handle error silently
      toast({
        title: 'خطأ',
        description: 'فشل في حفظ كود الخصم',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  // Get stats
  const stats = React.useMemo(() => {
    const total = discounts.length
    const active = discounts.filter(d => d.active).length
    const percentage = discounts.filter(d => d.type === 'percentage').length
    const fixed = discounts.filter(d => d.type === 'fixed').length
    
    return { total, active, percentage, fixed }
  }, [discounts])

  // Check if discount is expired
  const isExpired = (endDate: string) => {
    return new Date(endDate) < new Date()
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">إدارة أكواد الخصم</h1>
          <p className="text-gray-500 text-sm mt-1">
            {discounts.length} كود خصم
          </p>
        </div>
        <Button
          onClick={openAddDialog}
          className="bg-primary hover:bg-primary/90 text-white"
        >
          <Plus className="h-4 w-4 ml-2" />
          إضافة كود خصم
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <Tag className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-xs text-gray-500">إجمالي الأكواد</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
                <p className="text-xs text-gray-500">نشط</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Percent className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.percentage}</p>
                <p className="text-xs text-gray-500">نسبي</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-violet-100 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.fixed}</p>
                <p className="text-xs text-gray-500">ثابت</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters Card */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="search"
              placeholder="بحث عن كود خصم..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10 bg-gray-50 border-gray-200"
            />
          </div>
        </CardContent>
      </Card>

      {/* Discounts Table */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                <TableHead className="text-gray-600">الكود</TableHead>
                <TableHead className="text-gray-600">النوع</TableHead>
                <TableHead className="text-gray-600">القيمة</TableHead>
                <TableHead className="text-gray-600">الحد الأدنى</TableHead>
                <TableHead className="text-gray-600">الاستخدام</TableHead>
                <TableHead className="text-gray-600">صالح حتى</TableHead>
                <TableHead className="text-gray-600">الحالة</TableHead>
                <TableHead className="text-gray-600 text-center">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <DiscountRowSkeleton key={i} />
                ))
              ) : filteredDiscounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                        <Tag className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500">لا توجد أكواد خصم</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredDiscounts.map((discount) => (
                  <TableRow key={discount.id} className="hover:bg-gray-50">
                    <TableCell className="font-mono font-medium text-gray-900">
                      {discount.code}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(
                        'font-normal',
                        discount.type === 'percentage' ? 'bg-blue-100 text-blue-700' : 'bg-violet-100 text-violet-700'
                      )}>
                        {discount.type === 'percentage' ? (
                          <><Percent className="h-3 w-3 mr-1" /> نسبي</>
                        ) : (
                          <><DollarSign className="h-3 w-3 mr-1" /> ثابت</>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-gray-900">
                      {discount.type === 'percentage' 
                        ? `${discount.value}%` 
                        : `${discount.value} ج.م`}
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {discount.minOrder ? `${discount.minOrder} ج.م` : '-'}
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {discount.usageCount}
                      {discount.usageLimit && ` / ${discount.usageLimit}`}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        <span className={cn(
                          'text-sm',
                          isExpired(discount.endDate) ? 'text-red-600' : 'text-gray-500'
                        )}>
                          {new Date(discount.endDate).toLocaleDateString('ar-SA')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => handleToggleActive(discount)}
                        className={cn(
                          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium transition-colors',
                          discount.active && !isExpired(discount.endDate)
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        )}
                      >
                        {discount.active && !isExpired(discount.endDate) ? (
                          <>
                            <CheckCircle className="h-3.5 w-3.5" />
                            نشط
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3.5 w-3.5" />
                            غير نشط
                          </>
                        )}
                      </button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(discount)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-gray-500">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleToggleActive(discount)}>
                              {discount.active ? (
                                <>
                                  <XCircle className="h-4 w-4 ml-2" />
                                  إلغاء التفعيل
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4 ml-2" />
                                  تفعيل
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditDialog(discount)}>
                              <Edit className="h-4 w-4 ml-2" />
                              تعديل
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => setDeleteDialog(discount)}
                            >
                              <Trash2 className="h-4 w-4 ml-2" />
                              حذف
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف كود الخصم</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف كود الخصم "{deleteDialog?.code}"؟ هذا الإجراء لا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={() => deleteDialog && handleDelete(deleteDialog)}
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add/Edit Discount Dialog */}
      <Dialog open={addDialog || !!editDialog} onOpenChange={(open) => {
        if (!open) {
          setAddDialog(false)
          setEditDialog(null)
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editDialog ? 'تعديل كود الخصم' : 'إضافة كود خصم جديد'}</DialogTitle>
            <DialogDescription>
              {editDialog ? 'قم بتعديل بيانات كود الخصم' : 'أدخل بيانات كود الخصم الجديد'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => handleFormSubmit(e, !!editDialog, editDialog?.id)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">الكود</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="SUMMER20"
                  className="font-mono"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">النوع</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">نسبي (%)</SelectItem>
                    <SelectItem value="fixed">ثابت (ج.م)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="value">القيمة</Label>
                <Input
                  id="value"
                  type="number"
                  step="0.01"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minOrder">الحد الأدنى للطلب</Label>
                <Input
                  id="minOrder"
                  type="number"
                  step="0.01"
                  value={formData.minOrder}
                  onChange={(e) => setFormData({ ...formData, minOrder: e.target.value })}
                  placeholder="اختياري"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxDiscount">أقصى خصم</Label>
                <Input
                  id="maxDiscount"
                  type="number"
                  step="0.01"
                  value={formData.maxDiscount}
                  onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                  placeholder="اختياري"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="usageLimit">حد الاستخدام</Label>
                <Input
                  id="usageLimit"
                  type="number"
                  value={formData.usageLimit}
                  onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                  placeholder="غير محدود"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">تاريخ البداية</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">تاريخ النهاية</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="active">كود نشط</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setAddDialog(false)
                setEditDialog(null)
              }}>
                إلغاء
              </Button>
              <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary/90">
                {saving ? 'جاري الحفظ...' : editDialog ? 'حفظ التغييرات' : 'إضافة الكود'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AdminDiscounts
