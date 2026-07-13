'use client'

import * as React from 'react'
import Image from 'next/image'
import { X, Trash2, Check, Minus, Star, Package } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { useCompareStore, type Product } from '@/store'
import { cn } from '@/lib/utils'
import { getProductColorHex } from '@/lib/colors'

interface CompareModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CompareModal({ open, onOpenChange }: CompareModalProps) {
  const { items, removeItem, clearCompare } = useCompareStore()

  // Get unique colors from variants
  const getUniqueColors = (product: Product) => {
    const uniqueColors = new Map<string, string>()
    if (product.variants && product.variants.length > 0) {
      product.variants.forEach(variant => {
        if (variant.color && !uniqueColors.has(variant.color)) {
          uniqueColors.set(variant.color, getProductColorHex(variant))
        }
      })
    }
    return Array.from(uniqueColors.entries())
  }

  // Get unique sizes from variants
  const getUniqueSizes = (product: Product) => {
    const sizes = new Set<string>()
    if (product.variants && product.variants.length > 0) {
      product.variants.forEach(variant => {
        if (variant.size) sizes.add(variant.size)
      })
    }
    return Array.from(sizes)
  }

  // Calculate discount percentage
  const getDiscount = (product: Product) => {
    if (product.comparePrice) {
      return Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    }
    return 0
  }

  // Find best value for comparison
  const getBestPrice = () => {
    if (items.length === 0) return null
    return Math.min(...items.map(item => item.product.price))
  }

  const bestPrice = getBestPrice()

  if (items.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">مقارنة المنتجات</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-center">
              لم تقم بإضافة منتجات للمقارنة بعد
            </p>
            <p className="text-sm text-muted-foreground text-center mt-2">
              يمكنك إضافة حتى 4 منتجات للمقارنة
            </p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-7xl max-w-[1800px] max-h-[95vh] p-0 mx-auto">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">مقارنة المنتجات ({items.length})</DialogTitle>
            <Button variant="ghost" size="sm" onClick={clearCompare} className="text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              مسح الكل
            </Button>
          </div>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(95vh-140px)] overflow-x-auto">
          <div className="p-6">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-right p-3 bg-muted/50 font-medium w-32 sticky left-0 z-10">
                    الميزة
                  </th>
                  {items.map((item) => (
                    <th key={item.productId} className="p-3 min-w-[240px]">
                      <div className="relative">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 z-10"
                          onClick={() => removeItem(item.productId)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Product Image */}
                <tr>
                  <td className="p-3 bg-muted/50 font-medium sticky left-0 z-10">الصورة</td>
                  {items.map((item) => (
                    <td key={item.productId} className="p-3 text-center">
                      <div className="relative aspect-square w-36 mx-auto rounded-lg overflow-hidden bg-muted shadow-sm">
                        {item.product.images?.[0]?.url ? (
                          <Image
                            src={item.product.images[0].url}
                            alt={item.product.nameAr}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-12 w-12 text-muted-foreground/50" />
                          </div>
                        )}
                        {getDiscount(item.product) > 0 && (
                          <Badge className="absolute top-2 right-2 bg-destructive text-white">
                            -{getDiscount(item.product)}%
                          </Badge>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Product Name */}
                <tr className="bg-muted/30">
                  <td className="p-3 bg-muted/50 font-medium sticky left-0 z-10">اسم المنتج</td>
                  {items.map((item) => (
                    <td key={item.productId} className="p-3 text-center">
                      <p className="font-medium text-foreground">{item.product.nameAr}</p>
                      <p className="text-sm text-muted-foreground">{item.product.nameEn}</p>
                    </td>
                  ))}
                </tr>

                {/* Price */}
                <tr>
                  <td className="p-3 bg-muted/50 font-medium sticky left-0 z-10">السعر</td>
                  {items.map((item) => (
                    <td key={item.productId} className="p-3 text-center">
                      <div className="flex flex-col items-center">
                        <span className={cn(
                          "text-lg font-bold",
                          item.product.price === bestPrice ? "text-emerald-600" : "text-foreground"
                        )}>
                          {item.product.price.toLocaleString()} ج.م
                        </span>
                        {item.product.comparePrice && (
                          <span className="text-sm text-muted-foreground line-through">
                            {item.product.comparePrice.toLocaleString()} ج.م
                          </span>
                        )}
                        {item.product.price === bestPrice && items.length > 1 && (
                          <Badge variant="secondary" className="mt-1 bg-emerald-100 text-emerald-700">
                            أفضل سعر
                          </Badge>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Category */}
                <tr className="bg-muted/30">
                  <td className="p-3 bg-muted/50 font-medium sticky left-0 z-10">التصنيف</td>
                  {items.map((item) => (
                    <td key={item.productId} className="p-3 text-center">
                      <span className="text-muted-foreground">
                        {item.product.category?.nameAr || '-'}
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Colors */}
                <tr>
                  <td className="p-3 bg-muted/50 font-medium sticky left-0 z-10">الألوان</td>
                  {items.map((item) => {
                    const colors = getUniqueColors(item.product)
                    return (
                      <td key={item.productId} className="p-3 text-center">
                        {colors.length > 0 ? (
                          <div className="flex justify-center gap-1 flex-wrap">
                            {colors.map(([name, hex]) => (
                              <div
                                key={name}
                                className={cn(
                                  "w-6 h-6 rounded-full border-2 border-background shadow-sm ring-1 ring-black/10",
                                  hex === '#ffffff' && "ring-gray-300"
                                )}
                                style={{ backgroundColor: hex }}
                                title={name}
                              />
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                    )
                  })}
                </tr>

                {/* Sizes */}
                <tr className="bg-muted/30">
                  <td className="p-3 bg-muted/50 font-medium sticky left-0 z-10">المقاسات</td>
                  {items.map((item) => {
                    const sizes = getUniqueSizes(item.product)
                    return (
                      <td key={item.productId} className="p-3 text-center">
                        {sizes.length > 0 ? (
                          <div className="flex justify-center gap-1 flex-wrap">
                            {sizes.map((size) => (
                              <span
                                key={size}
                                className="text-xs px-2 py-1 bg-secondary rounded border border-border"
                              >
                                {size}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                    )
                  })}
                </tr>

                {/* Availability */}
                <tr>
                  <td className="p-3 bg-muted/50 font-medium sticky left-0 z-10">التوفر</td>
                  {items.map((item) => (
                    <td key={item.productId} className="p-3 text-center">
                      {item.product.quantity > 0 ? (
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                          <Check className="h-3 w-3 mr-1" />
                          متوفر ({item.product.quantity})
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-red-100 text-red-700">
                          <Minus className="h-3 w-3 mr-1" />
                          غير متوفر
                        </Badge>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Rating */}
                <tr className="bg-muted/30">
                  <td className="p-3 bg-muted/50 font-medium sticky left-0 z-10">التقييم</td>
                  {items.map((item) => (
                    <td key={item.productId} className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        <span className="text-muted-foreground">4.5</span>
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
