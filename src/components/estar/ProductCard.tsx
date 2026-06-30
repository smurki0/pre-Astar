'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Heart, ShoppingCart, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getColorHexSafe } from '@/lib/colors';

export interface Product {
  id: string;
  nameEn: string;
  nameAr: string;
  price: number;
  comparePrice?: number | null;
  images: { url: string; alt?: string | null }[];
  category?: { nameEn: string; nameAr: string };
  reviews?: { rating: number }[];
  quantity: number;
  variants?: { color?: string | null; colorHex?: string | null; size?: string | null; quantity: number }[];
}

interface ProductCardProps {
  product: Product;
  onAddToCart?: (productId: string) => void;
  onToggleWishlist?: (productId: string) => void;
  isInWishlist?: boolean;
}

export function ProductCard({
  product,
  onAddToCart,
  onToggleWishlist,
  isInWishlist: isWishlistProp = false,
}: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isWishlistedLocal, setIsWishlistedLocal] = useState(isWishlistProp);

  const mainImage = product.images[0]?.url || '/placeholder-product.png';
  const secondaryImage = product.images[1]?.url || mainImage;

  // Calculate average rating
  const avgRating = product.reviews && product.reviews.length > 0
    ? product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.reviews.length
    : 0;

  // Calculate discount percentage
  const discountPercentage = product.comparePrice
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0;

  // Extract unique colors and sizes from variants
  const uniqueColors = new Map<string, string>();
  const uniqueSizes = new Set<string>();
  // Live remaining stock per size = sum of quantities across that size's variants
  const sizeStock = new Map<string, number>();
  
  if (product.variants && product.variants.length > 0) {
    product.variants.forEach(variant => {
      if (variant.color) {
        // Prefer the stored hex; fall back to the name map only when missing/invalid
        const hex = variant.colorHex && /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/.test(variant.colorHex)
          ? variant.colorHex
          : getColorHexSafe(variant.color);
        uniqueColors.set(variant.color, hex);
      }
      if (variant.size) {
        uniqueSizes.add(variant.size);
        sizeStock.set(variant.size, (sizeStock.get(variant.size) ?? 0) + (variant.quantity ?? 0));
      }
    });
  }
  
  const colorsArray = Array.from(uniqueColors.entries());
  const sizesArray = Array.from(uniqueSizes);

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlistedLocal(!isWishlistedLocal);
    onToggleWishlist?.(product.id);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onAddToCart?.(product.id);
  };

  return (
    <Card
      className="group relative overflow-hidden border border-border shadow-sm hover:shadow-lg hover:border-primary/20 transition-all duration-300 bg-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className="relative aspect-[3/4] overflow-hidden bg-muted">
        {/* Main Image */}
        <Image
          src={mainImage}
          alt={product.nameEn}
          fill
          className={cn(
            'object-cover transition-transform duration-500',
            isHovered && 'scale-110'
          )}
          sizes="(max-width: 768px) 50vw, 25vw"
        />

        {/* Secondary Image on Hover */}
        {product.images.length > 1 && (
          <Image
            src={secondaryImage}
            alt={product.nameEn}
            fill
            className={cn(
              'object-cover transition-opacity duration-300',
              isHovered ? 'opacity-100' : 'opacity-0'
            )}
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        )}

        {/* Discount Badge */}
        {discountPercentage > 0 && (
          <Badge className="absolute top-3 left-3 bg-destructive text-white border-0 rounded-full px-2.5 py-0.5 text-xs font-medium">
            -{discountPercentage}%
          </Badge>
        )}

        {/* Out of Stock Badge */}
        {product.quantity === 0 && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <Badge variant="secondary" className="text-sm font-medium">
              Sold Out
            </Badge>
          </div>
        )}

        {/* Wishlist Button */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'absolute top-3 right-3 rounded-full bg-white/80 hover:bg-white backdrop-blur-sm transition-all duration-300',
            isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
          )}
          onClick={handleWishlistToggle}
        >
          <Heart
            className={cn(
              'h-5 w-5 transition-colors',
              isWishlistedLocal ? 'fill-destructive text-destructive' : 'text-muted-foreground'
            )}
          />
        </Button>

        {/* Quick Add to Cart Button */}
        <div
          className={cn(
            'absolute bottom-0 left-0 right-0 p-3 transition-all duration-300',
            isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          )}
        >
          <Button
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-lg"
            onClick={handleAddToCart}
            disabled={product.quantity === 0}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            {product.quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
          </Button>
        </div>
      </div>

      {/* Product Info */}
      <CardContent className="p-4">
        {/* Category */}
        {product.category && (
          <p className="text-xs text-muted-foreground mb-1">
            {product.category.nameEn}
          </p>
        )}

        {/* Product Name */}
        <h3 className="font-medium text-foreground line-clamp-1 mb-1 group-hover:text-primary transition-colors">
          {product.nameEn}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-1 mb-2 font-arabic" dir="rtl">
          {product.nameAr}
        </p>

        {/* Rating */}
        {avgRating > 0 && (
          <div className="flex items-center gap-1 mb-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={cn(
                    'h-3.5 w-3.5',
                    star <= Math.round(avgRating)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-muted stroke-muted-foreground'
                  )}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              ({product.reviews?.length || 0})
            </span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-lg font-semibold text-foreground">
            {product.price.toFixed(2)} EGP
          </span>
          {product.comparePrice && (
            <span className="text-sm text-muted-foreground line-through">
              {product.comparePrice.toFixed(2)} EGP
            </span>
          )}
        </div>

        {/* Colors */}
        {colorsArray.length > 0 && (
          <div className="flex items-center gap-1.5 mt-2">
            <span className="text-xs text-muted-foreground">Colors:</span>
            <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-full">
              {colorsArray.slice(0, 5).map(([colorName, hex]) => (
                <div
                  key={colorName}
                  className="w-4 h-4 rounded-full border-2 border-white shadow-sm ring-1 ring-black/10"
                  style={{ backgroundColor: hex }}
                  title={colorName}
                />
              ))}
              {colorsArray.length > 5 && (
                <span className="text-xs text-muted-foreground px-1">+{colorsArray.length - 5}</span>
              )}
            </div>
          </div>
        )}

        {/* Sizes with live remaining stock per size */}
        {sizesArray.length > 0 && (
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            <span className="text-xs text-muted-foreground">Sizes:</span>
            <div className="flex items-center gap-1 flex-wrap">
              {sizesArray.slice(0, 4).map((size) => {
                const remaining = sizeStock.get(size) ?? 0;
                const soldOut = remaining <= 0;
                const low = remaining > 0 && remaining <= 5;
                return (
                  <span
                    key={size}
                    title={soldOut ? 'Out of stock' : `${remaining} left`}
                    className={cn(
                      'inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded border font-medium transition-colors',
                      soldOut
                        ? 'bg-muted text-muted-foreground border-border opacity-60'
                        : low
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-secondary text-secondary-foreground border-border'
                    )}
                  >
                    <span className={cn(soldOut && 'line-through')}>{size}</span>
                    <span className="tabular-nums text-[10px] leading-none rounded-full px-1 py-0.5 bg-background/70">
                      {soldOut ? '0' : remaining}
                    </span>
                  </span>
                );
              })}
              {sizesArray.length > 4 && (
                <span className="text-xs text-muted-foreground">+{sizesArray.length - 4}</span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Skeleton version for loading state
export function ProductCardSkeleton() {
  return (
    <Card className="overflow-hidden border border-border shadow-sm">
      <div className="relative aspect-[3/4] bg-muted animate-pulse" />
      <CardContent className="p-4 space-y-2">
        <div className="h-3 w-20 bg-muted animate-pulse rounded" />
        <div className="h-5 w-full bg-muted animate-pulse rounded" />
        <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
        <div className="h-4 w-16 bg-muted animate-pulse rounded" />
        <div className="flex gap-2">
          <div className="h-6 w-20 bg-muted animate-pulse rounded" />
          <div className="h-5 w-16 bg-muted animate-pulse rounded" />
        </div>
        {/* Colors skeleton */}
        <div className="flex items-center gap-1.5 mt-2">
          <div className="h-3 w-10 bg-muted animate-pulse rounded" />
          <div className="flex gap-1 p-1 bg-muted/50 rounded-full">
            <div className="w-4 h-4 bg-muted animate-pulse rounded-full" />
            <div className="w-4 h-4 bg-muted animate-pulse rounded-full" />
            <div className="w-4 h-4 bg-muted animate-pulse rounded-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
