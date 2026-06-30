'use client'

import * as React from 'react'
import {
  Search,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Filter,
  Package,
  Check,
  X,
  Star,
  Loader2,
  RefreshCw,
  AlertCircle,
  Palette,
  Ruler,
  Info,
  ImageIcon,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { MultiImageUploader } from './ImageUploader'
import { csrfFetch } from '@/lib/csrf-fetch'
import { getColorHexSafe } from '@/lib/colors'
import { MAX_PRODUCT_IMAGES, isValidHexColor } from '@/lib/constants'
import { logAdminAction } from '@/utils/adminAudit'

interface ProductImage {
  id?: string
  url: string
  alt?: string
  // Colour this image belongs to (null/undefined = shared across all colours)
  color?: string | null
  position?: number
}

interface ProductVariant {
  id: string
  name: string
  sku: string
  price?: number | null
  quantity: number
  color?: string | null
  // Stored hex for the variant colour — read back so the swatch never falls to grey
  colorHex?: string | null
  size?: string | null
}

interface Product {
  id: string
  nameAr: string
  nameEn: string
  slug: string
  sku: string
  price: number
  comparePrice?: number | null
  quantity: number
  category?: { id: string; nameEn: string; nameAr: string } | null
  categoryId: string
  images: ProductImage[]
  descriptionEn?: string
  descriptionAr?: string
  featured: boolean
  active: boolean
  createdAt: string
  updatedAt: string
  variants: ProductVariant[]
}

interface Category {
  id: string
  nameEn: string
  nameAr: string
  slug: string
}

interface ApiResponse {
  success?: boolean
  error?: string
  message?: string
  details?: string
  products?: Product[]
  product?: Product
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

function ProductRowSkeleton() {
  return (
    <TableRow>
      <TableCell><Skeleton className="h-4 w-4" /></TableCell>
      <TableCell>
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-lg" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </TableCell>
      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
      <TableCell><Skeleton className="h-4 w-12" /></TableCell>
      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
      <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
      <TableCell><Skeleton className="h-8 w-8 rounded" /></TableCell>
    </TableRow>
  )
}

export function AdminProducts() {
  const { toast } = useToast()
  const [products, setProducts] = React.useState<Product[]>([])
  const [categories, setCategories] = React.useState<Category[]>([])
  const [loading, setLoading] = React.useState(true)
  const [refreshing, setRefreshing] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [selectedCategory, setSelectedCategory] = React.useState('all')
  const [selectedStatus, setSelectedStatus] = React.useState('all')
  const [selectedProducts, setSelectedProducts] = React.useState<string[]>([])
  const [deleteDialog, setDeleteDialog] = React.useState<Product | null>(null)
  const [editDialog, setEditDialog] = React.useState<Product | null>(null)
  const [addDialog, setAddDialog] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [operationLoading, setOperationLoading] = React.useState<string | null>(null)

  // Form state for add/edit
  const [formData, setFormData] = React.useState({
    nameEn: '',
    nameAr: '',
    sku: '',
    price: '',
    comparePrice: '',
    quantity: '0',
    categoryId: '',
    descriptionEn: '',
    descriptionAr: '',
    featured: false,
    active: true,
    // Shared images shown for every colour (and for products with no colours)
    images: [] as { url: string; alt?: string }[],
    // Each colour keeps its own hex AND its own image collection
    colors: [] as { name: string; hex: string; images: { url: string; alt?: string }[] }[],
    sizes: [] as { name: string; quantity: number }[],
  })

  // Available colors and sizes for quick selection
  const predefinedColors = [
    { name: 'أسود', hex: '#000000', nameEn: 'Black' },
    { name: 'أبيض', hex: '#FFFFFF', nameEn: 'White' },
    { name: 'بيج', hex: '#F5F5DC', nameEn: 'Beige' },
    { name: 'كحلي', hex: '#191970', nameEn: 'Navy' },
    { name: 'رمادي', hex: '#808080', nameEn: 'Gray' },
    { name: 'بني', hex: '#8B4513', nameEn: 'Brown' },
    { name: 'عنابي', hex: '#722F37', nameEn: 'Burgundy' },
    { name: 'زيتي', hex: '#556B2F', nameEn: 'Olive' },
    { name: 'كريمي', hex: '#FFFDD0', nameEn: 'Cream' },
    { name: 'وردي', hex: '#FFC0CB', nameEn: 'Pink' },
    { name: 'فستقي', hex: '#93C572', nameEn: 'Pistachio' },
    { name: 'خمري', hex: '#4A0E0E', nameEn: 'Wine' },
  ]

  const predefinedSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '40', '42', '44', '46', '48', '50', '52', '54', '56', '58', '60']

  // Current tab in form
  const [formTab, setFormTab] = React.useState('basic')

  // New color/sizes input states
  const [newColorName, setNewColorName] = React.useState('')
  const [newColorHex, setNewColorHex] = React.useState('#000000')
  const [newSizeName, setNewSizeName] = React.useState('')
  const [newSizeQuantity, setNewSizeQuantity] = React.useState('0')

  const [formErrors, setFormErrors] = React.useState<Record<string, string>>({})

  // Fetch products with error handling
  const fetchProducts = React.useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)

      const response = await csrfFetch('/api/admin/products', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: ApiResponse = await response.json()

      if (data.products) {
        setProducts(data.products)
      } else {
        throw new Error('Invalid response format')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch products'
      // Handle error silently
      setError(errorMessage)
      toast({
        title: 'خطأ في التحميل',
        description: 'فشل في تحميل المنتجات. يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [toast])

  // Fetch categories
  const fetchCategories = React.useCallback(async () => {
    try {
      const response = await csrfFetch('/api/categories', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setCategories(Array.isArray(data) ? data : (data.categories || []))
    } catch (err) {
      // Handle error silently
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل الفئات',
        variant: 'destructive',
      })
    }
  }, [toast])

  // Initial load
  React.useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [fetchProducts, fetchCategories])

  // Filter products
  const filteredProducts = React.useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.nameAr.includes(searchQuery) ||
        product.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === 'all' || product.categoryId === selectedCategory
      const matchesStatus = selectedStatus === 'all' || 
        (selectedStatus === 'active' && product.active) ||
        (selectedStatus === 'inactive' && !product.active)
      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [products, searchQuery, selectedCategory, selectedStatus])

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!formData.nameAr.trim()) {
      errors.nameAr = 'الاسم بالعربية مطلوب'
    }
    if (!formData.nameEn.trim()) {
      errors.nameEn = 'الاسم بالإنجليزية مطلوب'
    }
    if (!formData.sku.trim()) {
      errors.sku = 'الرقم التسلسلي مطلوب'
    }
    if (!formData.categoryId) {
      errors.categoryId = 'الفئة مطلوبة'
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      errors.price = 'السعر يجب أن يكون أكبر من صفر'
    }
    if (formData.comparePrice && parseFloat(formData.comparePrice) <= parseFloat(formData.price)) {
      errors.comparePrice = 'سعر المقارنة يجب أن يكون أكبر من السعر الحالي'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(filteredProducts.map((p) => p.id))
    } else {
      setSelectedProducts([])
    }
  }

  // Handle select product
  const handleSelectProduct = (productId: string, checked: boolean) => {
    if (checked) {
      setSelectedProducts([...selectedProducts, productId])
    } else {
      setSelectedProducts(selectedProducts.filter((id) => id !== productId))
    }
  }

  // Bulk activate products
  const handleBulkActivate = async () => {
    if (selectedProducts.length === 0) return

    const count = selectedProducts.length
    const productIds = [...selectedProducts]
    const previousProducts = [...products]
    
    // Optimistic update
    setProducts(products.map(p =>
      productIds.includes(p.id) ? { ...p, active: true } : p
    ))
    setSelectedProducts([])

    try {
      const promises = productIds.map(id =>
        csrfFetch(`/api/admin/products/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ active: true }),
        })
      )

      await Promise.all(promises)

      toast({
        title: 'تم التفعيل',
        description: `تم تفعيل ${count} منتج بنجاح`,
      })
    } catch (err) {
      // Handle error silently
      setProducts(previousProducts)
      toast({
        title: 'خطأ',
        description: 'فشل في تفعيل المنتجات',
        variant: 'destructive',
      })
    }
  }

  // Bulk deactivate products
  const handleBulkDeactivate = async () => {
    if (selectedProducts.length === 0) return

    const count = selectedProducts.length
    const productIds = [...selectedProducts]
    const previousProducts = [...products]
    
    // Optimistic update
    setProducts(products.map(p =>
      productIds.includes(p.id) ? { ...p, active: false } : p
    ))
    setSelectedProducts([])

    try {
      const promises = productIds.map(id =>
        csrfFetch(`/api/admin/products/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ active: false }),
        })
      )

      await Promise.all(promises)

      toast({
        title: 'تم إلغاء التفعيل',
        description: `تم إلغاء تفعيل ${count} منتج بنجاح`,
      })
    } catch (err) {
      // Handle error silently
      setProducts(previousProducts)
      toast({
        title: 'خطأ',
        description: 'فشل في إلغاء تفعيل المنتجات',
        variant: 'destructive',
      })
    }
  }

  // Toggle product status
  const handleToggleStatus = async (product: Product) => {
    const newStatus = !product.active
    const previousProducts = [...products]

    // Optimistic update
    setProducts(products.map(p =>
      p.id === product.id ? { ...p, active: newStatus } : p
    ))

    try {
      setOperationLoading(`status-${product.id}`)

      const response = await csrfFetch(`/api/admin/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: newStatus }),
      })

      const data: ApiResponse = await response.json()

      if (!response.ok) {
        // Revert on error
        setProducts(previousProducts)
        throw new Error(data.error || 'Failed to update product')
      }

      toast({
        title: 'تم التحديث',
        description: `تم ${newStatus ? 'تفعيل' : 'إلغاء تفعيل'} المنتج "${product.nameAr}"`,
      })
    } catch (err) {
      // Handle error silently
      toast({
        title: 'خطأ',
        description: err instanceof Error ? err.message : 'فشل في تحديث حالة المنتج',
        variant: 'destructive',
      })
    } finally {
      setOperationLoading(null)
    }
  }

  // Toggle product featured
  const handleToggleFeatured = async (product: Product) => {
    const newFeatured = !product.featured
    const previousProducts = [...products]

    // Optimistic update
    setProducts(products.map(p =>
      p.id === product.id ? { ...p, featured: newFeatured } : p
    ))

    try {
      setOperationLoading(`featured-${product.id}`)

      const response = await csrfFetch(`/api/admin/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured: newFeatured }),
      })

      const data: ApiResponse = await response.json()

      if (!response.ok) {
        setProducts(previousProducts)
        throw new Error(data.error || 'Failed to update product')
      }

      toast({
        title: 'تم التحديث',
        description: `تم ${newFeatured ? 'إضافة' : 'إزالة'} المنتج "${product.nameAr}" ${newFeatured ? 'إلى' : 'من'} المميزة`,
      })
    } catch (err) {
      // Handle error silently
      toast({
        title: 'خطأ',
        description: err instanceof Error ? err.message : 'فشل في تحديث حالة التمييز',
        variant: 'destructive',
      })
    } finally {
      setOperationLoading(null)
    }
  }

  // Delete product
  const handleDelete = async (product: Product) => {
    try {
      setOperationLoading(`delete-${product.id}`)

      const response = await csrfFetch(`/api/admin/products/${product.id}`, {
        method: 'DELETE',
      })

      const data: ApiResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete product')
      }

      // Remove from local state
      setProducts(products.filter(p => p.id !== product.id))
      setDeleteDialog(null)

      toast({
        title: 'تم الحذف',
        description: `تم حذف المنتج "${product.nameAr}" بنجاح`,
      })
    } catch (err) {
      // Handle error silently
      toast({
        title: 'خطأ في الحذف',
        description: err instanceof Error ? err.message : 'فشل في حذف المنتج',
        variant: 'destructive',
      })
    } finally {
      setOperationLoading(null)
    }
  }

  // Open edit dialog
  const openEditDialog = (product: Product) => {
    // Extract unique colors and sizes from variants
    const uniqueColors = new Map<string, { name: string; hex: string; images: { url: string; alt?: string }[] }>()
    const uniqueSizes = new Map<string, { name: string; quantity: number }>()

    if (product.variants && product.variants.length > 0) {
      product.variants.forEach(variant => {
        if (variant.color && !uniqueColors.has(variant.color)) {
          uniqueColors.set(variant.color, {
            name: variant.color,
            // Prefer the persisted hex; only fall back to the name map when it is
            // genuinely missing/invalid. This is what stops the "always grey" bug.
            hex: isValidHexColor(variant.colorHex)
              ? (variant.colorHex as string)
              : getColorHexSafe(variant.color),
            images: [],
          })
        }
        if (variant.size && !uniqueSizes.has(variant.size)) {
          uniqueSizes.set(variant.size, {
            name: variant.size,
            quantity: variant.quantity || 0,
          })
        }
      })
    }

    // Split stored images into shared (no colour) and per-colour buckets
    const sharedImages: { url: string; alt?: string }[] = []
    product.images?.forEach(img => {
      const entry = { url: img.url, alt: img.alt ?? undefined }
      if (img.color && uniqueColors.has(img.color)) {
        uniqueColors.get(img.color)!.images.push(entry)
      } else {
        sharedImages.push(entry)
      }
    })

    setFormData({
      nameEn: product.nameEn,
      nameAr: product.nameAr,
      sku: product.sku,
      price: product.price.toString(),
      comparePrice: product.comparePrice?.toString() || '',
      quantity: product.quantity.toString(),
      categoryId: product.categoryId,
      descriptionEn: product.descriptionEn || '',
      descriptionAr: product.descriptionAr || '',
      featured: product.featured,
      active: product.active,
      images: sharedImages,
      colors: Array.from(uniqueColors.values()),
      sizes: Array.from(uniqueSizes.values()),
    })
    setFormErrors({})
    setFormTab('basic')
    setEditDialog(product)
  }

  // Open add dialog
  const openAddDialog = () => {
    setFormData({
      nameEn: '',
      nameAr: '',
      sku: '',
      price: '',
      comparePrice: '',
      quantity: '0',
      categoryId: categories[0]?.id || '',
      descriptionEn: '',
      descriptionAr: '',
      featured: false,
      active: true,
      images: [],
      colors: [],
      sizes: [],
    })
    setFormErrors({})
    setFormTab('basic')
    setAddDialog(true)
  }

  // Add color to product
  const handleAddColor = (color?: { name: string; hex: string }) => {
    const candidate = color || { name: newColorName, hex: newColorHex }
    const name = candidate.name.trim()
    const hex = candidate.hex.trim()
    if (!name) {
      toast({ title: 'خطأ', description: 'يرجى إدخال اسم اللون', variant: 'destructive' })
      return
    }
    // Guard against an invalid hex typed into the free-text field so we never
    // silently persist a wrong/grey colour.
    if (!isValidHexColor(hex)) {
      toast({ title: 'خطأ', description: 'كود اللون غير صالح (مثال: #1A2B3C)', variant: 'destructive' })
      return
    }
    if (formData.colors.some(c => c.name === name)) {
      toast({ title: 'خطأ', description: 'هذا اللون موجود بالفعل', variant: 'destructive' })
      return
    }
    // Normalise to uppercase hex and start with an empty image collection
    setFormData({ ...formData, colors: [...formData.colors, { name, hex: hex.toUpperCase(), images: [] }] })
    setNewColorName('')
    setNewColorHex('#000000')
  }

  // Remove color from product
  const handleRemoveColor = (colorName: string) => {
    setFormData({ ...formData, colors: formData.colors.filter(c => c.name !== colorName) })
  }

  // Update the image collection for a specific colour (Feature: per-colour images)
  const handleColorImagesChange = (colorName: string, images: { url: string; alt?: string }[]) => {
    setFormData(prev => ({
      ...prev,
      colors: prev.colors.map(c => (c.name === colorName ? { ...c, images } : c)),
    }))
  }

  // Live total image count (shared + every colour) used by the UI counter and limit hint
  const totalImageCount =
    formData.images.length + formData.colors.reduce((sum, c) => sum + c.images.length, 0)

  // Add size to product
  const handleAddSize = (sizeName?: string) => {
    const name = sizeName || newSizeName
    const quantity = parseInt(newSizeQuantity, 10) || 0
    if (!name.trim()) {
      toast({ title: 'خطأ', description: 'يرجى إدخال اسم المقاس', variant: 'destructive' })
      return
    }
    if (formData.sizes.some(s => s.name === name)) {
      toast({ title: 'خطأ', description: 'هذا المقاس موجود بالفعل', variant: 'destructive' })
      return
    }
    setFormData({ ...formData, sizes: [...formData.sizes, { name, quantity }] })
    setNewSizeName('')
    setNewSizeQuantity('0')
  }

  // Remove size from product
  const handleRemoveSize = (sizeName: string) => {
    setFormData({ ...formData, sizes: formData.sizes.filter(s => s.name !== sizeName) })
  }

  // Update size quantity
  const handleUpdateSizeQuantity = (sizeName: string, quantity: number) => {
    setFormData({
      ...formData,
      sizes: formData.sizes.map(s => s.name === sizeName ? { ...s, quantity } : s)
    })
  }

  // Handle form submit
  const handleFormSubmit = async (e: React.FormEvent, isEdit: boolean, productId?: string) => {
    e.preventDefault()

    if (!validateForm()) {
      toast({
        title: 'خطأ في البيانات',
        description: 'يرجى ملء جميع الحقول المطلوبة بشكل صحيح',
        variant: 'destructive',
      })
      return
    }

    setSaving(true)

    try {
      const slug = formData.nameEn
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')

      // Generate variants from colors and sizes.
      // IMPORTANT: every colour variant carries its picked `colorHex`. This is the
      // root-cause fix for the "always grey" bug — the hex used to be dropped here.
      const variants: { name: string; sku: string; color?: string; colorHex?: string; size?: string; quantity: number }[] = []
      
      if (formData.colors.length > 0 && formData.sizes.length > 0) {
        // Create variants for each color × size combination
        formData.colors.forEach((color) => {
          formData.sizes.forEach((size) => {
            const variantSku = `${formData.sku}-${color.name.substring(0, 3).toUpperCase()}-${size.name}`
            variants.push({
              name: `${color.name} - ${size.name}`,
              sku: variantSku,
              color: color.name,
              colorHex: color.hex,
              size: size.name,
              quantity: size.quantity,
            })
          })
        })
      } else if (formData.colors.length > 0) {
        // Only colors, no sizes
        formData.colors.forEach((color) => {
          const variantSku = `${formData.sku}-${color.name.substring(0, 3).toUpperCase()}`
          variants.push({
            name: color.name,
            sku: variantSku,
            color: color.name,
            colorHex: color.hex,
            quantity: parseInt(formData.quantity, 10) || 0,
          })
        })
      } else if (formData.sizes.length > 0) {
        // Only sizes, no colors
        formData.sizes.forEach((size) => {
          const variantSku = `${formData.sku}-${size.name}`
          variants.push({
            name: size.name,
            sku: variantSku,
            size: size.name,
            quantity: size.quantity,
          })
        })
      }

      // Assemble the final image list: shared images (no colour tag) followed by
      // each colour's own images (tagged with the colour name). This powers the
      // colour-based gallery on the storefront.
      const taggedImages: { url: string; alt?: string; color?: string | null }[] = [
        ...formData.images.map(img => ({ ...img, color: null })),
        ...formData.colors.flatMap(color =>
          color.images.map(img => ({ ...img, color: color.name }))
        ),
      ]

      // Enforce the 10-image limit before hitting the API (clear, early feedback)
      if (taggedImages.length > MAX_PRODUCT_IMAGES) {
        toast({
          title: 'عدد الصور كبير جدًا',
          description: `الحد الأقصى ${MAX_PRODUCT_IMAGES} صور لكل منتج (الصور المشتركة + صور الألوان). لديك حاليًا ${taggedImages.length}.`,
          variant: 'destructive',
        })
        setSaving(false)
        return
      }

      // Calculate total quantity from sizes or variants
      const totalQuantity = formData.sizes.length > 0 
        ? formData.sizes.reduce((sum, s) => sum + s.quantity, 0)
        : parseInt(formData.quantity, 10) || 0

      const payload = {
        nameEn: formData.nameEn.trim(),
        nameAr: formData.nameAr.trim(),
        slug: isEdit ? undefined : slug,
        sku: formData.sku.trim(),
        price: parseFloat(formData.price),
        comparePrice: formData.comparePrice ? parseFloat(formData.comparePrice) : null,
        quantity: totalQuantity,
        categoryId: formData.categoryId,
        descriptionEn: formData.descriptionEn.trim(),
        descriptionAr: formData.descriptionAr.trim(),
        featured: formData.featured,
        active: formData.active,
        images: taggedImages,
        variants: variants.length > 0 ? variants : undefined,
      }

      const url = isEdit
        ? `/api/admin/products/${productId}`
        : '/api/admin/products'

      const response = await csrfFetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data: ApiResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to save product')
      }

      toast({
        title: isEdit ? 'تم التحديث' : 'تمت الإضافة',
        description: isEdit
          ? `تم تحديث المنتج "${formData.nameAr}" بنجاح`
          : `تم إضافة المنتج "${formData.nameAr}" بنجاح`,
      })

      // Audit log
      try {
        const savedId = (data.product?.id) ?? (data.products?.[0]?.id)
        logAdminAction('Products', isEdit ? 'Updated product' : 'Added product', {
          id: savedId,
          nameAr: formData.nameAr,
          nameEn: formData.nameEn,
          categoryId: formData.categoryId,
          price: formData.price,
          slug: slug,
        })
      } catch (err) {
        // Audit logging must never block the save flow, but failures should be observable
        console.error('Audit log failed:', err)
      }

      // Refresh products list
      await fetchProducts()

      setEditDialog(null)
      setAddDialog(false)
    } catch (err) {
      // Handle error silently
      toast({
        title: 'خطأ في الحفظ',
        description: err instanceof Error ? err.message : 'فشل في حفظ المنتج',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  // Close dialog and reset
  const closeDialog = () => {
    setAddDialog(false)
    setEditDialog(null)
    setFormErrors({})
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">إدارة المنتجات</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {products.length} منتج في المتجر
            {filteredProducts.length !== products.length && ` • ${filteredProducts.length} نتيجة`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchProducts(true)}
            disabled={refreshing}
            title="تحديث"
          >
            <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
          </Button>
          <Button
            onClick={openAddDialog}
            className="bg-primary hover:bg-primary/90 text-white"
          >
            <Plus className="h-4 w-4 ml-2" />
            إضافة منتج
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <div className="flex-1">
              <p className="text-red-700 font-medium">خطأ في تحميل البيانات</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => fetchProducts()}>
              إعادة المحاولة
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Filters Card */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <Input
                type="search"
                placeholder="بحث عن منتج (بالاسم أو الرقم التسلسلي)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 bg-muted border-border"
              />
            </div>

            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-44 bg-muted border-border">
                <Filter className="h-4 w-4 ml-2" />
                <SelectValue placeholder="الفئة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الفئات</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.nameAr}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full md:w-36 bg-muted border-border">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="active">نشط</SelectItem>
                <SelectItem value="inactive">غير نشط</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bulk Actions */}
          {selectedProducts.length > 0 && (
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
              <span className="text-sm text-muted-foreground">
                {selectedProducts.length} منتج محدد
              </span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleBulkActivate}
                className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
              >
                <Check className="h-4 w-4 ml-1" />
                تفعيل المحدد
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleBulkDeactivate}
                className="text-muted-foreground border-border hover:bg-muted"
              >
                <X className="h-4 w-4 ml-1" />
                إلغاء التفعيل
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted hover:bg-muted">
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="text-muted-foreground">المنتج</TableHead>
                  <TableHead className="text-muted-foreground">الرقم التسلسلي</TableHead>
                  <TableHead className="text-muted-foreground">السعر</TableHead>
                  <TableHead className="text-muted-foreground">المخزون</TableHead>
                  <TableHead className="text-muted-foreground">الفئة</TableHead>
                  <TableHead className="text-muted-foreground">الحالة</TableHead>
                  <TableHead className="text-muted-foreground text-center">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <ProductRowSkeleton key={i} />
                  ))
                ) : filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                          <Package className="h-8 w-8 text-muted" />
                        </div>
                        <p className="text-muted-foreground font-medium">
                          {searchQuery || selectedCategory !== 'all' || selectedStatus !== 'all'
                            ? 'لا توجد نتائج مطابقة'
                            : 'لا توجد منتجات'}
                        </p>
                        <Button variant="outline" size="sm" onClick={openAddDialog}>
                          إضافة منتج جديد
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => (
                    <TableRow key={product.id} className="hover:bg-muted">
                      <TableCell>
                        <Checkbox
                          checked={selectedProducts.includes(product.id)}
                          onCheckedChange={(checked) =>
                            handleSelectProduct(product.id, checked as boolean)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12 rounded-lg border border-gray-100">
                            <AvatarImage src={product.images?.[0]?.url} alt={product.nameAr} />
                            <AvatarFallback className="rounded-lg bg-primary/10 text-primary">
                              <Package className="h-5 w-5" />
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-foreground">{product.nameAr}</p>
                            <p className="text-sm text-muted-foreground">{product.nameEn}</p>
                            <div className="flex gap-1 mt-1">
                              {product.featured && (
                                <Badge className="bg-amber-100 text-amber-700 text-xs">
                                  <Star className="h-3 w-3 ml-1" />
                                  مميز
                                </Badge>
                              )}
                              {product.quantity <= 0 && (
                                <Badge className="bg-red-100 text-red-700 text-xs">
                                  نفذ المخزون
                                </Badge>
                              )}
                              {product.quantity > 0 && product.quantity < 10 && (
                                <Badge className="bg-orange-100 text-orange-700 text-xs">
                                  مخزون منخفض
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground font-mono text-sm">
                        {product.sku}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">{product.price.toLocaleString()} ج.م</p>
                          {product.comparePrice && (
                            <p className="text-sm text-muted line-through">
                              {product.comparePrice.toLocaleString()} ج.م
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            'font-medium',
                            product.quantity === 0
                              ? 'text-red-600'
                              : product.quantity < 10
                                ? 'text-amber-600'
                                : 'text-foreground'
                          )}
                        >
                          {product.quantity}
                        </span>
                        {product.variants && product.variants.length > 0 && (
                          <span className="text-xs text-muted block">
                            {product.variants.length} متغيرات
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-border text-muted-foreground">
                          {product.category?.nameAr || '-'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => handleToggleStatus(product)}
                          disabled={operationLoading === `status-${product.id}`}
                          className={cn(
                            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium transition-colors disabled:opacity-50',
                            product.active
                              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                              : 'bg-muted text-muted-foreground hover:bg-gray-200'
                          )}
                        >
                          {operationLoading === `status-${product.id}` ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : product.active ? (
                            <>
                              <Check className="h-3.5 w-3.5" />
                              نشط
                            </>
                          ) : (
                            <>
                              <X className="h-3.5 w-3.5" />
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
                            onClick={() => openEditDialog(product)}
                            className="text-muted-foreground hover:text-foreground"
                            title="تعديل"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-muted-foreground">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleToggleFeatured(product)}
                                disabled={operationLoading === `featured-${product.id}`}
                              >
                                {product.featured ? (
                                  <>
                                    <EyeOff className="h-4 w-4 ml-2" />
                                    إزالة من المميزة
                                  </>
                                ) : (
                                  <>
                                    <Star className="h-4 w-4 ml-2" />
                                    إضافة للمميزة
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEditDialog(product)}>
                                <Edit className="h-4 w-4 ml-2" />
                                تعديل
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600 focus:bg-red-50"
                                onClick={() => setDeleteDialog(product)}
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
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف المنتج</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف "{deleteDialog?.nameAr}"؟
              <br />
              <span className="text-red-500 text-sm">هذا الإجراء لا يمكن التراجع عنه وسيحذف جميع الصور والمتغيرات المرتبطة.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={() => deleteDialog && handleDelete(deleteDialog)}
              disabled={operationLoading?.startsWith('delete-')}
            >
              {operationLoading?.startsWith('delete-') ? (
                <>
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  جاري الحذف...
                </>
              ) : (
                'حذف'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add/Edit Product Dialog with Tabs */}
      <Dialog open={addDialog || !!editDialog} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editDialog ? 'تعديل المنتج' : 'إضافة منتج جديد'}</DialogTitle>
            <DialogDescription>
              {editDialog ? `تعديل بيانات المنتج "${editDialog.nameAr}"` : 'أدخل بيانات المنتج الجديد'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => handleFormSubmit(e, !!editDialog, editDialog?.id)}>
            <Tabs value={formTab} onValueChange={setFormTab} className="w-full">
              <TabsList className="grid grid-cols-4 mb-4">
                <TabsTrigger value="basic" className="flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  <span className="hidden sm:inline">البيانات الأساسية</span>
                  <span className="sm:hidden">الأساسية</span>
                </TabsTrigger>
                <TabsTrigger value="colors" className="flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  <span className="hidden sm:inline">الألوان</span>
                  <span className="sm:hidden">الألوان</span>
                </TabsTrigger>
                <TabsTrigger value="sizes" className="flex items-center gap-2">
                  <Ruler className="h-4 w-4" />
                  <span className="hidden sm:inline">المقاسات</span>
                  <span className="sm:hidden">المقاسات</span>
                </TabsTrigger>
                <TabsTrigger value="images" className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">الصور</span>
                  <span className="sm:hidden">الصور</span>
                </TabsTrigger>
              </TabsList>

              {/* Basic Info Tab */}
              <TabsContent value="basic" className="space-y-4 mt-0">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nameAr" className="flex items-center gap-1">
                      الاسم بالعربية <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="nameAr"
                      value={formData.nameAr}
                      onChange={(e) => {
                        setFormData({ ...formData, nameAr: e.target.value })
                        if (formErrors.nameAr) setFormErrors({ ...formErrors, nameAr: '' })
                      }}
                      className={cn(formErrors.nameAr && 'border-red-500')}
                      placeholder="عباية كلاسيكية"
                    />
                    {formErrors.nameAr && (
                      <p className="text-xs text-red-500">{formErrors.nameAr}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nameEn" className="flex items-center gap-1">
                      الاسم بالإنجليزية <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="nameEn"
                      value={formData.nameEn}
                      onChange={(e) => {
                        setFormData({ ...formData, nameEn: e.target.value })
                        if (formErrors.nameEn) setFormErrors({ ...formErrors, nameEn: '' })
                      }}
                      className={cn(formErrors.nameEn && 'border-red-500')}
                      placeholder="Classic Abaya"
                      dir="ltr"
                    />
                    {formErrors.nameEn && (
                      <p className="text-xs text-red-500">{formErrors.nameEn}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sku" className="flex items-center gap-1">
                      الرقم التسلسلي (SKU) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="sku"
                      value={formData.sku}
                      onChange={(e) => {
                        setFormData({ ...formData, sku: e.target.value })
                        if (formErrors.sku) setFormErrors({ ...formErrors, sku: '' })
                      }}
                      className={cn(formErrors.sku && 'border-red-500')}
                      placeholder="ABY-001"
                      dir="ltr"
                    />
                    {formErrors.sku && (
                      <p className="text-xs text-red-500">{formErrors.sku}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category" className="flex items-center gap-1">
                      الفئة <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.categoryId}
                      onValueChange={(value) => {
                        setFormData({ ...formData, categoryId: value })
                        if (formErrors.categoryId) setFormErrors({ ...formErrors, categoryId: '' })
                      }}
                    >
                      <SelectTrigger className={cn(formErrors.categoryId && 'border-red-500')}>
                        <SelectValue placeholder="اختر الفئة" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.nameAr} ({cat.nameEn})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.categoryId && (
                      <p className="text-xs text-red-500">{formErrors.categoryId}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price" className="flex items-center gap-1">
                      السعر (ج.م) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => {
                        setFormData({ ...formData, price: e.target.value })
                        if (formErrors.price) setFormErrors({ ...formErrors, price: '' })
                      }}
                      className={cn(formErrors.price && 'border-red-500')}
                      placeholder="299"
                    />
                    {formErrors.price && (
                      <p className="text-xs text-red-500">{formErrors.price}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="comparePrice">السعر قبل الخصم (ج.م)</Label>
                    <Input
                      id="comparePrice"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.comparePrice}
                      onChange={(e) => {
                        setFormData({ ...formData, comparePrice: e.target.value })
                        if (formErrors.comparePrice) setFormErrors({ ...formErrors, comparePrice: '' })
                      }}
                      className={cn(formErrors.comparePrice && 'border-red-500')}
                      placeholder="399"
                    />
                    {formErrors.comparePrice && (
                      <p className="text-xs text-red-500">{formErrors.comparePrice}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quantity">الكمية</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="0"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descriptionAr">الوصف بالعربية</Label>
                  <Textarea
                    id="descriptionAr"
                    value={formData.descriptionAr}
                    onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                    rows={3}
                    placeholder="وصف تفصيلي للمنتج بالعربية..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descriptionEn">الوصف بالإنجليزية</Label>
                  <Textarea
                    id="descriptionEn"
                    value={formData.descriptionEn}
                    onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                    rows={3}
                    placeholder="Detailed product description in English..."
                    dir="ltr"
                  />
                </div>

                <div className="flex gap-6 pt-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="featured"
                      checked={formData.featured}
                      onCheckedChange={(checked) => setFormData({ ...formData, featured: checked as boolean })}
                    />
                    <Label htmlFor="featured" className="cursor-pointer font-normal">
                      منتج مميز
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="active"
                      checked={formData.active}
                      onCheckedChange={(checked) => setFormData({ ...formData, active: checked as boolean })}
                    />
                    <Label htmlFor="active" className="cursor-pointer font-normal">
                      نشط
                    </Label>
                  </div>
                </div>
              </TabsContent>

              {/* Colors Tab */}
              <TabsContent value="colors" className="space-y-4 mt-0">
                <div className="bg-muted rounded-lg p-4">
                  <h3 className="font-medium mb-3">إضافة لون جديد</h3>
                  <div className="flex gap-3 items-end">
                    <div className="flex-1">
                      <Label htmlFor="colorName">اسم اللون</Label>
                      <Input
                        id="colorName"
                        value={newColorName}
                        onChange={(e) => setNewColorName(e.target.value)}
                        placeholder="مثال: أسود، أبيض، بيج..."
                      />
                    </div>
                    <div className="w-24">
                      <Label htmlFor="colorHex">الكود</Label>
                      <div className="flex gap-2 items-center">
                        <Input
                          id="colorHex"
                          type="color"
                          value={newColorHex}
                          onChange={(e) => setNewColorHex(e.target.value)}
                          className="w-12 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          value={newColorHex}
                          onChange={(e) => setNewColorHex(e.target.value)}
                          className="flex-1"
                          placeholder="#000000"
                        />
                      </div>
                    </div>
                    <Button type="button" onClick={() => handleAddColor()} className="bg-primary">
                      <Plus className="h-4 w-4 ml-1" />
                      إضافة
                    </Button>
                  </div>
                </div>

                {/* Predefined Colors */}
                <div className="bg-muted rounded-lg p-4">
                  <h3 className="font-medium mb-3">ألوان جاهزة (اضغط للإضافة)</h3>
                  <div className="flex flex-wrap gap-2">
                    {predefinedColors.map((color) => (
                      <button
                        key={color.hex}
                        type="button"
                        onClick={() => handleAddColor({ name: color.name, hex: color.hex })}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border hover:border-primary bg-white transition-colors"
                      >
                        <span
                          className="w-4 h-4 rounded-full border border-gray-300"
                          style={{ backgroundColor: color.hex }}
                        />
                        <span className="text-sm">{color.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Selected Colors */}
                <div className="bg-muted rounded-lg p-4">
                  <h3 className="font-medium mb-3">الألوان المحددة ({formData.colors.length})</h3>
                  {formData.colors.length === 0 ? (
                    <p className="text-muted-foreground text-sm">لم يتم إضافة ألوان بعد</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {formData.colors.map((color) => (
                        <div
                          key={color.name}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20"
                        >
                          <span
                            className="w-4 h-4 rounded-full border border-gray-300"
                            style={{ backgroundColor: color.hex }}
                          />
                          <span className="text-sm font-medium">{color.name}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveColor(color.name)}
                            className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Sizes Tab */}
              <TabsContent value="sizes" className="space-y-4 mt-0">
                <div className="bg-muted rounded-lg p-4">
                  <h3 className="font-medium mb-3">إضافة مقاس جديد</h3>
                  <div className="flex gap-3 items-end">
                    <div className="flex-1">
                      <Label htmlFor="sizeName">اسم المقاس</Label>
                      <Input
                        id="sizeName"
                        value={newSizeName}
                        onChange={(e) => setNewSizeName(e.target.value)}
                        placeholder="مثال: S, M, L, XL, 42, 44..."
                      />
                    </div>
                    <div className="w-32">
                      <Label htmlFor="sizeQuantity">الكمية</Label>
                      <Input
                        id="sizeQuantity"
                        type="number"
                        min="0"
                        value={newSizeQuantity}
                        onChange={(e) => setNewSizeQuantity(e.target.value)}
                        placeholder="0"
                      />
                    </div>
                    <Button type="button" onClick={() => handleAddSize()} className="bg-primary">
                      <Plus className="h-4 w-4 ml-1" />
                      إضافة
                    </Button>
                  </div>
                </div>

                {/* Predefined Sizes */}
                <div className="bg-muted rounded-lg p-4">
                  <h3 className="font-medium mb-3">مقاسات جاهزة (اضغط للإضافة)</h3>
                  <div className="flex flex-wrap gap-2">
                    {predefinedSizes.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => handleAddSize(size)}
                        disabled={formData.sizes.some(s => s.name === size)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg border font-medium transition-colors",
                          formData.sizes.some(s => s.name === size)
                            ? "bg-primary/10 border-primary/20 text-primary"
                            : "bg-white border-border hover:border-primary"
                        )}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Selected Sizes */}
                <div className="bg-muted rounded-lg p-4">
                  <h3 className="font-medium mb-3">المقاسات المحددة ({formData.sizes.length})</h3>
                  {formData.sizes.length === 0 ? (
                    <p className="text-muted-foreground text-sm">لم يتم إضافة مقاسات بعد</p>
                  ) : (
                    <div className="space-y-2">
                      {formData.sizes.map((size) => (
                        <div
                          key={size.name}
                          className="flex items-center justify-between p-3 rounded-lg bg-white border border-border"
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-medium">{size.name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <Label className="text-sm text-muted-foreground">الكمية:</Label>
                              <Input
                                type="number"
                                min="0"
                                value={size.quantity}
                                onChange={(e) => handleUpdateSizeQuantity(size.name, parseInt(e.target.value, 10) || 0)}
                                className="w-20 h-8"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveSize(size.name)}
                              className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Images Tab */}
              <TabsContent value="images" className="space-y-4 mt-0">
                {/* Shared images (shown for every colour) */}
                <div className="bg-muted rounded-lg p-4">
                  <h3 className="font-medium mb-1">الصور المشتركة</h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    تظهر هذه الصور لكل الألوان. الصورة الأولى هي الصورة الرئيسية.
                  </p>
                  <MultiImageUploader
                    value={formData.images}
                    onChange={(images) => setFormData({ ...formData, images })}
                    folder="products"
                    maxImages={MAX_PRODUCT_IMAGES}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    الحد الأقصى {MAX_PRODUCT_IMAGES} صور لكل منتج (الصور المشتركة + صور الألوان معًا).
                  </p>
                </div>

                {/* Per-colour images — appear automatically for each colour added in the Colours tab */}
                {formData.colors.length > 0 && (
                  <div className="bg-muted rounded-lg p-4 space-y-5">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">صور خاصة بكل لون</h3>
                      <span className="text-xs text-muted-foreground">
                        الإجمالي: {totalImageCount} / {MAX_PRODUCT_IMAGES}
                      </span>
                    </div>
                    {totalImageCount > MAX_PRODUCT_IMAGES && (
                      <p className="text-xs text-red-600">
                        تجاوزت الحد الأقصى ({MAX_PRODUCT_IMAGES} صور). يرجى حذف بعض الصور قبل الحفظ.
                      </p>
                    )}
                    {formData.colors.map((color) => (
                      <div key={color.name} className="rounded-lg border border-border bg-background p-3">
                        <div className="flex items-center gap-2 mb-3">
                          <span
                            className="w-4 h-4 rounded-full border border-gray-300"
                            style={{ backgroundColor: color.hex }}
                          />
                          <span className="text-sm font-medium">{color.name}</span>
                        </div>
                        <MultiImageUploader
                          value={color.images}
                          onChange={(images) => handleColorImagesChange(color.name, images)}
                          folder="products"
                          maxImages={MAX_PRODUCT_IMAGES}
                        />
                      </div>
                    ))}
                    <p className="text-xs text-muted-foreground">
                      عند اختيار لون في صفحة المنتج، سيتم عرض صور هذا اللون. إذا لم تُضف صورًا للون،
                      ستظهر الصور المشتركة.
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <DialogFooter className="pt-4 border-t mt-4">
              <Button type="button" variant="outline" onClick={closeDialog}>
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-primary hover:bg-primary/90 min-w-[120px]"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                    جاري الحفظ...
                  </>
                ) : editDialog ? (
                  'حفظ التغييرات'
                ) : (
                  'إضافة المنتج'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AdminProducts
