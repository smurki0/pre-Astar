'use client'

import * as React from 'react'
import { Upload, X, Image as ImageIcon, Loader2, Link, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { csrfFetch } from '@/lib/csrf-fetch'
import { MAX_PRODUCT_IMAGES } from '@/lib/constants'

interface ImageUploaderProps {
  value?: string
  onChange: (url: string) => void
  folder?: string
  className?: string
  placeholder?: string
}

export function ImageUploader({
  value,
  onChange,
  folder = 'general',
  className,
  placeholder = 'Upload image',
}: ImageUploaderProps) {
  const { toast } = useToast()
  const [uploading, setUploading] = React.useState(false)
  const [dragOver, setDragOver] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const handleUpload = async (file: File) => {
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('الرجاء اختيار ملف صورة صالح')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('حجم الملف يجب أن يكون أقل من 5 ميجابايت')
      return
    }

    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', folder)

      const response = await csrfFetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload image')
      }

      onChange(data.url)
      toast({
        title: 'تم الرفع',
        description: 'تم رفع الصورة بنجاح',
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload image'
      setError(errorMessage)
      toast({
        title: 'خطأ في الرفع',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleUpload(file)
    }
    // Reset input
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      handleUpload(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => {
    setDragOver(false)
  }

  const handleRemove = () => {
    onChange('')
    setError(null)
  }

  return (
    <div className={cn('relative', className)}>
      {value ? (
        <div className="relative group">
          <div className="relative w-full h-40 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
            <img
              src={value}
              alt="Uploaded image"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = '/placeholder-product.png'
              }}
            />
          </div>
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 left-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          className={cn(
            'w-full h-40 rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors',
            dragOver
              ? 'border-primary bg-primary/10'
              : 'border-gray-300 hover:border-gray-400 bg-gray-50 hover:bg-gray-100'
          )}
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <span className="text-sm text-gray-500">جاري الرفع...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                <Upload className="h-6 w-6 text-gray-400" />
              </div>
              <span className="text-sm text-gray-500">{placeholder}</span>
              <span className="text-xs text-gray-400">أو اسحب وأفلت الصورة هنا</span>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 mt-2 text-red-500 text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        disabled={uploading}
      />
    </div>
  )
}

// Multiple image uploader
interface MultiImageUploaderProps {
  value: { url: string; alt?: string }[]
  onChange: (images: { url: string; alt?: string }[]) => void
  folder?: string
  maxImages?: number
}

export function MultiImageUploader({
  value,
  onChange,
  folder = 'products',
  maxImages = MAX_PRODUCT_IMAGES,
}: MultiImageUploaderProps) {
  const { toast } = useToast()
  const [uploading, setUploading] = React.useState(false)
  const [addMode, setAddMode] = React.useState<'upload' | 'url'>('upload')
  const [urlInput, setUrlInput] = React.useState('')
  const [urlError, setUrlError] = React.useState('')
  const [uploadingIndex, setUploadingIndex] = React.useState<number | null>(null)

  const handleUpload = async (file: File) => {
    if (value.length >= maxImages) {
      toast({
        title: 'تنبيه',
        description: `الحد الأقصى ${maxImages} صور`,
        variant: 'destructive',
      })
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'خطأ',
        description: 'الرجاء اختيار ملف صورة صالح',
        variant: 'destructive',
      })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'خطأ',
        description: 'حجم الملف يجب أن يكون أقل من 5 ميجابايت',
        variant: 'destructive',
      })
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', folder)

      const response = await csrfFetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload image')
      }

      onChange([...value, { url: data.url }])
      toast({
        title: 'تم الرفع',
        description: 'تم رفع الصورة بنجاح',
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload image'
      toast({
        title: 'خطأ في الرفع',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleUpload(files[0])
    }
    // Reset input
    e.target.value = ''
  }

  const handleAddUrl = () => {
    if (value.length >= maxImages) {
      setUrlError(`الحد الأقصى ${maxImages} صور`)
      return
    }

    const trimmedUrl = urlInput.trim()

    if (!trimmedUrl) {
      setUrlError('الرجاء إدخال رابط الصورة')
      return
    }

    // Basic URL validation
    try {
      new URL(trimmedUrl)
    } catch {
      setUrlError('الرجاء إدخال رابط صحيح')
      return
    }

    // Check if URL already exists
    if (value.some(img => img.url === trimmedUrl)) {
      setUrlError('هذه الصورة موجودة بالفعل')
      return
    }

    onChange([...value, { url: trimmedUrl }])
    setUrlInput('')
    setUrlError('')
    toast({
      title: 'تمت الإضافة',
      description: 'تمت إضافة الصورة بنجاح',
    })
  }

  const handleRemove = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  const handleMove = (from: number, to: number) => {
    if (to < 0 || to >= value.length) return
    const newValue = [...value]
    const [removed] = newValue.splice(from, 1)
    newValue.splice(to, 0, removed)
    onChange(newValue)
  }

  return (
    <div className="space-y-4">
      {/* Existing Images */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {value.map((img, index) => (
            <div key={index} className="relative group">
              <div className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                <img
                  src={img.url}
                  alt={img.alt || `Image ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder-product.png'
                  }}
                />
                {index === 0 && (
                  <span className="absolute bottom-1 right-1 bg-primary text-white text-xs px-2 py-0.5 rounded">
                    الرئيسية
                  </span>
                )}
              </div>
              <div className="absolute top-1 left-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="h-7 w-7 bg-white/90 hover:bg-white"
                  onClick={() => handleMove(index, index - 1)}
                  disabled={index === 0}
                  title="تحريك لليسار"
                >
                  ←
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="h-7 w-7 bg-white/90 hover:bg-white"
                  onClick={() => handleMove(index, index + 1)}
                  disabled={index === value.length - 1}
                  title="تحريك لليمين"
                >
                  →
                </Button>
              </div>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleRemove(index)}
                title="حذف"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add Image Section */}
      {value.length < maxImages && (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          {/* Mode Tabs */}
          <div className="flex gap-2 mb-4">
            <Button
              type="button"
              variant={addMode === 'upload' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAddMode('upload')}
              className={cn(
                'flex-1',
                addMode === 'upload' ? 'bg-primary hover:bg-primary/90' : ''
              )}
            >
              <Upload className="h-4 w-4 ml-2" />
              رفع صورة
            </Button>
            <Button
              type="button"
              variant={addMode === 'url' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAddMode('url')}
              className={cn(
                'flex-1',
                addMode === 'url' ? 'bg-primary hover:bg-primary/90' : ''
              )}
            >
              <Link className="h-4 w-4 ml-2" />
              رابط صورة
            </Button>
          </div>

          {/* Upload Mode */}
          {addMode === 'upload' && (
            <label className="w-full h-24 rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 flex flex-col items-center justify-center cursor-pointer transition-colors">
              {uploading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 text-primary animate-spin" />
                  <span className="text-sm text-gray-500">جاري الرفع...</span>
                </div>
              ) : (
                <>
                  <ImageIcon className="h-6 w-6 text-gray-400" />
                  <span className="text-sm text-gray-500 mt-1">اضغط لاختيار صورة أو اسحب وأفلت</span>
                  <span className="text-xs text-gray-400">PNG, JPG, WEBP حتى 5MB</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
                disabled={uploading}
              />
            </label>
          )}

          {/* URL Mode */}
          {addMode === 'url' && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={urlInput}
                  onChange={(e) => {
                    setUrlInput(e.target.value)
                    if (urlError) setUrlError('')
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddUrl()
                    }
                  }}
                  className={cn('flex-1', urlError && 'border-red-500')}
                  dir="ltr"
                />
                <Button
                  type="button"
                  onClick={handleAddUrl}
                  className="bg-primary hover:bg-primary/90"
                >
                  إضافة
                </Button>
              </div>
              {urlError && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {urlError}
                </p>
              )}
              <p className="text-xs text-gray-400">
                أدخل رابط الصورة المباشر (مثل: https://example.com/image.jpg)
              </p>
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-gray-500">
        {value.length} / {maxImages} صور • الصورة الأولى هي الصورة الرئيسية
      </p>
    </div>
  )
}

export default ImageUploader
