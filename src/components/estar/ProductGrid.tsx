'use client'

import { useState, useEffect } from 'react'
import { Package, ChevronLeft, ChevronRight, Heart, ShoppingCart, Scale, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationEllipsis,
} from '@/components/ui/pagination'
import { useCartStore, useWishlistStore, useCompareStore, type Product } from '@/store'
import { CompareModal } from './CompareModal'
import { useSiteSettings } from '@/hooks/useSiteSettings'
import type { FilterState } from './ProductFilters'
import { cn } from '@/lib/utils'
import { getColorHex } from '@/lib/colors'
import { csrfFetch } from '@/lib/csrf-fetch'

// Map filter color IDs to Arabic color names (for API filtering)
const colorIdToName: Record<string, string> = {
  'black': 'أسود',
  'white': 'أبيض',
  'beige': 'بيج',
  'pink': 'وردي',
  'rose': 'روز',
  'lavender': 'لافندر',
  'sage': 'مريمي',
  'navy': 'كحلي',
}

interface ProductGridProps {
  filters?: FilterState
  searchQuery?: string
  gridView?: 'grid' | 'list'
  onProductClick?: (id: string) => void
  className?: string
}

interface ProductResponse {
  id: string
  nameEn: string
  nameAr: string
  slug: string
  price: number
  comparePrice: number | null
  images: { id: string; url: string; alt: string | null }[]
  variants: { id: string; name: string; color: string | null; size: string | null; price: number | null; quantity: number }[]
  category?: { id: string; nameEn: string; nameAr: string }
  quantity: number
}

// ProductCard component
function ProductCard({
  product,
  onClick,
  onAddToCart,
  onAddToWishlist,
  onToggleCompare,
  isInWishlist,
  isInCompare,
  compareEnabled,
}: {
  product: ProductResponse
  onClick?: () => void
  onAddToCart?: () => void
  onAddToWishlist?: () => void
  onToggleCompare?: () => void
  isInWishlist?: boolean
  isInCompare?: boolean
  compareEnabled?: boolean
}) {
  const discount = product.comparePrice 
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0

  return (
    <Card
      className="group overflow-hidden border-border hover:border-primary/50 hover:shadow-lg transition-all duration-300 cursor-pointer bg-background"
      onClick={onClick}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-muted">
        {product.images?.[0]?.url ? (
          <img
            src={product.images[0].url}
            alt={product.nameAr}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-12 w-12 text-muted-foreground/50" />
          </div>
        )}

        {/* Discount Badge */}
        {discount > 0 && (
          <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground hover:bg-primary/90">
            -{discount}%
          </Badge>
        )}

        {/* Quick Actions */}
        <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Button
            className="w-full bg-background/95 text-foreground hover:bg-primary hover:text-primary-foreground shadow-lg"
            onClick={(e) => {
              e.stopPropagation()
              onAddToCart?.()
            }}
          >
            <ShoppingCart className="h-4 w-4 me-2" />
            أضف للسلة
          </Button>
        </div>

        {/* Wishlist Button */}
        <button
          className={cn(
            "absolute top-3 left-3 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
            isInWishlist 
              ? "bg-primary text-primary-foreground opacity-100" 
              : "bg-background/80 opacity-0 group-hover:opacity-100 hover:bg-background"
          )}
          onClick={(e) => {
            e.stopPropagation()
            onAddToWishlist?.()
          }}
        >
          <Heart className={cn("h-4 w-4", isInWishlist && "fill-current")} />
        </button>

        {/* Compare Button */}
        {compareEnabled && (
          <button
            className={cn(
              "absolute top-3 left-14 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
              isInCompare 
                ? "bg-secondary text-secondary-foreground opacity-100" 
                : "bg-background/80 opacity-0 group-hover:opacity-100 hover:bg-background"
            )}
            onClick={(e) => {
              e.stopPropagation()
              onToggleCompare?.()
            }}
            title={isInCompare ? "إزالة من المقارنة" : "إضافة للمقارنة"}
          >
            <Scale className={cn("h-4 w-4", isInCompare && "fill-current")} />
          </button>
        )}
      </div>

      <CardContent className="p-4">
        {/* Product Name */}
        <h3 className="font-medium text-foreground text-sm mb-1 line-clamp-2 min-h-[2.5rem]">
          {product.nameAr}
        </h3>
        <p className="text-xs text-muted-foreground mb-2">{product.nameEn}</p>

        {/* Category */}
        {product.category && (
          <p className="text-xs text-primary mb-2">{product.category.nameAr}</p>
        )}

        {/* Price */}
        <div className="flex items-center gap-2">
          <span className="font-semibold text-primary">{product.price.toLocaleString()} ج.م</span>
          {product.comparePrice && (
            <span className="text-sm text-muted-foreground line-through">
              {product.comparePrice.toLocaleString()} ج.م
            </span>
          )}
        </div>

        {/* Colors */}
        {product.variants && product.variants.length > 0 && (() => {
          // Get unique colors
          const uniqueColors = new Map<string, string>()
          product.variants.forEach(variant => {
            if (variant.color && !uniqueColors.has(variant.color)) {
              uniqueColors.set(variant.color, getColorHex(variant.color))
            }
          })
          const colorsArray = Array.from(uniqueColors.entries())
          
          return colorsArray.length > 0 && (
            <div className="flex items-center gap-1 mt-3 p-1 bg-muted/50 rounded-full">
              {colorsArray.slice(0, 5).map(([colorName, hex], idx) => (
                <span
                  key={idx}
                  className={cn(
                    "w-4 h-4 rounded-full border-2 border-background shadow-sm ring-1 ring-black/10",
                    hex === '#ffffff' && "ring-gray-200"
                  )}
                  style={{ backgroundColor: hex }}
                  title={colorName}
                />
              ))}
              {colorsArray.length > 5 && (
                <span className="text-xs text-muted-foreground px-1">+{colorsArray.length - 5}</span>
              )}
            </div>
          )
        })()}
      </CardContent>
    </Card>
  )
}

// Loading Skeleton
function ProductCardSkeleton() {
  return (
    <Card className="overflow-hidden border-border">
      <div className="aspect-[3/4] bg-muted">
        <Skeleton className="w-full h-full" />
      </div>
      <CardContent className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-5 w-1/4" />
        <div className="flex gap-1">
          <Skeleton className="w-4 h-4 rounded-full" />
          <Skeleton className="w-4 h-4 rounded-full" />
          <Skeleton className="w-4 h-4 rounded-full" />
        </div>
      </CardContent>
    </Card>
  )
}

// Empty State
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-6">
        <Package className="w-12 h-12 text-muted-foreground/50" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">لا توجد منتجات</h3>
      <p className="text-muted-foreground max-w-sm">
        لم نتمكن من العثور على منتجات تطابق معايير البحث الخاصة بك. جرب تغيير الفلاتر.
      </p>
    </div>
  )
}

export function ProductGrid({
  filters,
  searchQuery = '',
  gridView = 'grid',
  onProductClick,
  className,
}: ProductGridProps) {
  const [products, setProducts] = useState<ProductResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [compareModalOpen, setCompareModalOpen] = useState(false)
  const itemsPerPage = 12
  
  const { settings } = useSiteSettings()
  const compareEnabled = settings.enable_compare === 'true'
  
  const { addItem: addToCart } = useCartStore()
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlistStore()
  const { items: compareItems, addItem: addToCompare, removeItem: removeFromCompare, isInCompare } = useCompareStore()

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        const params = new URLSearchParams()
        
        if (searchQuery) {
          params.append('search', searchQuery)
        }
        if (filters?.categories?.length) {
          params.append('category', filters.categories.join(','))
        }
        if (filters?.priceRange) {
          params.append('minPrice', filters.priceRange[0].toString())
          params.append('maxPrice', filters.priceRange[1].toString())
        }
        if (filters?.sizes?.length) {
          params.append('size', filters.sizes.join(','))
        }
        if (filters?.colors?.length) {
          // Convert color IDs to Arabic names for API
          const colorNames = filters.colors.map(id => colorIdToName[id] || id)
          params.append('color', colorNames.join(','))
        }
        if (filters?.sort) {
          params.append('sort', filters.sort)
        }
        
        const response = await csrfFetch(`/api/products?${params.toString()}`)
        if (response.ok) {
          const data = await response.json()
          setProducts(data.products || [])
        }
      } catch (error) {
        // Handle error silently
      } finally {
        setLoading(false)
      }
    }
    
    fetchProducts()
  }, [searchQuery, filters])

  const totalPages = Math.ceil(products.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentProducts = products.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleAddToCart = (product: ProductResponse) => {
    const cartProduct: Product = {
      id: product.id,
      nameEn: product.nameEn,
      nameAr: product.nameAr,
      slug: product.slug,
      descriptionEn: '',
      descriptionAr: '',
      price: product.price,
      comparePrice: product.comparePrice,
      sku: '',
      quantity: product.quantity,
      categoryId: product.category?.id || '',
      images: product.images,
      variants: product.variants,
      category: product.category,
      featured: false,
      active: true,
    }
    addToCart(cartProduct, null, 1)
  }

  const handleToggleWishlist = (product: ProductResponse) => {
    const wishlistProduct: Product = {
      id: product.id,
      nameEn: product.nameEn,
      nameAr: product.nameAr,
      slug: product.slug,
      descriptionEn: '',
      descriptionAr: '',
      price: product.price,
      comparePrice: product.comparePrice,
      sku: '',
      quantity: product.quantity,
      categoryId: product.category?.id || '',
      images: product.images,
      variants: product.variants,
      category: product.category,
      featured: false,
      active: true,
    }
    
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id)
    } else {
      addToWishlist(wishlistProduct)
    }
  }

  const handleToggleCompare = (product: ProductResponse) => {
    const compareProduct: Product = {
      id: product.id,
      nameEn: product.nameEn,
      nameAr: product.nameAr,
      slug: product.slug,
      descriptionEn: '',
      descriptionAr: '',
      price: product.price,
      comparePrice: product.comparePrice,
      sku: '',
      quantity: product.quantity,
      categoryId: product.category?.id || '',
      images: product.images,
      variants: product.variants,
      category: product.category,
      featured: false,
      active: true,
    }
    
    if (isInCompare(product.id)) {
      removeFromCompare(product.id)
    } else {
      addToCompare(compareProduct)
    }
  }

  const renderPagination = () => {
    if (totalPages <= 1) return null

    const pages: (number | 'ellipsis')[] = []
    const showEllipsisStart = currentPage > 3
    const showEllipsisEnd = currentPage < totalPages - 2

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      pages.push(1)
      if (showEllipsisStart) {
        pages.push('ellipsis')
      }
      for (
        let i = Math.max(2, currentPage - 1);
        i <= Math.min(totalPages - 1, currentPage + 1);
        i++
      ) {
        if (!pages.includes(i)) {
          pages.push(i)
        }
      }
      if (showEllipsisEnd) {
        pages.push('ellipsis')
      }
      if (!pages.includes(totalPages)) {
        pages.push(totalPages)
      }
    }

    return (
      <Pagination className="mt-8">
        <PaginationContent>
          <PaginationItem>
            <Button
              variant="ghost"
              size="icon"
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
              className="text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </PaginationItem>

          {pages.map((page, index) => (
            <PaginationItem key={index}>
              {page === 'ellipsis' ? (
                <PaginationEllipsis />
              ) : (
                <PaginationLink
                  onClick={() => handlePageChange(page)}
                  isActive={currentPage === page}
                  className={cn(
                    'cursor-pointer',
                    currentPage === page
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  {page}
                </PaginationLink>
              )}
            </PaginationItem>
          ))}

          <PaginationItem>
            <Button
              variant="ghost"
              size="icon"
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
              className="text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    )
  }

  return (
    <div className={cn('', className)}>
      {/* Results Count */}
      {!loading && products.length > 0 && (
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-600">
            عرض {startIndex + 1}-{Math.min(endIndex, products.length)} من {products.length} منتج
          </p>
        </div>
      )}

      {/* Grid */}
{loading ? (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    {Array.from({ length: itemsPerPage }).map((_, i) => (
      <ProductCardSkeleton key={i} />
    ))}
  </div>
) : products.length === 0 ? (
  <EmptyState />
) : (
  <div className={cn(
    "gap-6",
    gridView === 'grid' 
      ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      : "grid grid-cols-1 md:grid-cols-2"
  )}>
    {currentProducts.map((product) => (
      <ProductCard
        key={product.id}
        product={product}
        onClick={() => onProductClick?.(product.id)}
        onAddToCart={() => handleAddToCart(product)}
        onAddToWishlist={() => handleToggleWishlist(product)}
        onToggleCompare={() => handleToggleCompare(product)}
        isInWishlist={isInWishlist(product.id)}
        isInCompare={isInCompare(product.id)}
        compareEnabled={compareEnabled}
      />
    ))}
  </div>
)}

      {/* Pagination */}
      {!loading && products.length > itemsPerPage && renderPagination()}

      {/* Compare Floating Bar */}
      {compareEnabled && compareItems.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-auto z-50">
          <div className="bg-card border border-border rounded-lg shadow-lg p-4 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">
                {compareItems.length} منتج للمقارنة
              </span>
            </div>
            <div className="flex items-center gap-2">
              {compareItems.slice(0, 3).map((item) => (
                <div key={item.productId} className="relative">
                  <div className="w-10 h-10 rounded bg-muted overflow-hidden">
                    {item.product.images?.[0]?.url ? (
                      <img
                        src={item.product.images[0].url}
                        alt={item.product.nameAr}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {compareItems.length > 3 && (
                <span className="text-xs text-muted-foreground">+{compareItems.length - 3}</span>
              )}
            </div>
            <div className="flex items-center gap-2 mr-auto">
              <Button
                size="sm"
                onClick={() => setCompareModalOpen(true)}
                disabled={compareItems.length < 2}
              >
                مقارنة
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => useCompareStore.getState().clearCompare()}
              >
                إلغاء
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Compare Modal */}
      <CompareModal open={compareModalOpen} onOpenChange={setCompareModalOpen} />
    </div>
  )
}

export { type ProductResponse }
