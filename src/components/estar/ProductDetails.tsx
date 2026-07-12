'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import Script from 'next/script'
import {
  Heart,
  Share2,
  Minus,
  Plus,
  ShoppingCart,
  Star,
  Truck,
  ShieldCheck,
  RotateCcw,
  ChevronRight,
  Package,
  ChevronLeft,
  Check,
  AlertTriangle,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { getColorHexSafe } from '@/lib/colors'
import { useCartStore, useWishlistStore, useUserStore } from '@/store'
import { ReviewList } from './ReviewList'
import { RelatedProducts } from './RelatedProducts'
import { CardZoom } from './CardZoom'
import { useRouter } from 'next/navigation'
import { csrfFetch } from '@/lib/csrf-fetch'

// Consistent Arabic (Egypt) number formatting for prices
const egpFormatter = new Intl.NumberFormat('ar-EG')
const formatPrice = (value: number): string => egpFormatter.format(value)

// Type guard used to filter out null values while narrowing to a non-null type
const notNull = <T,>(value: T | null): value is T => value !== null

// Helper function to check if color is light
const isLightColor = (hex: string): boolean => {
  const lightColors = ['#FFFFFF', '#FFFDD0', '#F5F5DC', '#FFC0CB', '#93C572'];
  return lightColors.includes(hex.toUpperCase());
};

interface ProductDetailsProps {
  productId: string
  className?: string
}

interface ProductData {
  id: string
  nameEn: string
  nameAr: string
  slug: string
  price: number
  comparePrice: number | null
  descriptionEn: string | null
  descriptionAr: string | null
  quantity: number
  images: { id: string; url: string; alt: string | null; color: string | null }[]
  variants: { id: string; name: string; color: string | null; colorHex: string | null; size: string | null; price: number | null; quantity: number; available?: boolean }[]
  category?: { id: string; nameEn: string; nameAr: string } | null
  reviews?: { id: string; rating: number; comment: string | null; createdAt: string; user: { name: string } }[]
}

export function ProductDetails({
  productId,
  className,
}: ProductDetailsProps) {
  const router = useRouter()

  const [product, setProduct] = useState<ProductData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [showSizeGuide, setShowSizeGuide] = useState(false)
  
  const { addItem: addToCart } = useCartStore()
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlistStore()
  const { user } = useUserStore()

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await csrfFetch(`/api/products/${productId}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('المنتج غير موجود')
          } else {
            setError('فشل في تحميل المنتج')
          }
          return
        }
        
        const data = await response.json()
        const prod = data.product || data
        setProduct(prod)

        // Pick the initial variant. If the URL carries a ?color= (e.g. after a
        // refresh or a shared link), restore that colour; otherwise use the first
        // variant. This is the "persist selection on refresh" behaviour.
        if (prod?.variants?.length > 0) {
          const urlColor =
            typeof window !== 'undefined'
              ? new URLSearchParams(window.location.search).get('color')
              : null
          const initialVariant =
            (urlColor && prod.variants.find((v: { color: string | null }) => v.color === urlColor)) ||
            prod.variants[0]
          setSelectedVariant(initialVariant.id)
          setSelectedSize(initialVariant.size)
          setSelectedColor(initialVariant.color)
        }
      } catch {
        setError('فشل في تحميل المنتج')
      } finally {
        setLoading(false)
      }
    }
    
    if (productId) {
      fetchProduct()
    }
  }, [productId])

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta
    const maxQuantity = selectedVariant 
      ? product?.variants.find(v => v.id === selectedVariant)?.quantity || 10
      : product?.quantity || 10
    if (newQuantity >= 1 && newQuantity <= maxQuantity) {
      setQuantity(newQuantity)
    }
  }

  const handleAddToCart = () => {
    if (!product) return
    
    addToCart({
      id: product.id,
      nameEn: product.nameEn,
      nameAr: product.nameAr,
      slug: product.slug,
      descriptionEn: product.descriptionEn || '',
      descriptionAr: product.descriptionAr || '',
      price: selectedVariant 
        ? (product.variants.find(v => v.id === selectedVariant)?.price || product.price)
        : product.price,
      comparePrice: product.comparePrice,
      sku: '',
      quantity: product.quantity,
      categoryId: product.category?.id || '',
      images: product.images,
      variants: product.variants,
      category: product.category || undefined,
      featured: false,
      active: true,
    }, selectedVariant, quantity)
  }

  const handleWishlist = () => {
    if (!product) return
    
    const wishlistProduct = {
      id: product.id,
      nameEn: product.nameEn,
      nameAr: product.nameAr,
      slug: product.slug,
      descriptionEn: product.descriptionEn || '',
      descriptionAr: product.descriptionAr || '',
      price: product.price,
      comparePrice: product.comparePrice,
      sku: '',
      quantity: product.quantity,
      categoryId: product.category?.id || '',
      images: product.images,
      variants: product.variants,
      category: product.category || undefined,
      featured: false,
      active: true,
    }
    
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id)
    } else {
      addToWishlist(wishlistProduct)
    }
  }

  // Find matching variant for a given color + size (hoisted so handlers can use it)
  function findMatchingVariant(color: string | null, size: string | null) {
    if (!product?.variants) return null
    return product.variants.find(v => v.color === color && v.size === size) ?? null
  }

  const handleShare = async () => {
    if (!product) return
    const shareData = {
      title: product.nameAr,
      text: product.nameAr,
      url: typeof window !== 'undefined' ? window.location.href : '',
    }
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share(shareData)
      } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(shareData.url)
      }
    } catch {
      // user cancelled share or clipboard unavailable — no-op
    }
  }

  const handleColorChange = (color: string) => {
    setSelectedColor(color)
    // Switching colour always shows that colour's gallery from the first image
    setSelectedImage(0)

    // Persist the selected colour in the URL so it survives a refresh / share
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      params.set('color', color)
      window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`)
    }

    // Find a matching variant with this color and current size (if available)
    const matchingVariant = findMatchingVariant(color, selectedSize)
    if (matchingVariant) {
      setSelectedVariant(matchingVariant.id)
    } else {
      // Find first variant with this color
      const firstColorVariant = product?.variants?.find(v => v.color === color)
      if (firstColorVariant) {
        setSelectedVariant(firstColorVariant.id)
        setSelectedSize(firstColorVariant.size)
      }
    }
  }
  
  const handleSizeChange = (size: string) => {
    setSelectedSize(size)
    // Find a matching variant with this size and current color (if available)
    const matchingVariant = findMatchingVariant(selectedColor, size)
    if (matchingVariant) {
      setSelectedVariant(matchingVariant.id)
    } else {
      // Find first variant with this size
      const firstSizeVariant = product?.variants?.find(v => v.size === size)
      if (firstSizeVariant) {
        setSelectedVariant(firstSizeVariant.id)
        setSelectedColor(firstSizeVariant.color)
      }
    }
  }

  const navigateTo = (view: string, params?: Record<string, string>) => {
    const urlParams = new URLSearchParams()
    urlParams.set('view', view)
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        urlParams.set(key, value)
      })
    }
    router.push(`/?${urlParams.toString()}`)
  }

  // Calculate average rating
  const avgRating = product?.reviews && product.reviews.length > 0
    ? product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.reviews.length
    : 0

  // Calculate discount percentage
  const discountPercentage = product?.comparePrice
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0

  // Get unique colors and sizes from variants (memoized — only recompute on variant changes)
  const uniqueColors = useMemo<string[]>(
    () => product?.variants
      ? [...new Set(product.variants.map(v => v.color).filter(notNull))]
      : [],
    [product?.variants]
  )
  const uniqueSizes = useMemo<string[]>(
    () => product?.variants
      ? [...new Set(product.variants.map(v => v.size).filter(notNull))]
      : [],
    [product?.variants]
  )

  // Get available sizes for the selected color
  const availableSizesForColor = useMemo<string[]>(
    () => product?.variants
      ? [...new Set(product.variants
          .filter(v => v.color === selectedColor)
          .map(v => v.size)
          .filter(notNull))]
      : [],
    [product?.variants, selectedColor]
  )

  // Get available colors for the selected size
  const availableColorsForSize = useMemo<string[]>(
    () => product?.variants
      ? [...new Set(product.variants
          .filter(v => v.size === selectedSize)
          .map(v => v.color)
          .filter(notNull))]
      : [],
    [product?.variants, selectedSize]
  )

  // Map each colour name -> its stored hex (prefer the persisted variant hex,
  // fall back to the name map). Prevents the "grey swatch" on the storefront.
  const colorHexByName = useMemo<Record<string, string>>(() => {
    const map: Record<string, string> = {}
    product?.variants?.forEach(v => {
      if (v.color && !map[v.color]) {
        map[v.color] = v.colorHex && /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/.test(v.colorHex)
          ? v.colorHex
          : getColorHexSafe(v.color)
      }
    })
    return map
  }, [product?.variants])

  // Gallery images for the currently selected colour.
  // Priority: images tagged with the colour -> shared (untagged) images -> all images.
  const galleryImages = useMemo(() => {
    const all = product?.images ?? []
    if (!selectedColor) return all
    const colorImages = all.filter(img => img.color === selectedColor)
    if (colorImages.length > 0) return colorImages
    const sharedImages = all.filter(img => !img.color)
    return sharedImages.length > 0 ? sharedImages : all
  }, [product?.images, selectedColor])

  // Keep the selected thumbnail in range whenever the gallery (i.e. colour) changes
  useEffect(() => {
    setSelectedImage(prev => (prev < galleryImages.length ? prev : 0))
  }, [galleryImages])

  // Get current price
  const currentPrice = selectedVariant && product
    ? (product.variants.find(v => v.id === selectedVariant)?.price || product.price)
    : product?.price || 0

  // Clamp the selected quantity to the available stock whenever the variant changes
  useEffect(() => {
    const maxQuantity = selectedVariant
      ? product?.variants.find(v => v.id === selectedVariant)?.quantity ?? 0
      : product?.quantity ?? 0
    setQuantity(prev => {
      if (maxQuantity <= 0) return 1
      return Math.min(Math.max(prev, 1), maxQuantity)
    })
  }, [selectedVariant, product])

  // Close the size guide modal with the Escape key
  useEffect(() => {
    if (!showSizeGuide) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowSizeGuide(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [showSizeGuide])

  const features = [
    { icon: Truck, title: 'شحن مجاني', desc: 'للطلبات فوق 200 ج.م' },
    { icon: RotateCcw, title: 'إرجاع مجاني', desc: 'خلال 14 يوم' },
    { icon: ShieldCheck, title: 'ضمان الجودة', desc: 'منتجات أصلية 100%' },
  ]

  // Loading state
  if (loading) {
    return (
      <div className={cn('bg-card rounded-2xl border border-border overflow-hidden shadow-sm', className)}>
        <div className="grid lg:grid-cols-2 gap-0">
          {/* Image Gallery Skeleton */}
          <div className="p-6 lg:p-8 bg-muted/30">
            <Skeleton className="aspect-[3/4] rounded-xl" />
            <div className="flex gap-3 mt-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="w-20 h-20 rounded-lg" />
              ))}
            </div>
          </div>
          {/* Product Info Skeleton */}
          <div className="p-6 lg:p-8 space-y-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-6 w-32" />
            <div className="space-y-4 pt-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !product) {
    return (
      <div className={cn('container mx-auto px-4 py-16 text-center', className)}>
        <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
          <Package className="h-12 w-12 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          {error || 'المنتج غير موجود'}
        </h1>
        <p className="text-muted-foreground mb-6">
          عذراً، لم نتمكن من العثور على هذا المنتج
        </p>
        <Button onClick={() => navigateTo('shop')}>
          تصفح المنتجات
          <ChevronLeft className="h-4 w-4 mr-2" />
        </Button>
      </div>
    )
  }

  // Product structured data (JSON-LD) -> lets Google show price, rating and
  // stock as a rich result, a major driver of organic clicks/customers.
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.nameAr,
    description: product.descriptionAr || product.descriptionEn || undefined,
    image: (galleryImages || []).map((img) => img.url).filter(Boolean),
    ...(product.category ? { category: product.category.nameAr } : {}),
    ...(avgRating > 0 && product.reviews?.length
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: Number(avgRating.toFixed(1)),
            reviewCount: product.reviews.length,
          },
        }
      : {}),
    offers: {
      '@type': 'Offer',
      priceCurrency: 'EGP',
      price: currentPrice,
      availability:
        product.quantity > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    },
  }

  return (
    <>
    <Script
      id={`product-schema-${product.id}`}
      type="application/ld+json"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
    />
    <CardZoom>
    <div className={cn('bg-card rounded-2xl border border-border overflow-hidden shadow-sm', className)}>
      <div className="grid lg:grid-cols-2 gap-0">
        {/* Image Gallery */}
        <div className="min-w-0 p-4 sm:p-6 lg:p-8 bg-muted/30">
          {/* Main Image */}
          <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-card mb-4">
            {galleryImages?.[selectedImage]?.url ? (
              <Image
                src={galleryImages[selectedImage].url}
                alt={product.nameAr}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <Package className="h-16 w-16 text-muted-foreground" />
              </div>
            )}
            
            {/* Discount Badge */}
            {discountPercentage > 0 && (
              <Badge className="absolute top-4 right-4 bg-primary text-white border-0 rounded-full px-3 py-1">
                -{discountPercentage}%
              </Badge>
            )}
            
            {/* Out of Stock Badge */}
            {product.quantity === 0 && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <Badge variant="secondary" className="text-sm font-medium">
                  غير متوفر
                </Badge>
              </div>
            )}
            
            {/* Low Stock Warning */}
            {product.quantity > 0 && product.quantity <= 20 && (
              <div className="absolute bottom-4 left-4 bg-amber-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 shadow-md">
                <AlertTriangle className="h-3 w-3" />
                <span>متبقي {product.quantity} قطعة فقط</span>
              </div>
            )}
            
            {/* Share Button */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleShare}
              aria-label="مشاركة المنتج"
              className="absolute top-4 left-4 bg-card/80 hover:bg-card rounded-full"
            >
              <Share2 className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>

          {/* Thumbnails (reflect the selected colour's gallery) */}
          {galleryImages && galleryImages.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {galleryImages.map((image, index) => (
                <button
                  type="button"
                  key={image.id || index}
                  onClick={() => setSelectedImage(index)}
                  aria-label={`عرض الصورة ${index + 1}`}
                  aria-pressed={selectedImage === index}
                  className={cn(
                    'relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all',
                    selectedImage === index
                      ? 'border-primary ring-2 ring-primary/30'
                      : 'border-transparent hover:border-primary/30'
                  )}
                >
                  <Image
                    src={image.url}
                    alt={`${product.nameAr} - ${index + 1}`}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="min-w-0 p-4 sm:p-6 lg:p-8">
          {/* Category */}
          {product.category && (
            <button 
              onClick={() => navigateTo('shop')}
              className="text-sm text-primary mb-2 hover:underline"
            >
              {product.category.nameAr}
            </button>
          )}

          {/* Name */}
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mb-2 break-words">
            {product.nameAr}
          </h1>
          <p className="text-muted-foreground mb-4">{product.nameEn}</p>

          {/* Rating */}
          {avgRating > 0 && (
            <div className="flex items-center gap-3 mb-6">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={cn(
                      'w-5 h-5',
                      star <= Math.round(avgRating)
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-muted'
                    )}
                  />
                ))}
              </div>
              <span className="text-muted-foreground">
                {avgRating.toFixed(1)} ({product.reviews?.length || 0} تقييم)
              </span>
            </div>
          )}

          {/* Price */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-6">
            <span className="text-2xl sm:text-3xl font-bold text-primary">
              {formatPrice(currentPrice)} ج.م
            </span>
            {product.comparePrice && product.comparePrice > currentPrice && (
              <>
                <span className="text-lg sm:text-xl text-muted-foreground line-through">
                  {formatPrice(product.comparePrice)} ج.م
                </span>
                <Badge variant="secondary" className="bg-primary/20 text-primary">
                  وفر {formatPrice(product.comparePrice - currentPrice)} ج.م
                </Badge>
              </>
            )}
          </div>

          <Separator className="mb-6" />

          {/* Color Selector */}
          {uniqueColors.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-foreground">اللون</h3>
                {selectedColor && (
                  <span className="text-sm text-muted-foreground">{selectedColor}</span>
                )}
              </div>
              <div className="flex flex-wrap gap-3 p-3 bg-secondary/50 rounded-xl">
                {uniqueColors.map((color) => {
                  const colorHex = colorHexByName[color] ?? getColorHexSafe(color);
                  const isLight = isLightColor(colorHex);
                  const isSelected = selectedColor === color;
                  const isAvailable = selectedSize 
                    ? availableColorsForSize.includes(color)
                    : true;
                  
                  return (
                    <button
                      key={color}
                      onClick={() => handleColorChange(color)}
                      disabled={!isAvailable}
                      className={cn(
                        'relative w-11 h-11 rounded-full transition-all shadow-sm',
                        isSelected
                          ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                          : 'hover:scale-110',
                        !isAvailable && 'opacity-40 cursor-not-allowed'
                      )}
                      style={{ 
                        backgroundColor: colorHex,
                        border: isLight ? '2px solid var(--border)' : '2px solid transparent'
                      }}
                      title={color}
                    >
                      {isSelected && (
                        <span className="absolute inset-0 flex items-center justify-center">
                          <Check 
                            className={cn(
                              'w-5 h-5',
                              isLight ? 'text-foreground' : 'text-white'
                            )} 
                          />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Size Selector */}
          {uniqueSizes.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-foreground">المقاس</h3>
                <button
                  type="button"
                  className="text-sm text-primary hover:text-primary/80"
                  onClick={() => setShowSizeGuide(true)}
                >
                  دليل المقاسات
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {uniqueSizes.map((size) => {
                  const isSelected = selectedSize === size;
                  const isAvailable = selectedColor
                    ? availableSizesForColor.includes(size)
                    : true;
                  
                  return (
                    <Button
                      key={size}
                      variant={isSelected ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleSizeChange(size)}
                      disabled={!isAvailable}
                      className={cn(
                        'min-w-14 h-11 font-medium transition-all',
                        isSelected
                          ? 'bg-primary hover:bg-primary/90 text-primary-foreground border-primary'
                          : 'border-border text-foreground hover:border-primary/50 hover:text-primary',
                        !isAvailable && 'opacity-40 cursor-not-allowed'
                      )}
                    >
                      {size}
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity Selector */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-foreground">الكمية</h3>
              {/* Low Stock Warning */}
              {product.quantity > 0 && product.quantity <= 20 && (
                <span className="text-xs text-amber-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  متبقي {product.quantity} قطعة فقط
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center border border-border rounded-lg bg-card">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                  className="text-primary hover:text-primary/80 hover:bg-primary/10"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center font-medium text-foreground">{quantity}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= (selectedVariant 
                    ? (product.variants.find(v => v.id === selectedVariant)?.quantity || 10)
                    : product.quantity
                  )}
                  className="text-primary hover:text-primary/80 hover:bg-primary/10"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <span className="text-sm text-muted-foreground">
                {selectedVariant 
                  ? `${product.variants.find(v => v.id === selectedVariant)?.quantity || 0} قطع متبقية`
                  : `${product.quantity} قطع متبقية`
                }
              </span>
            </div>
          </div>

          <Separator className="mb-6" />

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mb-6">
            <Button
              className="flex-1 min-w-0 basis-[60%] bg-primary hover:bg-primary/90 text-white h-12 text-base sm:text-lg"
              onClick={handleAddToCart}
              disabled={product.quantity === 0}
            >
              <ShoppingCart className="h-5 w-5 ml-2 shrink-0" />
              <span className="truncate">{product.quantity === 0 ? 'غير متوفر' : 'أضف للسلة'}</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleWishlist}
              aria-label={isInWishlist(product.id) ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
              aria-pressed={isInWishlist(product.id)}
              className={cn(
                'h-12 w-12 border-primary/30',
                isInWishlist(product.id)
                  ? 'bg-primary/10 border-primary/50 text-primary'
                  : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
              )}
            >
              <Heart
                className={cn('h-5 w-5', isInWishlist(product.id) && 'fill-primary')}
              />
            </Button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="text-center p-2 sm:p-3 rounded-lg bg-secondary/50"
              >
                <feature.icon className="h-6 w-6 mx-auto text-primary mb-2" />
                <p className="text-xs sm:text-sm font-medium text-foreground">{feature.title}</p>
                <p className="text-xs text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>

          {/* Breadcrumb */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
            <button onClick={() => navigateTo('home')} className="hover:text-primary">
              الرئيسية
            </button>
            <ChevronRight className="h-4 w-4" />
            <button onClick={() => navigateTo('shop')} className="hover:text-primary">
              المتجر
            </button>
            <ChevronRight className="h-4 w-4" />
            {product.category && (
              <>
                <button onClick={() => navigateTo('shop')} className="hover:text-primary">
                  {product.category.nameAr}
                </button>
                <ChevronRight className="h-4 w-4" />
              </>
            )}
            <span className="text-foreground font-medium">{product.nameAr}</span>
          </div>
        </div>
      </div>

      {/* Product Tabs */}
      <div className="border-t border-border">
        <Tabs defaultValue="description" className="w-full">
          <TabsList className="w-full justify-start bg-transparent h-auto p-0 border-b border-border rounded-none overflow-x-auto flex-nowrap">
            <TabsTrigger
              value="description"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none shrink-0 whitespace-nowrap px-4 sm:px-6 py-4 text-muted-foreground"
            >
              الوصف
            </TabsTrigger>
            <TabsTrigger
              value="details"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none shrink-0 whitespace-nowrap px-4 sm:px-6 py-4 text-muted-foreground"
            >
              التفاصيل
            </TabsTrigger>
            <TabsTrigger
              value="reviews"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none shrink-0 whitespace-nowrap px-4 sm:px-6 py-4 text-muted-foreground"
            >
              التقييمات ({product.reviews?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="description" className="p-4 sm:p-6 lg:p-8">
            <div className="prose prose-neutral max-w-none">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                وصف المنتج
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                {product.descriptionAr || `${product.nameAr} - قطعة أنيقة وعصرية مصممة بعناية فائقة لتناسب ذوقك الرفيع. تتميز هذه القطعة بتصميم فريد يجمع بين الأناقة والراحة، مما يجعلها خياراً مثالياً للمناسبات المختلفة.`}
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>خامة عالية الجودة ومريحة</li>
                <li>تصميم عصري وأنيق</li>
                <li>مناسب للمناسبات اليومية والرسمية</li>
                <li>متوفر بعدة ألوان ومقاسات</li>
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="details" className="p-4 sm:p-6 lg:p-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  معلومات المنتج
                </h3>
                <dl className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-border">
                    <dt className="text-muted-foreground">SKU</dt>
                    <dd className="text-foreground font-medium">{product.slug}</dd>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <dt className="text-muted-foreground">التصنيف</dt>
                    <dd className="text-foreground font-medium">{product.category?.nameAr || '-'}</dd>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <dt className="text-muted-foreground">المقاسات المتوفرة</dt>
                    <dd className="text-foreground font-medium">
                      {uniqueSizes.join(', ') || '-'}
                    </dd>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <dt className="text-muted-foreground">الألوان المتوفرة</dt>
                    <dd className="text-foreground font-medium">
                      {uniqueColors.length > 0 ? `${uniqueColors.length} ألوان` : '-'}
                    </dd>
                  </div>
                </dl>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  تعليمات العناية
                </h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <ChevronRight className="h-4 w-4 text-primary" />
                    غسل في الغسالة بدرجة حرارة 30
                  </li>
                  <li className="flex items-center gap-2">
                    <ChevronRight className="h-4 w-4 text-primary" />
                    لا يستخدم المبيض
                  </li>
                  <li className="flex items-center gap-2">
                    <ChevronRight className="h-4 w-4 text-primary" />
                    كي على درجة حرارة متوسطة
                  </li>
                  <li className="flex items-center gap-2">
                    <ChevronRight className="h-4 w-4 text-primary" />
                    التنظيف الجاف مسموح
                  </li>
                </ul>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="reviews" className="p-4 sm:p-6 lg:p-8">
            <ReviewList 
              productId={product.id}
              userId={user?.id}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
    </CardZoom>

      {/* Related Products */}
      <RelatedProducts 
        categoryId={product.category?.id} 
        currentProductId={product.id}
        limit={4}
      />

      {/* Size Guide Modal */}
      {showSizeGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="size-guide-title"
        >
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowSizeGuide(false)}
          />
          {/* Content */}
          <div className="relative w-full max-w-lg bg-card rounded-2xl border border-border shadow-xl p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 id="size-guide-title" className="text-lg font-semibold text-foreground">
                دليل المقاسات
              </h2>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowSizeGuide(false)}
                aria-label="إغلاق"
                className="rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {uniqueSizes.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="text-right py-2 px-3 font-medium">المقاس</th>
                      <th className="text-right py-2 px-3 font-medium">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uniqueSizes.map((size) => {
                      // A size is "متوفر" when the admin has not marked it
                      // unavailable AND there is stock for it.
                      const available = product.variants.some(
                        v => v.size === size && v.available !== false && v.quantity > 0
                      )
                      return (
                        <tr key={size} className="border-b border-border/60">
                          <td className="py-2 px-3 font-medium text-foreground">{size}</td>
                          <td className="py-2 px-3">
                            {available ? (
                              <span className="text-green-600">متوفر</span>
                            ) : (
                              <span className="text-muted-foreground">غير متوفر</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                لا توجد مقاسات متاحة لهذا المنتج.
              </p>
            )}

            <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
              نصيحة: إذا كنت بين مقاسين، نوصي باختيار المقاس الأكبر للحصول على راحة أفضل.
              لأي استفسار حول المقاسات يمكنك التواصل مع خدمة العملاء.
            </p>
          </div>
        </div>
      )}
    </>
  )
}
