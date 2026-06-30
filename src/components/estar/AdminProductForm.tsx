'use client'

import * as React from 'react'
import {
  X,
  Plus,
  Upload,
  Trash2,
  ImageIcon,
  ChevronDown,
  Save,
  ArrowRight,
  Palette,
  Ruler,
  Sparkles,
  Check,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { cn } from '@/lib/utils'

export interface ProductColorSelection {
  id: string
  name: string
  nameEn: string
  hex: string
}

export interface ProductVariant {
  id: string
  name: string
  sku: string
  price: string
  quantity: string
  color: string
  colorName: string
  size: string
  colorHex?: string
}

export interface ProductFormData {
  nameAr: string
  nameEn: string
  descriptionAr: string
  descriptionEn: string
  price: string
  comparePrice: string
  costPrice: string
  sku: string
  barcode: string
  quantity: string
  categoryId: string
  images: string[]
  variants: ProductVariant[]
  featured: boolean
  active: boolean
  selectedColors: ProductColorSelection[]
  selectedSizes: string[]
}

interface AdminProductFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: ProductFormData | null
  categories: { id: string; nameAr: string; nameEn: string }[]
  onSubmit?: (data: ProductFormData) => void
}

const defaultFormData: ProductFormData = {
  nameAr: '',
  nameEn: '',
  descriptionAr: '',
  descriptionEn: '',
  price: '',
  comparePrice: '',
  costPrice: '',
  sku: '',
  barcode: '',
  quantity: '',
  categoryId: '',
  images: [],
  variants: [],
  featured: false,
  active: true,
  selectedColors: [],
  selectedSizes: [],
}

import { predefinedColors } from '@/lib/colors'

// Predefined colors from lib (70+ colors)
const availableColors = predefinedColors.map((color, index) => ({
  id: color.nameAr.toLowerCase().replace(/\\s+/g, '-'),
  name: color.nameAr,
  nameEn: color.nameEn,
  hex: color.hex
}))
const availableSizes = [
  // Standard sizes
  'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '4XL', '5XL',
  // Numeric sizes
  '36', '38', '40', '42', '44', '46', '48', '50', '52', '54', '56', '58', '60',
  // Kids sizes
  '2-3 Years', '3-4 Years', '4-5 Years', '5-6 Years', '6-7 Years', '7-8 Years',
  // Plus sizes
  'Plus 1X', 'Plus 2X', 'Plus 3X',
  // Specialty sizes
  'One Size', 'Free Size', 'Small', 'Medium', 'Large',
]

// Size categories for better organization
const sizeCategories = {
  standard: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '4XL', '5XL'],
  numeric: ['36', '38', '40', '42', '44', '46', '48', '50', '52', '54', '56', '58', '60'],
  kids: ['2-3 Years', '3-4 Years', '4-5 Years', '5-6 Years', '6-7 Years', '7-8 Years'],
  plus: ['Plus 1X', 'Plus 2X', 'Plus 3X'],
  specialty: ['One Size', 'Free Size', 'Small', 'Medium', 'Large'],
}

export function AdminProductForm({
  open,
  onOpenChange,
  product,
  categories,
  onSubmit,
}: AdminProductFormProps) {
  const [formData, setFormData] = React.useState<ProductFormData>(product || defaultFormData)
  const [activeTab, setActiveTab] = React.useState('basic')
  const [newVariant, setNewVariant] = React.useState<Partial<ProductVariant>>({})
  const [customColorName, setCustomColorName] = React.useState('')
  const [customColorNameEn, setCustomColorNameEn] = React.useState('')
  const [customColorHex, setCustomColorHex] = React.useState('#000000')
  const [variantQuantity, setVariantQuantity] = React.useState('10')

  React.useEffect(() => {
    if (product) {
      setFormData(product)
    } else {
      setFormData(defaultFormData)
    }
  }, [product, open])

  const handleChange = (field: keyof ProductFormData, value: string | boolean | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      // In a real app, you would upload to a server and get URLs
      // For demo, we'll use placeholder URLs
      const newImages = Array.from(files).map(
        (_, index) => `/products/placeholder-${Date.now()}-${index}.jpg`
      )
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...newImages],
      }))
    }
  }

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }))
  }

  // Maximum colors limit
  const MAX_COLORS = 15

  // Toggle color selection
  const toggleColor = (color: typeof availableColors[0]) => {
    setFormData((prev) => {
      const isSelected = prev.selectedColors.some((c) => c.id === color.id)
      if (isSelected) {
        return {
          ...prev,
          selectedColors: prev.selectedColors.filter((c) => c.id !== color.id),
        }
      } else {
        // Check if reached maximum colors
        if (prev.selectedColors.length >= MAX_COLORS) {
          return prev // Don't add more colors
        }
        return {
          ...prev,
          selectedColors: [...prev.selectedColors, { id: color.id, name: color.name, nameEn: color.nameEn, hex: color.hex }],
        }
      }
    })
  }

  // Toggle size selection
  const toggleSize = (size: string) => {
    setFormData((prev) => {
      const isSelected = prev.selectedSizes.includes(size)
      if (isSelected) {
        return {
          ...prev,
          selectedSizes: prev.selectedSizes.filter((s) => s !== size),
        }
      } else {
        return {
          ...prev,
          selectedSizes: [...prev.selectedSizes, size],
        }
      }
    })
  }

  // Add custom color
  const addCustomColor = () => {
    if (customColorName && customColorHex) {
      // Check if reached maximum colors
      if (formData.selectedColors.length >= MAX_COLORS) {
        return // Don't add more colors
      }
      const newColor = {
        id: `custom-${Date.now()}`,
        name: customColorName,
        nameEn: customColorNameEn || customColorName,
        hex: customColorHex,
      }
      setFormData((prev) => ({
        ...prev,
        selectedColors: [...prev.selectedColors, newColor],
      }))
      setCustomColorName('')
      setCustomColorNameEn('')
      setCustomColorHex('#000000')
    }
  }

  // Generate variants from selected colors and sizes
  const generateVariants = () => {
    const variants: ProductVariant[] = []
    const colors = formData.selectedColors.length > 0 ? formData.selectedColors : [{ id: 'default', name: 'افتراضي', nameEn: 'Default', hex: '#CCCCCC' }]
    const sizes = formData.selectedSizes.length > 0 ? formData.selectedSizes : ['One Size']
    
    colors.forEach((color) => {
      sizes.forEach((size) => {
        const variantName = `${color.name} - ${size}`
        const variantSku = `${formData.sku}-${color.id}-${size}`.replace(/\s+/g, '-').toUpperCase()
        
        // Check if variant already exists
        const exists = formData.variants.some(
          (v) => v.color === color.id && v.size === size
        )
        
        if (!exists) {
          // Push a single variant that always carries its colour hex.
          // (Previously this block pushed the variant twice — once without
          // colorHex — creating duplicate, hex-less variants.)
          variants.push({
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            name: variantName,
            sku: variantSku,
            price: formData.price,
            quantity: variantQuantity,
            color: color.id,
            colorName: color.name,
            size: size,
            colorHex: color.hex,
          })
        }
      })
    })
    
    if (variants.length > 0) {
      setFormData((prev) => ({
        ...prev,
        variants: [...prev.variants, ...variants],
      }))
    }
  }

  // Clear all selections
  const clearSelections = () => {
    setFormData((prev) => ({
      ...prev,
      selectedColors: [],
      selectedSizes: [],
    }))
  }

  const addVariant = () => {
    if (newVariant.name && newVariant.sku) {
      const variant: ProductVariant = {
        id: Date.now().toString(),
        name: newVariant.name,
        sku: newVariant.sku,
        price: newVariant.price || formData.price,
        quantity: newVariant.quantity || '0',
        color: newVariant.color || '',
        colorName: newVariant.colorName || '',
        size: newVariant.size || '',
        colorHex: (availableColors.find(c => c.id === newVariant.color!)?.hex || newVariant.colorHex || ''),
      }
      setFormData((prev) => ({
        ...prev,
        variants: [...prev.variants, variant],
      }))
      setNewVariant({})
    }
  }

  const removeVariant = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.filter((v) => v.id !== id),
    }))
  }

  // Update variant quantity
  const updateVariantQuantity = (id: string, quantity: string) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.map((v) =>
        v.id === id ? { ...v, quantity } : v
      ),
    }))
  }

  // Update variant price
  const updateVariantPrice = (id: string, price: string) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.map((v) =>
        v.id === id ? { ...v, price } : v
      ),
    }))
  }

  const handleSubmit = () => {
    onSubmit?.(formData)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {product ? 'تعديل المنتج' : 'إضافة منتج جديد'}
          </DialogTitle>
          <DialogDescription>
            أدخل بيانات المنتج باللغتين العربية والإنجليزية
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid grid-cols-5 w-full bg-muted p-1 rounded-lg">
            <TabsTrigger value="basic" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">البيانات الأساسية</TabsTrigger>
            <TabsTrigger value="colors" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">الألوان</TabsTrigger>
            <TabsTrigger value="pricing" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">الأسعار</TabsTrigger>
            <TabsTrigger value="images" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">الصور</TabsTrigger>
            <TabsTrigger value="variants" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">المتغيرات</TabsTrigger>
          </TabsList>

          {/* Basic Info Tab */}
          <TabsContent value="basic" className="space-y-6 mt-6">
            {/* Bilingual Names */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nameAr">اسم المنتج (عربي) *</Label>
                <Input
                  id="nameAr"
                  value={formData.nameAr}
                  onChange={(e) => handleChange('nameAr', e.target.value)}
                  placeholder="أدخل اسم المنتج بالعربية"
                  className="bg-gray-50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nameEn">اسم المنتج (إنجليزي) *</Label>
                <Input
                  id="nameEn"
                  value={formData.nameEn}
                  onChange={(e) => handleChange('nameEn', e.target.value)}
                  placeholder="Enter product name in English"
                  className="bg-gray-50"
                  dir="ltr"
                />
              </div>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">الفئة *</Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) => handleChange('categoryId', value)}
              >
                <SelectTrigger className="bg-gray-50">
                  <SelectValue placeholder="اختر الفئة" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.nameAr} - {cat.nameEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Bilingual Descriptions */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="descriptionAr">وصف المنتج (عربي)</Label>
                <Textarea
                  id="descriptionAr"
                  value={formData.descriptionAr}
                  onChange={(e) => handleChange('descriptionAr', e.target.value)}
                  placeholder="أدخل وصف تفصيلي للمنتج بالعربية"
                  className="bg-gray-50 min-h-32"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descriptionEn">وصف المنتج (إنجليزي)</Label>
                <Textarea
                  id="descriptionEn"
                  value={formData.descriptionEn}
                  onChange={(e) => handleChange('descriptionEn', e.target.value)}
                  placeholder="Enter detailed product description in English"
                  className="bg-gray-50 min-h-32"
                  dir="ltr"
                />
              </div>
            </div>

            {/* Status Toggles */}
            <div className="flex items-center gap-6 pt-4">
              <div className="flex items-center gap-3">
                <Switch
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(checked) => handleChange('active', checked)}
                />
                <Label htmlFor="active" className="cursor-pointer">
                  المنتج نشط
                </Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  id="featured"
                  checked={formData.featured}
                  onCheckedChange={(checked) => handleChange('featured', checked)}
                />
                <Label htmlFor="featured" className="cursor-pointer">
                  منتج مميز
                </Label>
              </div>
            </div>
          </TabsContent>

          {/* Colors & Sizes Tab */}
          <TabsContent value="colors" className="space-y-6 mt-6">
            {/* Colors Section */}
            <Card className="border border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Palette className="h-5 w-5 text-primary" />
                  ألوان جاهزة (اضغط للإضافة)
                </CardTitle>
                <CardDescription>
                  اختر الألوان المتاحة للمنتج (الحد الأقصى: {MAX_COLORS} ألوان)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Color Grid */}
                <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
                  {availableColors.map((color) => {
                    const isSelected = formData.selectedColors.some((c) => c.id === color.id)
                    return (
                      <button
                        key={color.id}
                        type="button"
                        onClick={() => toggleColor(color)}
                        className={cn(
                          "relative flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all hover:scale-105",
                          isSelected ? "border-primary bg-primary/5" : "border-gray-200 hover:border-gray-300"
                        )}
                      >
                        <span
                          className="w-7 h-7 rounded-full border border-gray-200 shadow-sm"
                          style={{ background: color.hex }}
                        />
                        <span className="text-[9px] text-gray-600 truncate w-full text-center">{color.name}</span>
                        {isSelected && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                            <Check className="h-2.5 w-2.5 text-white" />
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
                {/* Custom Color */}
                <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
                  <input
                    type="color"
                    value={customColorHex}
                    onChange={(e) => setCustomColorHex(e.target.value)}
                    className="w-8 h-8 rounded border border-gray-200 cursor-pointer"
                  />
                  <Input
                    value={customColorName}
                    onChange={(e) => setCustomColorName(e.target.value)}
                    placeholder="اسم اللون (عربي)"
                    className="bg-gray-50 w-28 h-8 text-sm"
                  />
                  <Input
                    value={customColorNameEn}
                    onChange={(e) => setCustomColorNameEn(e.target.value)}
                    placeholder="Color Name (EN)"
                    className="bg-gray-50 w-28 h-8 text-sm"
                    dir="ltr"
                  />
                  <Button
                    type="button"
                    onClick={addCustomColor}
                    variant="outline"
                    size="sm"
                    className="h-8 border-primary/30 text-primary"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                {/* Selected Colors */}
                {formData.selectedColors.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-3 border-t border-gray-200">
                    <span className="text-xs text-gray-500 w-full mb-1">
                      الألوان المختارة ({formData.selectedColors.length}/{MAX_COLORS}):
                      {formData.selectedColors.length >= MAX_COLORS && (
                        <span className="text-amber-600 mr-2">تم الوصول للحد الأقصى</span>
                      )}
                    </span>
                    {formData.selectedColors.map((color) => (
                      <Badge
                        key={color.id}
                        variant="secondary"
                        className="flex items-center gap-1 pr-1 text-xs"
                      >
                        <span
                          className="w-3 h-3 rounded-full border border-gray-200"
                          style={{ backgroundColor: color.hex }}
                        />
                        {color.name}
                        <button
                          type="button"
                          onClick={() => toggleColor(availableColors.find((c) => c.id === color.id) || color as any)}
                          className="mr-0.5 hover:text-red-500"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Sizes Section */}
            <Card className="border border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Ruler className="h-5 w-5 text-primary" />
                  المقاسات المتاحة
                </CardTitle>
                <CardDescription>اختر المقاسات المتاحة للمنتج</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Standard Sizes */}
                <div>
                  <Label className="text-xs text-gray-500 mb-2 block">المقاسات القياسية</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {sizeCategories.standard.map((size) => {
                      const isSelected = formData.selectedSizes.includes(size)
                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() => toggleSize(size)}
                          className={cn(
                            "px-3 py-1.5 rounded-lg border-2 text-sm font-medium transition-all",
                            isSelected
                              ? "border-primary bg-primary text-white"
                              : "border-gray-200 hover:border-gray-300 text-gray-700 bg-white"
                          )}
                        >
                          {size}
                        </button>
                      )
                    })}
                  </div>
                </div>
                {/* Numeric Sizes */}
                <div>
                  <Label className="text-xs text-gray-500 mb-2 block">المقاسات الرقمية</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {sizeCategories.numeric.map((size) => {
                      const isSelected = formData.selectedSizes.includes(size)
                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() => toggleSize(size)}
                          className={cn(
                            "px-3 py-1.5 rounded-lg border-2 text-sm font-medium transition-all",
                            isSelected
                              ? "border-primary bg-primary text-white"
                              : "border-gray-200 hover:border-gray-300 text-gray-700 bg-white"
                          )}
                        >
                          {size}
                        </button>
                      )
                    })}
                  </div>
                </div>
                {/* Kids Sizes */}
                <div>
                  <Label className="text-xs text-gray-500 mb-2 block">مقاسات الأطفال</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {sizeCategories.kids.map((size) => {
                      const isSelected = formData.selectedSizes.includes(size)
                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() => toggleSize(size)}
                          className={cn(
                            "px-3 py-1.5 rounded-lg border-2 text-sm font-medium transition-all",
                            isSelected
                              ? "border-primary bg-primary text-white"
                              : "border-gray-200 hover:border-gray-300 text-gray-700 bg-white"
                          )}
                        >
                          {size}
                        </button>
                      )
                    })}
                  </div>
                </div>
                {/* Plus & Specialty Sizes */}
                <div>
                  <Label className="text-xs text-gray-500 mb-2 block">مقاسات خاصة</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {[...sizeCategories.plus, ...sizeCategories.specialty].map((size) => {
                      const isSelected = formData.selectedSizes.includes(size)
                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() => toggleSize(size)}
                          className={cn(
                            "px-3 py-1.5 rounded-lg border-2 text-sm font-medium transition-all",
                            isSelected
                              ? "border-primary bg-primary text-white"
                              : "border-gray-200 hover:border-gray-300 text-gray-700 bg-white"
                          )}
                        >
                          {size}
                        </button>
                      )
                    })}
                  </div>
                </div>
                {/* Selected Sizes */}
                {formData.selectedSizes.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-3 border-t border-gray-200">
                    <span className="text-xs text-gray-500 w-full mb-1">المقاسات المختارة ({formData.selectedSizes.length}):</span>
                    {formData.selectedSizes.map((size) => (
                      <Badge
                        key={size}
                        variant="secondary"
                        className="flex items-center gap-1 pr-1 text-xs"
                      >
                        {size}
                        <button
                          type="button"
                          onClick={() => toggleSize(size)}
                          className="mr-0.5 hover:text-red-500"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Summary */}
            {(formData.selectedColors.length > 0 || formData.selectedSizes.length > 0) && (
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="pt-4">
                  <p className="text-sm text-gray-700">
                    <strong>ملخص:</strong> {formData.selectedColors.length} لون × {formData.selectedSizes.length} مقاس = 
                    <span className="text-primary font-bold mx-1">
                      {formData.selectedColors.length * formData.selectedSizes.length} متغير
                    </span>
                    سيتم إنشاؤهم
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    اذهب لتبويب "المتغيرات" لإنشاء المتغيرات تلقائياً أو إضافتها يدوياً
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Pricing Tab */}
          <TabsContent value="pricing" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">السعر (ج.م) *</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => handleChange('price', e.target.value)}
                  placeholder="0.00"
                  className="bg-gray-50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="comparePrice">سعر المقارنة (ج.م)</Label>
                <Input
                  id="comparePrice"
                  type="number"
                  value={formData.comparePrice}
                  onChange={(e) => handleChange('comparePrice', e.target.value)}
                  placeholder="0.00"
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500">السعر الأصلي قبل الخصم</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="costPrice">سعر التكلفة (ج.م)</Label>
                <Input
                  id="costPrice"
                  type="number"
                  value={formData.costPrice}
                  onChange={(e) => handleChange('costPrice', e.target.value)}
                  placeholder="0.00"
                  className="bg-gray-50"
                />
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sku">الرقم التسلسلي (SKU) *</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => handleChange('sku', e.target.value)}
                  placeholder="SKU-001"
                  className="bg-gray-50"
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="barcode">الباركود</Label>
                <Input
                  id="barcode"
                  value={formData.barcode}
                  onChange={(e) => handleChange('barcode', e.target.value)}
                  placeholder="1234567890"
                  className="bg-gray-50"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">الكمية المتوفرة *</Label>
              <Input
                id="quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) => handleChange('quantity', e.target.value)}
                placeholder="0"
                className="bg-gray-50 max-w-xs"
              />
            </div>
          </TabsContent>

          {/* Images Tab */}
          <TabsContent value="images" className="space-y-6 mt-6">
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
              <input
                type="file"
                id="imageUpload"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageUpload}
              />
              <label
                htmlFor="imageUpload"
                className="cursor-pointer flex flex-col items-center gap-3"
              >
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-gray-700">اسحب الصور هنا أو انقر للتحميل</p>
                  <p className="text-sm text-gray-500 mt-1">PNG, JPG, WEBP حتى 5MB</p>
                </div>
              </label>
            </div>

            {formData.images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {formData.images.map((image, index) => (
                  <div
                    key={index}
                    className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200"
                  >
                    <img
                      src={image}
                      alt={`Product ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => removeImage(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    {index === 0 && (
                      <Badge className="absolute top-2 right-2 bg-primary text-white">
                        رئيسية
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}

            {formData.images.length === 0 && (
              <div className="flex flex-col items-center gap-3 py-8 text-gray-500">
                <ImageIcon className="h-12 w-12" />
                <p>لا توجد صور بعد</p>
              </div>
            )}
          </TabsContent>

          {/* Variants Tab */}
          <TabsContent value="variants" className="space-y-6 mt-6">
            {/* Color Selection Section */}
            <Card className="border border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Palette className="h-5 w-5 text-primary" />
                  ألوان جاهزة (اضغط للإضافة)
                </CardTitle>
                <CardDescription>
                  اختر الألوان المتاحة للمنتج (الحد الأقصى: {MAX_COLORS} ألوان)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Color Grid */}
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                  {availableColors.map((color) => {
                    const isSelected = formData.selectedColors.some((c) => c.id === color.id)
                    return (
                      <button
                        key={color.id}
                        type="button"
                        onClick={() => toggleColor(color)}
                        className={cn(
                          "relative flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all hover:scale-105",
                          isSelected ? "border-primary bg-primary/5" : "border-gray-200 hover:border-gray-300"
                        )}
                      >
                        <span
                          className="w-8 h-8 rounded-full border border-gray-200 shadow-sm"
                          style={{ background: color.hex }}
                        />
                        <span className="text-[10px] text-gray-600 truncate w-full text-center">{color.name}</span>
                        {isSelected && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* Custom Color Input */}
                <div className="pt-4 border-t">
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">إضافة لون مخصص</Label>
                  <div className="flex flex-wrap gap-2">
                    <Input
                      value={customColorName}
                      onChange={(e) => setCustomColorName(e.target.value)}
                      placeholder="اسم اللون (عربي)"
                      className="bg-gray-50 w-32"
                    />
                    <Input
                      value={customColorNameEn}
                      onChange={(e) => setCustomColorNameEn(e.target.value)}
                      placeholder="Color Name (EN)"
                      className="bg-gray-50 w-32"
                      dir="ltr"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={customColorHex}
                        onChange={(e) => setCustomColorHex(e.target.value)}
                        className="w-10 h-10 rounded border border-gray-200 cursor-pointer"
                      />
                      <Button
                        type="button"
                        onClick={addCustomColor}
                        variant="outline"
                        size="sm"
                        className="border-primary/30 text-primary"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Selected Colors Display */}
                {formData.selectedColors.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-3 border-t">
                    <span className="text-sm text-gray-500">الألوان المختارة:</span>
                    {formData.selectedColors.map((color) => (
                      <Badge
                        key={color.id}
                        variant="secondary"
                        className="flex items-center gap-1 pr-1"
                      >
                        <span
                          className="w-4 h-4 rounded-full border border-gray-200"
                          style={{ backgroundColor: color.hex }}
                        />
                        {color.name}
                        <button
                          type="button"
                          onClick={() => toggleColor(availableColors.find((c) => c.id === color.id) || color as any)}
                          className="mr-1 hover:text-red-500"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Size Selection Section */}
            <Card className="border border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Ruler className="h-5 w-5 text-primary" />
                  المقاسات المتاحة
                </CardTitle>
                <CardDescription>اختر المقاسات المتاحة للمنتج</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Standard Sizes */}
                <div>
                  <Label className="text-xs text-gray-500 mb-2 block">المقاسات القياسية</Label>
                  <div className="flex flex-wrap gap-2">
                    {sizeCategories.standard.map((size) => {
                      const isSelected = formData.selectedSizes.includes(size)
                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() => toggleSize(size)}
                          className={cn(
                            "px-3 py-1.5 rounded-lg border-2 text-sm font-medium transition-all",
                            isSelected
                              ? "border-primary bg-primary text-white"
                              : "border-gray-200 hover:border-gray-300 text-gray-700"
                          )}
                        >
                          {size}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Numeric Sizes */}
                <div>
                  <Label className="text-xs text-gray-500 mb-2 block">المقاسات الرقمية</Label>
                  <div className="flex flex-wrap gap-2">
                    {sizeCategories.numeric.map((size) => {
                      const isSelected = formData.selectedSizes.includes(size)
                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() => toggleSize(size)}
                          className={cn(
                            "px-3 py-1.5 rounded-lg border-2 text-sm font-medium transition-all",
                            isSelected
                              ? "border-primary bg-primary text-white"
                              : "border-gray-200 hover:border-gray-300 text-gray-700"
                          )}
                        >
                          {size}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Kids Sizes */}
                <div>
                  <Label className="text-xs text-gray-500 mb-2 block">مقاسات الأطفال</Label>
                  <div className="flex flex-wrap gap-2">
                    {sizeCategories.kids.map((size) => {
                      const isSelected = formData.selectedSizes.includes(size)
                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() => toggleSize(size)}
                          className={cn(
                            "px-3 py-1.5 rounded-lg border-2 text-sm font-medium transition-all",
                            isSelected
                              ? "border-primary bg-primary text-white"
                              : "border-gray-200 hover:border-gray-300 text-gray-700"
                          )}
                        >
                          {size}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Plus Sizes */}
                <div>
                  <Label className="text-xs text-gray-500 mb-2 block">المقاسات الكبيرة</Label>
                  <div className="flex flex-wrap gap-2">
                    {sizeCategories.plus.map((size) => {
                      const isSelected = formData.selectedSizes.includes(size)
                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() => toggleSize(size)}
                          className={cn(
                            "px-3 py-1.5 rounded-lg border-2 text-sm font-medium transition-all",
                            isSelected
                              ? "border-primary bg-primary text-white"
                              : "border-gray-200 hover:border-gray-300 text-gray-700"
                          )}
                        >
                          {size}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Specialty Sizes */}
                <div>
                  <Label className="text-xs text-gray-500 mb-2 block">مقاسات خاصة</Label>
                  <div className="flex flex-wrap gap-2">
                    {sizeCategories.specialty.map((size) => {
                      const isSelected = formData.selectedSizes.includes(size)
                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() => toggleSize(size)}
                          className={cn(
                            "px-3 py-1.5 rounded-lg border-2 text-sm font-medium transition-all",
                            isSelected
                              ? "border-primary bg-primary text-white"
                              : "border-gray-200 hover:border-gray-300 text-gray-700"
                          )}
                        >
                          {size}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Selected Sizes Display */}
                {formData.selectedSizes.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-3 border-t">
                    <span className="text-sm text-gray-500">المقاسات المختارة:</span>
                    {formData.selectedSizes.map((size) => (
                      <Badge
                        key={size}
                        variant="secondary"
                        className="flex items-center gap-1 pr-1"
                      >
                        {size}
                        <button
                          type="button"
                          onClick={() => toggleSize(size)}
                          className="mr-1 hover:text-red-500"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Bulk Variant Generator */}
            <Card className="border border-primary/20 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  إنشاء المتغيرات تلقائياً
                </CardTitle>
                <CardDescription>إنشاء جميع المتغيرات من الألوان والمقاسات المختارة</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="space-y-1">
                    <Label>الكمية الافتراضية لكل متغير</Label>
                    <Input
                      type="number"
                      value={variantQuantity}
                      onChange={(e) => setVariantQuantity(e.target.value)}
                      className="bg-white w-32"
                      placeholder="10"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">
                      سيتم إنشاء <strong>{formData.selectedColors.length * formData.selectedSizes.length}</strong> متغير
                      ({formData.selectedColors.length} لون × {formData.selectedSizes.length} مقاس)
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={generateVariants}
                    className="bg-primary hover:bg-primary/90 text-white"
                    disabled={formData.selectedColors.length === 0 && formData.selectedSizes.length === 0}
                  >
                    <Sparkles className="h-4 w-4 ml-2" />
                    إنشاء المتغيرات
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={clearSelections}
                  >
                    مسح الاختيارات
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Manual Add Single Variant */}
            <Card className="border border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">إضافة متغير يدوياً</CardTitle>
                <CardDescription>أضف متغير واحد للمنتج</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>اسم المتغير</Label>
                    <Input
                      value={newVariant.name || ''}
                      onChange={(e) =>
                        setNewVariant((prev) => ({ ...prev, name: e.target.value }))
                      }
                      placeholder="مثال: أحمر - L"
                      className="bg-gray-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>الرقم التسلسلي</Label>
                    <Input
                      value={newVariant.sku || ''}
                      onChange={(e) =>
                        setNewVariant((prev) => ({ ...prev, sku: e.target.value }))
                      }
                      placeholder="SKU-001-RED-L"
                      className="bg-gray-50"
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>السعر (ج.م)</Label>
                    <Input
                      type="number"
                      value={newVariant.price || ''}
                      onChange={(e) =>
                        setNewVariant((prev) => ({ ...prev, price: e.target.value }))
                      }
                      placeholder="اتركه فارغاً للسعر الافتراضي"
                      className="bg-gray-50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>اللون</Label>
                    <Select
                      value={newVariant.color || ''}
                      onValueChange={(value) => {
                        const color = availableColors.find((c) => c.id === value)
                        setNewVariant((prev) => ({
                          ...prev,
                          color: value,
                          colorName: color?.name || '',
                        }))
                      }}
                    >
                      <SelectTrigger className="bg-gray-50">
                        <SelectValue placeholder="اختر اللون" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableColors.map((color) => (
                          <SelectItem key={color.id} value={color.id}>
                            <div className="flex items-center gap-2">
                              <span
                                className="w-4 h-4 rounded-full border border-gray-200"
                                style={{ backgroundColor: color.hex }}
                              />
                              {color.name} - {color.nameEn}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>المقاس</Label>
                    <Select
                      value={newVariant.size || ''}
                      onValueChange={(value) =>
                        setNewVariant((prev) => ({ ...prev, size: value }))
                      }
                    >
                      <SelectTrigger className="bg-gray-50">
                        <SelectValue placeholder="اختر المقاس" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableSizes.map((size) => (
                          <SelectItem key={size} value={size}>
                            {size}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>الكمية</Label>
                    <Input
                      type="number"
                      value={newVariant.quantity || ''}
                      onChange={(e) =>
                        setNewVariant((prev) => ({ ...prev, quantity: e.target.value }))
                      }
                      placeholder="0"
                      className="bg-gray-50"
                    />
                  </div>
                </div>

                <Button
                  onClick={addVariant}
                  variant="outline"
                  className="border-primary/30 text-primary hover:bg-primary/10"
                >
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة المتغير
                </Button>
              </CardContent>
            </Card>

            {/* Existing Variants */}
            {formData.variants.length > 0 && (
              <Card className="border border-gray-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">المتغيرات المضافة ({formData.variants.length})</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFormData((prev) => ({ ...prev, variants: [] }))}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 ml-1" />
                      حذف الكل
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-right py-2 px-3 text-sm font-medium text-gray-500">اللون</th>
                          <th className="text-right py-2 px-3 text-sm font-medium text-gray-500">المقاس</th>
                          <th className="text-right py-2 px-3 text-sm font-medium text-gray-500">السعر</th>
                          <th className="text-right py-2 px-3 text-sm font-medium text-gray-500">الكمية</th>
                          <th className="text-right py-2 px-3 text-sm font-medium text-gray-500">SKU</th>
                          <th className="py-2 px-3"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.variants.map((variant) => (
                          <tr key={variant.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-2 px-3">
                              <div className="flex items-center gap-2">
                                <span
                                  className="w-5 h-5 rounded-full border border-gray-200"
                                  style={{ 
                                    backgroundColor: availableColors.find((c) => c.id === variant.color)?.hex || '#CCCCCC'
                                  }}
                                />
                                <span className="text-sm">{variant.colorName || '-'}</span>
                              </div>
                            </td>
                            <td className="py-2 px-3">
                              <Badge variant="outline">{variant.size || '-'}</Badge>
                            </td>
                            <td className="py-2 px-3">
                              <Input
                                type="number"
                                value={variant.price}
                                onChange={(e) => updateVariantPrice(variant.id, e.target.value)}
                                className="bg-gray-50 w-24 h-8 text-sm"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <Input
                                type="number"
                                value={variant.quantity}
                                onChange={(e) => updateVariantQuantity(variant.id, e.target.value)}
                                className="bg-gray-50 w-20 h-8 text-sm"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <span className="text-xs text-gray-500 font-mono" dir="ltr">{variant.sku}</span>
                            </td>
                            <td className="py-2 px-3">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeVariant(variant.id)}
                                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {formData.variants.length === 0 && (
              <div className="flex flex-col items-center gap-3 py-8 text-gray-500">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                  <ChevronDown className="h-6 w-6" />
                </div>
                <p>لا توجد متغيرات بعد</p>
                <p className="text-sm">اختر الألوان والمقاسات ثم اضغط "إنشاء المتغيرات" أو أضف متغير يدوياً</p>
              </div>
            )}
</TabsContent>

          </Tabs>
        <DialogFooter className="mt-6 pt-4 border-t">
          <div className="flex items-center justify-between w-full">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => setActiveTab('pricing')}>
                التالي
                <ArrowRight className="h-4 w-4 mr-2" />
              </Button>
              <Button
                onClick={handleSubmit}
                className="bg-primary hover:bg-primary/90 text-white"
              >
                <Save className="h-4 w-4 ml-2" />
                حفظ المنتج
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default AdminProductForm
