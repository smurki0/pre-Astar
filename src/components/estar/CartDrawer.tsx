'use client'

import * as React from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Truck, PartyPopper } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'
import { Progress } from '@/components/ui/progress'
import { useCartStore, type Product } from '@/store'
import { getProductColorHex } from '@/lib/colors'
import { useLanguage } from '@/lib/i18n'
import { useSiteSettings } from '@/hooks/useSiteSettings'
import { cn } from '@/lib/utils'

interface CartDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Format price
function formatPrice(price: number, language: 'en' | 'ar', currencySymbol: string): string {
  if (language === 'ar') {
    return `${price.toFixed(2)} ${currencySymbol}`
  }
  return `${currencySymbol}${price.toFixed(2)}`
}

export function CartDrawer({ open, onOpenChange }: CartDrawerProps) {
  const { t, language, isRTL, dir } = useLanguage()
  const { settings } = useSiteSettings()
  const { items, removeItem, updateQuantity, getTotal, clearCart } = useCartStore()
  
  const currencySymbol = settings.currency_symbol || 'ج.م'
  const freeShippingThreshold = parseFloat(settings.free_shipping_threshold || '2000')
  
  const subtotal = getTotal()
  const isEmpty = items.length === 0
  const hasFreeShipping = subtotal >= freeShippingThreshold
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal)
  const progressPercent = Math.min(100, (subtotal / freeShippingThreshold) * 100)
  
  const handleQuantityChange = (productId: string, variantId: string | null, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(productId, variantId)
    } else {
      updateQuantity(productId, variantId, newQuantity)
    }
  }
  
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side={isRTL ? 'left' : 'right'} 
        className="w-full sm:max-w-md flex flex-col p-0 overflow-hidden"
        dir={dir}
      >
        {/* Header */}
        <SheetHeader className="p-6 pb-0">
          <SheetTitle className="flex items-center gap-2 text-xl">
            <ShoppingBag className="h-5 w-5 text-primary" />
            {t('cart.title')}
            {!isEmpty && (
              <span className="text-sm font-normal text-muted-foreground">
                ({items.length} {language === 'ar' ? 'منتج' : 'items'})
              </span>
            )}
          </SheetTitle>
        </SheetHeader>
        
        {/* Content */}
        {isEmpty ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            >
              <ShoppingBag className="h-16 w-16 text-muted-foreground/30 mb-4" />
            </motion.div>
            <p className="text-muted-foreground mb-4">{t('cart.empty')}</p>
            <Button onClick={() => onOpenChange(false)} asChild>
              <Link href="/?view=shop" className="gap-2">
                {t('cart.continueShopping')}
                <ArrowRight className={cn("h-4 w-4", isRTL && "rotate-180")} />
              </Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Cart Items */}
            <ScrollArea className="flex-1 min-h-0 px-6">
              <div className="space-y-4 py-4">
                <AnimatePresence mode="popLayout">
                  {items.map((item, index) => {
                    const variant = item.product.variants.find(v => v.id === item.variantId)
                    const price = variant?.price ?? item.product.price
                    const image = item.product.images[0]?.url
                    
                    return (
                      <motion.div
                        key={`${item.productId}-${item.variantId}`}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: isRTL ? -100 : 100 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex gap-4 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                      >
                        {/* Product Image */}
                        <div className="relative w-20 h-20 rounded-md overflow-hidden bg-muted shrink-0">
                          {image ? (
                            <img
                              src={image}
                              alt={item.product.nameEn}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ShoppingBag className="h-8 w-8 text-muted-foreground/30" />
                            </div>
                          )}
                        </div>
                        
                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/?view=product&id=${item.product.id}`}
                            onClick={() => onOpenChange(false)}
                            className="font-medium text-foreground hover:text-primary transition-colors line-clamp-1"
                          >
                            {language === 'ar' ? item.product.nameAr : item.product.nameEn}
                          </Link>
                          
                          {variant && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {variant.name}
                              {variant.size && ` - ${variant.size}`}
                              {variant.color && (
                                <span
                                  className="inline-block w-3 h-3 rounded-full ml-1 align-middle border border-border"
                                  style={{ backgroundColor: getProductColorHex(variant) }}
                                />
                              )}
                            </p>
                          )}
                          
                          <div className="flex items-center justify-between mt-2">
                            {/* Quantity Controls */}
                            <div className="flex items-center gap-1">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => handleQuantityChange(item.productId, item.variantId, item.quantity - 1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center text-sm font-medium">
                                {item.quantity}
                              </span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => handleQuantityChange(item.productId, item.variantId, item.quantity + 1)}
                                disabled={variant ? item.quantity >= variant.quantity : item.quantity >= item.product.quantity}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            
                            {/* Price */}
                            <p className="font-semibold text-primary">
                              {formatPrice(price * item.quantity, language, currencySymbol)}
                            </p>
                          </div>
                        </div>
                        
                        {/* Remove Button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                          onClick={() => removeItem(item.productId, item.variantId)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">{t('cart.remove')}</span>
                        </Button>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            </ScrollArea>
            
            {/* Footer */}
            <div className="shrink-0 border-t border-border p-6 space-y-4 bg-background">
              {/* Free Shipping Progress */}
              {!isEmpty && (
                <div className="space-y-2">
                  {hasFreeShipping ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3 text-center"
                    >
                      <motion.div
                        initial={{ y: -10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="flex items-center justify-center gap-2"
                      >
                        <motion.span
                          animate={{ rotate: [0, 10, -10, 0] }}
                          transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                          className="text-2xl"
                        >
                          🎉
                        </motion.span>
                        <span className="font-bold text-green-700">
                          {language === 'ar' ? 'مبروك! لديك شحن مجاني!' : 'Congratulations! You have free shipping!'}
                        </span>
                        <motion.span
                          animate={{ rotate: [0, -10, 10, 0] }}
                          transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                          className="text-2xl"
                        >
                          🎉
                        </motion.span>
                      </motion.div>
                      <p className="text-sm text-green-600 mt-1">
                        {language === 'ar' 
                          ? `طلباتك فوق ${freeShippingThreshold.toLocaleString()} ${currencySymbol} تستمتع بشحن مجاني`
                          : `Orders over ${freeShippingThreshold.toLocaleString()} ${currencySymbol} get free shipping`}
                      </p>
                    </motion.div>
                  ) : (
                    <div className="bg-muted/50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Truck className="h-4 w-4" />
                          {language === 'ar' 
                            ? `أضف ${formatPrice(freeShippingThreshold - subtotal, language, currencySymbol)} للشحن المجاني`
                            : `Add ${formatPrice(freeShippingThreshold - subtotal, language, currencySymbol)} for free shipping`}
                        </div>
                        <span className="text-xs font-medium text-primary">
                          {Math.round(progressPercent)}%
                        </span>
                      </div>
                      <Progress 
                        value={progressPercent} 
                        className="h-2 bg-muted"
                      />
                      <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                        <span>{formatPrice(subtotal, language, currencySymbol)}</span>
                        <span>{freeShippingThreshold.toLocaleString()} {currencySymbol}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Subtotal */}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t('cart.subtotal')}</span>
                <span className="text-xl font-semibold">{formatPrice(subtotal, language, currencySymbol)}</span>
              </div>
              
              <Separator />
              
              {/* Actions */}
              <div className="space-y-2">
                <Button className="w-full" size="lg" asChild>
                  <Link href="/?view=checkout" onClick={() => onOpenChange(false)}>
                    {t('cart.checkout')}
                    <ArrowRight className={cn("h-4 w-4 ms-2", isRTL && "rotate-180")} />
                  </Link>
                </Button>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => onOpenChange(false)}
                    asChild
                  >
                    <Link href="/?view=shop">
                      {t('cart.continueShopping')}
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={clearCart}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
