'use client'

import * as React from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
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
import { Skeleton } from '@/components/ui/skeleton'
import {
  Plus,
  Edit,
  Trash2,
  Image as ImageIcon,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { csrfFetch } from '@/lib/csrf-fetch'
import { useToast } from '@/hooks/use-toast'
import { ImageUploader } from '@/components/estar/ImageUploader'

interface Banner {
  id: string
  titleEn: string | null
  titleAr: string | null
  subtitleEn: string | null
  subtitleAr: string | null
  buttonTextEn: string | null
  buttonTextAr: string | null
  image: string
  link: string | null
  position: string
  active: boolean
  order: number
  startDate: string | null
  endDate: string | null
  createdAt: string
}

export function AdminBanners() {
  const { toast } = useToast()
  const [banners, setBanners] = React.useState<Banner[]>([])
  const [loading, setLoading] = React.useState(true)
  const [editDialog, setEditDialog] = React.useState<Banner | null>(null)
  const [addDialog, setAddDialog] = React.useState(false)
  const [deleteDialog, setDeleteDialog] = React.useState<Banner | null>(null)
  const [saving, setSaving] = React.useState(false)
  const [positionFilter, setPositionFilter] = React.useState('all')

  // Form state
  const [formData, setFormData] = React.useState({
    titleEn: '',
    titleAr: '',
    subtitleEn: '',
    subtitleAr: '',
    buttonTextEn: '',
    buttonTextAr: '',
    image: '',
    link: '',
    position: 'hero',
    order: 0,
    startDate: '',
    endDate: '',
    active: true,
  })

  // Fetch banners
  const fetchBanners = React.useCallback(async () => {
    try {
      setLoading(true)
      const url = positionFilter !== 'all' ? `?position=${positionFilter}` : ''
      const response = await csrfFetch(`/api/admin/banners${url}`)
      if (response.ok) {
        const data = await response.json()
        setBanners(data.banners || [])
      }
    } catch (error) {
      // Handle error silently
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل البنرات',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast, positionFilter])

  React.useEffect(() => {
    fetchBanners()
  }, [fetchBanners])

  // Open edit dialog
  const openEditDialog = (banner: Banner) => {
    setFormData({
      titleEn: banner.titleEn || '',
      titleAr: banner.titleAr || '',
      subtitleEn: banner.subtitleEn || '',
      subtitleAr: banner.subtitleAr || '',
      buttonTextEn: banner.buttonTextEn || '',
      buttonTextAr: banner.buttonTextAr || '',
      image: banner.image,
      link: banner.link || '',
      position: banner.position,
      order: banner.order,
      startDate: banner.startDate ? new Date(banner.startDate).toISOString().split('T')[0] : '',
      endDate: banner.endDate ? new Date(banner.endDate).toISOString().split('T')[0] : '',
      active: banner.active,
    })
    setEditDialog(banner)
  }

  // Open add dialog
  const openAddDialog = () => {
    setFormData({
      titleEn: '',
      titleAr: '',
      subtitleEn: '',
      subtitleAr: '',
      buttonTextEn: '',
      buttonTextAr: '',
      image: '',
      link: '',
      position: 'hero',
      order: banners.length,
      startDate: '',
      endDate: '',
      active: true,
    })
    setAddDialog(true)
  }

  // Handle form submit
  const handleFormSubmit = async (e: React.FormEvent, isEdit: boolean, bannerId?: string) => {
    e.preventDefault()

    // Client-side validation: image is mandatory for a banner to render.
    if (!formData.image || !formData.image.trim()) {
      toast({
        title: 'خطأ',
        description: 'صورة البنر مطلوبة',
        variant: 'destructive',
      })
      return
    }

    setSaving(true)
    
    try {
      const payload = {
        ...formData,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
      }
      
      const url = isEdit ? `/api/admin/banners/${bannerId}` : '/api/admin/banners'
      const method = isEdit ? 'PUT' : 'POST'
      
      const response = await csrfFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      
      if (response.ok) {
        toast({
          title: isEdit ? 'تم التحديث' : 'تمت الإضافة',
          description: isEdit ? 'تم تحديث البنر بنجاح' : 'تم إضافة البنر بنجاح',
        })
        fetchBanners()
        setEditDialog(null)
        setAddDialog(false)
      } else {
        throw new Error('Failed')
      }
    } catch (error) {
      // Handle error silently
      toast({
        title: 'خطأ',
        description: 'فشل في حفظ البنر',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  // Toggle active status
  const handleToggleActive = async (banner: Banner) => {
    try {
      const response = await csrfFetch(`/api/admin/banners/${banner.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !banner.active }),
      })
      
      if (response.ok) {
        setBanners(banners.map(b => b.id === banner.id ? { ...b, active: !b.active } : b))
        toast({
          title: 'تم التحديث',
          description: banner.active ? 'تم إلغاء تفعيل البنر' : 'تم تفعيل البنر',
        })
      }
    } catch (error) {
      // Handle error silently
    }
  }

  // Delete banner
  const handleDelete = async (banner: Banner) => {
    try {
      const response = await csrfFetch(`/api/admin/banners/${banner.id}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        setBanners(banners.filter(b => b.id !== banner.id))
        setDeleteDialog(null)
        toast({
          title: 'تم الحذف',
          description: 'تم حذف البنر بنجاح',
        })
      }
    } catch (error) {
      // Handle error silently
      toast({
        title: 'خطأ',
        description: 'فشل في حذف البنر',
        variant: 'destructive',
      })
    }
  }

  // Move banner order
  const handleMoveOrder = async (banner: Banner, direction: 'up' | 'down') => {
    const currentIndex = banners.findIndex(b => b.id === banner.id)
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    
    if (newIndex < 0 || newIndex >= banners.length) return
    
    const newBanners = [...banners]
    const temp = newBanners[currentIndex]
    newBanners[currentIndex] = newBanners[newIndex]
    newBanners[newIndex] = temp
    
    // Update order in database
    try {
      await Promise.all([
        csrfFetch(`/api/admin/banners/${newBanners[currentIndex].id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: currentIndex }),
        }),
        csrfFetch(`/api/admin/banners/${newBanners[newIndex].id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: newIndex }),
        }),
      ])
      
      setBanners(newBanners)
    } catch (error) {
      // Handle error silently
    }
  }

  const positionLabels: Record<string, string> = {
    hero: 'البنر الرئيسي',
    sidebar: 'الشريط الجانبي',
    footer: 'التذييل',
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">إدارة البنرات</h1>
          <p className="text-gray-500 text-sm mt-1">
            {banners.length} بنر في الموقع
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={positionFilter} onValueChange={setPositionFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="فلترة حسب الموقع" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع البنرات</SelectItem>
              <SelectItem value="hero">البنر الرئيسي</SelectItem>
              <SelectItem value="sidebar">الشريط الجانبي</SelectItem>
              <SelectItem value="footer">التذييل</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={openAddDialog}
            className="bg-primary hover:bg-primary/90 text-white"
          >
            <Plus className="h-4 w-4 ml-2" />
            إضافة بنر
          </Button>
        </div>
      </div>

      {/* Banners Table */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-20 w-32" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
              ))}
            </div>
          ) : banners.length === 0 ? (
            <div className="p-12 text-center">
              <ImageIcon className="h-12 w-12 mx-auto text-gray-400" />
              <p className="text-gray-500 mt-4">لا توجد بنرات</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-32">الصورة</TableHead>
                  <TableHead>العنوان</TableHead>
                  <TableHead>الموقع</TableHead>
                  <TableHead>الترتيب</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="text-center">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {banners.map((banner, index) => (
                  <TableRow key={banner.id}>
                    <TableCell>
                      <div className="h-20 w-32 rounded-lg overflow-hidden bg-gray-100">
                        {banner.image ? (
                          <img
                            src={banner.image}
                            alt={banner.titleAr || banner.titleEn || 'Banner'}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-900">{banner.titleAr || '-'}</p>
                        <p className="text-sm text-gray-500">{banner.titleEn || '-'}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {positionLabels[banner.position] || banner.position}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleMoveOrder(banner, 'up')}
                          disabled={index === 0}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleMoveOrder(banner, 'down')}
                          disabled={index === banners.length - 1}
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <span className="text-sm text-gray-500 mr-2">{banner.order}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => handleToggleActive(banner)}
                        className={cn(
                          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium transition-colors',
                          banner.active
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        )}
                      >
                        {banner.active ? (
                          <>
                            <Eye className="h-3.5 w-3.5" />
                            نشط
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-3.5 w-3.5" />
                            مخفي
                          </>
                        )}
                      </button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(banner)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteDialog(banner)}
                          className="text-gray-500 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={addDialog || !!editDialog} onOpenChange={(open) => {
        if (!open) {
          setAddDialog(false)
          setEditDialog(null)
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editDialog ? 'تعديل البنر' : 'إضافة بنر جديد'}</DialogTitle>
            <DialogDescription>
              {editDialog ? 'قم بتعديل بيانات البنر' : 'أدخل بيانات البنر الجديد'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => handleFormSubmit(e, !!editDialog, editDialog?.id)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>العنوان (عربي)</Label>
                <Input
                  value={formData.titleAr}
                  onChange={(e) => setFormData({ ...formData, titleAr: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>العنوان (إنجليزي)</Label>
                <Input
                  value={formData.titleEn}
                  onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>العنوان الفرعي (عربي)</Label>
                <Textarea
                  value={formData.subtitleAr}
                  onChange={(e) => setFormData({ ...formData, subtitleAr: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>العنوان الفرعي (إنجليزي)</Label>
                <Textarea
                  value={formData.subtitleEn}
                  onChange={(e) => setFormData({ ...formData, subtitleEn: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>نص الزر (عربي)</Label>
                <Input
                  value={formData.buttonTextAr}
                  onChange={(e) => setFormData({ ...formData, buttonTextAr: e.target.value })}
                  placeholder="تسوقي الآن"
                />
              </div>
              <div className="space-y-2">
                <Label>نص الزر (إنجليزي)</Label>
                <Input
                  value={formData.buttonTextEn}
                  onChange={(e) => setFormData({ ...formData, buttonTextEn: e.target.value })}
                  placeholder="Shop Now"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>صورة البنر *</Label>
              <ImageUploader
                value={formData.image}
                onChange={(url) => setFormData({ ...formData, image: url })}
                folder="banners"
                placeholder="ارفع صورة البنر"
              />
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-gray-200" />
                <span className="text-xs text-gray-400">أو الصق رابط صورة</span>
                <div className="h-px flex-1 bg-gray-200" />
              </div>
              <Input
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                placeholder="https://example.com/image.jpg"
                dir="ltr"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الرابط عند الضغط</Label>
                <Input
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  placeholder="/shop أو https://..."
                />
              </div>
              <div className="space-y-2">
                <Label>الموقع</Label>
                <Select value={formData.position} onValueChange={(value) => setFormData({ ...formData, position: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hero">البنر الرئيسي</SelectItem>
                    <SelectItem value="sidebar">الشريط الجانبي</SelectItem>
                    <SelectItem value="footer">التذييل</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>الترتيب</Label>
                <Input
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value, 10) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>تاريخ البداية</Label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>تاريخ النهاية</Label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.active}
                onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
              />
              <Label>بنر نشط</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setAddDialog(false)
                setEditDialog(null)
              }}>
                إلغاء
              </Button>
              <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary/90">
                {saving ? 'جاري الحفظ...' : editDialog ? 'حفظ التغييرات' : 'إضافة البنر'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف البنر</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا البنر؟ لا يمكن التراجع عن هذا الإجراء.
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
    </div>
  )
}

export default AdminBanners
