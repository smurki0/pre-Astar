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
import { Textarea } from '@/components/ui/textarea'
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
  Folder,
  Package,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { csrfFetch } from '@/lib/csrf-fetch'
import { ImageUploader } from '@/components/estar/ImageUploader'

interface Category {
  id: string
  nameEn: string
  nameAr: string
  slug: string
  descriptionEn: string | null
  descriptionAr: string | null
  image: string | null
  parentId: string | null
  _count?: {
    products: number
  }
  createdAt: string
}

export function AdminCategories() {
  const { toast } = useToast()
  const [categories, setCategories] = React.useState<Category[]>([])
  const [loading, setLoading] = React.useState(true)
  const [editDialog, setEditDialog] = React.useState<Category | null>(null)
  const [addDialog, setAddDialog] = React.useState(false)
  const [deleteDialog, setDeleteDialog] = React.useState<Category | null>(null)
  const [saving, setSaving] = React.useState(false)

  // Form state
  const [formData, setFormData] = React.useState({
    nameEn: '',
    nameAr: '',
    slug: '',
    descriptionEn: '',
    descriptionAr: '',
    image: '',
    parentId: '',
  })

  // Fetch categories
  const fetchCategories = React.useCallback(async () => {
    try {
      setLoading(true)
      const response = await csrfFetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories || data || [])
      }
    } catch (error) {
      // Handle error silently
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل الفئات',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  React.useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  // Open edit dialog
  const openEditDialog = (category: Category) => {
    setFormData({
      nameEn: category.nameEn,
      nameAr: category.nameAr,
      slug: category.slug,
      descriptionEn: category.descriptionEn || '',
      descriptionAr: category.descriptionAr || '',
      image: category.image || '',
      parentId: category.parentId || '',
    })
    setEditDialog(category)
  }

  // Open add dialog
  const openAddDialog = () => {
    setFormData({
      nameEn: '',
      nameAr: '',
      slug: '',
      descriptionEn: '',
      descriptionAr: '',
      image: '',
      parentId: '',
    })
    setAddDialog(true)
  }

  // Generate slug from English name
  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  }

  // Handle form submit
  const handleFormSubmit = async (e: React.FormEvent, isEdit: boolean, categoryId?: string) => {
    e.preventDefault()
    setSaving(true)

    try {
      const slug = formData.slug || generateSlug(formData.nameEn)
      
      const payload = {
        nameEn: formData.nameEn,
        nameAr: formData.nameAr,
        slug,
        descriptionEn: formData.descriptionEn || null,
        descriptionAr: formData.descriptionAr || null,
        image: formData.image || null,
        parentId: formData.parentId || null,
      }

      const url = isEdit ? `/api/categories/${categoryId}` : '/api/categories'
      const method = isEdit ? 'PUT' : 'POST'

      const response = await csrfFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        toast({
          title: isEdit ? 'تم التحديث' : 'تمت الإضافة',
          description: isEdit ? 'تم تحديث الفئة بنجاح' : 'تم إضافة الفئة بنجاح',
        })
        fetchCategories()
        setEditDialog(null)
        setAddDialog(false)
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed')
      }
    } catch (error) {
      // Handle error silently
      toast({
        title: 'خطأ',
        description: 'فشل في حفظ الفئة',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  // Delete category
  const handleDelete = async (category: Category) => {
    try {
      const response = await csrfFetch(`/api/categories/${category.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setCategories(categories.filter(c => c.id !== category.id))
        setDeleteDialog(null)
        toast({
          title: 'تم الحذف',
          description: 'تم حذف الفئة بنجاح',
        })
      } else {
        const error = await response.json()
        toast({
          title: 'خطأ',
          description: error.error || 'فشل في حذف الفئة',
          variant: 'destructive',
        })
      }
    } catch (error) {
      // Handle error silently
      toast({
        title: 'خطأ',
        description: 'فشل في حذف الفئة',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">إدارة الفئات</h1>
          <p className="text-gray-500 text-sm mt-1">
            {categories.length} فئة في المتجر
          </p>
        </div>
        <Button
          onClick={openAddDialog}
          className="bg-primary hover:bg-primary/90 text-white"
        >
          <Plus className="h-4 w-4 ml-2" />
          إضافة فئة
        </Button>
      </div>

      {/* Categories Table */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="p-12 text-center">
              <Folder className="h-12 w-12 mx-auto text-gray-400" />
              <p className="text-gray-500 mt-4">لا توجد فئات</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-16">الصورة</TableHead>
                  <TableHead>اسم الفئة</TableHead>
                  <TableHead>الرابط (Slug)</TableHead>
                  <TableHead>عدد المنتجات</TableHead>
                  <TableHead className="text-center">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>
                      <div className="h-12 w-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                        {category.image ? (
                          <img
                            src={category.image}
                            alt={category.nameAr}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Folder className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-900">{category.nameAr}</p>
                        <p className="text-sm text-gray-500">{category.nameEn}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-gray-500">
                      {category.slug}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1">
                        <Package className="h-3 w-3" />
                        {category._count?.products || 0}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(category)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteDialog(category)}
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editDialog ? 'تعديل الفئة' : 'إضافة فئة جديدة'}</DialogTitle>
            <DialogDescription>
              {editDialog ? 'قم بتعديل بيانات الفئة' : 'أدخل بيانات الفئة الجديدة'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => handleFormSubmit(e, !!editDialog, editDialog?.id)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الاسم (عربي) *</Label>
                <Input
                  value={formData.nameAr}
                  onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>الاسم (إنجليزي) *</Label>
                <Input
                  value={formData.nameEn}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      nameEn: e.target.value,
                      slug: formData.slug || generateSlug(e.target.value),
                    })
                  }}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>الرابط (Slug)</Label>
              <Input
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="category-slug"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الوصف (عربي)</Label>
                <Textarea
                  value={formData.descriptionAr}
                  onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>الوصف (إنجليزي)</Label>
                <Textarea
                  value={formData.descriptionEn}
                  onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>صورة الفئة</Label>
              <ImageUploader
                value={formData.image}
                onChange={(url) => setFormData({ ...formData, image: url })}
                folder="categories"
                placeholder="ارفع صورة الفئة"
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
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setAddDialog(false)
                setEditDialog(null)
              }}>
                إلغاء
              </Button>
              <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary/90">
                {saving ? 'جاري الحفظ...' : editDialog ? 'حفظ التغييرات' : 'إضافة الفئة'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف الفئة</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف الفئة "{deleteDialog?.nameAr}"؟
              {deleteDialog?._count?.products ? ` يوجد ${deleteDialog._count.products} منتج في هذه الفئة.` : ''}
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

export default AdminCategories
