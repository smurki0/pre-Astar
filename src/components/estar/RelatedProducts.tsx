'use client'

import { useEffect, useState } from 'react'
import { Package, Heart, ShoppingCart } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useCartStore, useWishlistStore, type Product } from '@/store'
import { useSiteSettings } from '@/hooks/useSiteSettings'
import { cn } from '@/lib/utils'
import { getProductColorHex } from '@/lib/colors'
import { useRouter } from 'next/navigation'
import { csrfFetch } from '@/lib/csrf-fetch'

interface RelatedProductsProps {
  categoryId?: string
  currentProductId: string
  limit?: number
}

interface ProductResponse {
  id: string
  nameEn: string
  nameAr: string
  slug: string
  price: number
  comparePrice: number | null
  images: { id: string; url: string; alt: string | null }[]
  variants: { id: string; name: string; color: string | null; colorHex: string | null; size: string | null; price: number | null; quantity: number }[]
  category?: { id: string; nameEn: string; nameAr: string }
  quantity: number
}

function ProductCardSimple({
  product,
  onClick,
  onAddToCart,
  onToggleWishlist,
  isInWishlist,
}: {
  product: ProductResponse
  onClick?: () => void
  onAddToCart?: () => void
  onToggleWishlist?: () => void
  isInWishlist?: boolean
}) {
  const discount = product.comparePrice 
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0

  // Get unique colors
  const uniqueColors = new Map<string, string>()
  if (product.variants && product.variants.length > 0) {
    product.variants.forEach(variant => {
      if (variant.color && !uniqueColors.has(variant.color)) {
        uniqueColors.set(variant.color, getProductColorHex(variant))
      }
    })
  }
  const colorsArray = Array.from(uniqueColors.entries())

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
            onToggleWishlist?.()
          }}
        >
          <Heart className={cn("h-4 w-4", isInWishlist && "fill-current")} />
        </button>
      </div>

      <CardContent className="p-4">
        <h3 className="font-medium text-foreground text-sm mb-1 line-clamp-2 min-h-[2.5rem]">
          {product.nameAr}
        </h3>
        <p className="text-xs text-muted-foreground mb-2">{product.nameEn}</p>

        {product.category && (
          <p className="text-xs text-primary mb-2">{product.category.nameAr}</p>
        )}

        <div className="flex items-center gap-2">
          <span className="font-semibold text-primary">{product.price.toLocaleString()} ج.م</span>
          {product.comparePrice && (
            <span className="text-sm text-muted-foreground line-through">
              {product.comparePrice.toLocaleString()} ج.م
            </span>
          )}
        </div>

        {/* Colors */}
        {colorsArray.length > 0 && (
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
        )}
      </CardContent>
    </Card>
  )
}

function ProductCardSkeletonSimple() {
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
      </CardContent>
    </Card>
  )
}

export function RelatedProducts({
  categoryId,
  currentProductId,
  limit = 4,
}: RelatedProductsProps) {
  const router = useRouter()
  const [products, setProducts] = useState<ProductResponse[]>([])
  const [loading, setLoading] = useState(true)

  const { settings } = useSiteSettings()
  const enabled = settings.enable_related_products === 'true'

  const { addItem: addToCart } = useCartStore()
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlistStore()

  useEffect(() => {
    if (!enabled || !categoryId) {
      setLoading(false)
      return
    }

    const fetchProducts = async () => {
      try {
        setLoading(true)
        const response = await csrfFetch(`/api/products?category=${categoryId}&limit=${limit + 1}`)
        if (response.ok) {
          const data = await response.json()
          // Filter out current product
          const filteredProducts = (data.products || []).filter(
            (p: ProductResponse) => p.id !== currentProductId
          )
          setProducts(filteredProducts.slice(0, limit))
        }
      } catch (error) {
        // Handle error silently
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [categoryId, currentProductId, limit, enabled])

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

  const navigateToProduct = (productId: string) => {
    router.push(`/?view=product&id=${productId}`)
  }

  // Don't render if disabled
  if (!enabled) {
    return null
  }

  // Don't render if no category
  if (!categoryId) {
    return null
  }

  // Don't render if loading completed but no products
  if (!loading && products.length === 0) {
    return null
  }

  return (
    <section className="py-8 md:py-12">
      <div className="container px-4">
        <h2 className="text-xl md:text-2xl font-bold text-foreground mb-6">
          منتجات مشابهة
          <span className="text-muted-foreground text-lg mr-2">Related Products</span>
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {loading
            ? Array.from({ length: limit }).map((_, i) => (
                <ProductCardSkeletonSimple key={i} />
              ))
            : products.map((product) => (
                <ProductCardSimple
                  key={product.id}
                  product={product}
                  onClick={() => navigateToProduct(product.id)}
                  onAddToCart={() => handleAddToCart(product)}
                  onToggleWishlist={() => handleToggleWishlist(product)}
                  isInWishlist={isInWishlist(product.id)}
                />
              ))}
        </div>
      </div>
    </section>
  )
}
