'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { csrfFetch } from '@/lib/csrf-fetch';
import {
  ShoppingBag,
  CreditCard,
  Truck,
  MapPin,
  Check,
  Loader2,
  Tag,
  AlertCircle,
  Package,
  ShieldCheck,
  Clock,
  X,
  Wallet,
  Landmark,
  PartyPopper,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useCartStore, type Product } from '@/store';
import { useLanguage } from '@/lib/i18n';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Zod schemas for validation
const shippingSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  email: z.string().email('Valid email is required'),
  address: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  postalCode: z.string().min(5, 'Valid postal code is required'),
});

type ShippingFormData = z.infer<typeof shippingSchema>;

interface ShippingZone {
  id: string;
  name: string;
  cost: number;
  freeShippingMin: number;
  estimatedDays: string | null;
}

// Format price
function formatPrice(price: number | undefined | null, currencySymbol: string, language: 'en' | 'ar'): string {
  const safePrice = price ?? 0;
  if (language === 'ar') {
    return `${safePrice.toFixed(2)} ${currencySymbol}`;
  }
  return `${currencySymbol}${safePrice.toFixed(2)}`;
}

interface CheckoutFormProps {
  onSuccess?: () => void;
}

export function CheckoutForm({ onSuccess }: CheckoutFormProps) {
  const { language, isRTL, dir } = useLanguage();
  const { settings } = useSiteSettings();
  const { items, getTotal, clearCart, removeItem } = useCartStore();
  const { toast } = useToast();
  
  // Shipping zones loaded from the admin-managed catalogue
  const [shippingZones, setShippingZones] = React.useState<ShippingZone[]>([]);
  const [zonesLoading, setZonesLoading] = React.useState(true);
  const [zonesError, setZonesError] = React.useState(false);
  const [selectedZoneId, setSelectedZoneId] = React.useState<string>('');
  const [selectedPayment, setSelectedPayment] = React.useState('');
  const [discountCode, setDiscountCode] = React.useState('');
  const [appliedDiscount, setAppliedDiscount] = React.useState<{ type: string; value: number } | null>(null);
  const [isApplyingDiscount, setIsApplyingDiscount] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [discountError, setDiscountError] = React.useState('');
  const [showLoginDialog, setShowLoginDialog] = React.useState(false);
  const [pendingOrderData, setPendingOrderData] = React.useState<ShippingFormData | null>(null);
  const [isValidatingCart, setIsValidatingCart] = React.useState(true);
  
  // Validate cart items on mount
  React.useEffect(() => {
    const validateCartItems = async () => {
      if (items.length === 0) {
        setIsValidatingCart(false);
        return;
      }
      
      try {
        const productIds = items.map(item => item.productId);
        const response = await csrfFetch('/api/products/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productIds }),
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.invalidIds && data.invalidIds.length > 0) {
            // Remove invalid products from cart
            data.invalidIds.forEach((id: string) => {
              const invalidItem = items.find(item => item.productId === id);
              if (invalidItem) {
                removeItem(id, invalidItem.variantId);
              }
            });
            
            toast({
              title: language === 'ar' ? 'تم تحديث السلة' : 'Cart Updated',
              description: language === 'ar' 
                ? 'تم إزالة بعض المنتجات غير المتوفرة من سلتك'
                : 'Some unavailable products were removed from your cart',
              variant: 'default',
            });
          }
        }
      } catch (error) {
        // Handle error silently
      } finally {
        setIsValidatingCart(false);
      }
    };
    
    validateCartItems();
  }, []);

  // Load active shipping zones created by the admin
  const fetchShippingZones = React.useCallback(async () => {
    setZonesLoading(true);
    setZonesError(false);
    try {
      const response = await csrfFetch('/api/shipping-zones');
      if (!response.ok) throw new Error('Failed to load zones');
      const data = await response.json();
      const zones: ShippingZone[] = (data.zones || []).map((z: Record<string, unknown>) => ({
        id: String(z.id),
        name: String(z.name ?? ''),
        cost: Number(z.cost ?? 0),
        freeShippingMin: Number(z.freeShippingMin ?? 0),
        estimatedDays: z.estimatedDays ? String(z.estimatedDays) : null,
      }));
      setShippingZones(zones);
      // Auto-select the first zone so the order total is correct immediately
      setSelectedZoneId((prev) => (prev && zones.some((z) => z.id === prev) ? prev : zones[0]?.id ?? ''));
    } catch {
      setZonesError(true);
    } finally {
      setZonesLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchShippingZones();
  }, [fetchShippingZones]);
  
  // Get settings values
  const freeShippingThreshold = parseFloat(settings.free_shipping_threshold) || 2000;
  const defaultShippingCost = parseFloat(settings.default_shipping_cost) || 50;
  const currencySymbol = settings.currency_symbol || 'ج.م';
  
  // Payment methods settings
  const codEnabled = settings.payment_cod_enabled === 'true';
  const codFee = parseFloat(settings.payment_cod_fee) || 0;
  const fawryEnabled = settings.payment_fawry_enabled === 'true';
  const vodafoneCashEnabled = settings.payment_vodafonecash_enabled === 'true';
  const vodafoneCashNumber = settings.payment_vodafonecash_number || '';
  const paymobEnabled = settings.payment_paymob_enabled === 'true';
  const stripeEnabled = settings.payment_stripe_enabled === 'true';
  
  const subtotal = getTotal();
  const hasFreeShipping = subtotal >= freeShippingThreshold;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const progressPercent = Math.min(100, (subtotal / freeShippingThreshold) * 100);

  // Determine shipping cost from the selected admin zone. Falls back to the
  // legacy default cost only when NO zones are configured, so checkout never breaks.
  const hasZones = shippingZones.length > 0;
  const selectedZone = shippingZones.find((z) => z.id === selectedZoneId) || null;

  // Is the GLOBAL free-shipping threshold reached? (separate feature, shown via
  // the progress bar + the order summary, NOT by hiding the zone's own price)
  const freeShippingActive = freeShippingThreshold > 0 && subtotal >= freeShippingThreshold;

  // The zone's own base price (what the admin set for that zone).
  const zoneBaseCost = (zone: ShippingZone | null): number =>
    zone ? Math.max(0, zone.cost) : 0;

  // Does THIS zone qualify for free shipping right now (global threshold or the
  // zone's own free-shipping minimum)?
  const zoneIsFree = (zone: ShippingZone | null): boolean => {
    if (!zone) return false;
    if (freeShippingActive) return true;
    if (zone.freeShippingMin > 0 && subtotal >= zone.freeShippingMin) return true;
    return zoneBaseCost(zone) === 0;
  };

  // The cost actually charged for a zone after free-shipping rules.
  const zoneEffectiveCost = (zone: ShippingZone | null): number =>
    zoneIsFree(zone) ? 0 : zoneBaseCost(zone);

  const shippingCost = hasZones
    ? zoneEffectiveCost(selectedZone)
    : hasFreeShipping
    ? 0
    : defaultShippingCost;
  const discountAmount = appliedDiscount 
    ? (appliedDiscount.type === 'percentage' 
        ? (subtotal * appliedDiscount.value) / 100 
        : appliedDiscount.value)
    : 0;
  const paymentFee = selectedPayment === 'cod' ? codFee : 0;
  const total = subtotal + shippingCost + paymentFee - discountAmount;
  
  // Payment methods based on settings
  const paymentMethods = [
    {
      id: 'fawry',
      nameEn: 'Fawry Pay',
      nameAr: 'فوري باي',
      icon: Landmark,
      descriptionEn: 'Pay with Fawry - Cards, Wallets, Cash at any Fawry outlet',
      descriptionAr: 'الدفع عبر فوري - بطاقات، محافظ، كاش في أي منفذ فوري',
      enabled: fawryEnabled,
    },
    {
      id: 'paymob',
      nameEn: 'Paymob',
      nameAr: 'باي موب',
      icon: Wallet,
      descriptionEn: 'Pay with Paymob - Cards and Mobile Wallets',
      descriptionAr: 'الدفع عبر باي موب - بطاقات ومحافظ إلكترونية',
      enabled: paymobEnabled,
    },
    {
      id: 'vodafonecash',
      nameEn: 'Vodafone Cash',
      nameAr: 'فودافون كاش',
      icon: Wallet,
      descriptionEn: vodafoneCashNumber ? `Transfer to ${vodafoneCashNumber}` : 'Pay via Vodafone Cash wallet',
      descriptionAr: vodafoneCashNumber ? `تحويل على ${vodafoneCashNumber}` : 'الدفع عبر محفظة فودافون كاش',
      enabled: vodafoneCashEnabled,
    },
    {
      id: 'card',
      nameEn: 'Credit/Debit Card',
      nameAr: 'بطاقة ائتمان/خصم',
      icon: CreditCard,
      descriptionEn: 'Visa, Mastercard, Meeza',
      descriptionAr: 'فيزا، ماستركارد، ميزة',
      enabled: stripeEnabled,
    },
    {
      id: 'cod',
      nameEn: 'Cash on Delivery',
      nameAr: 'الدفع عند الاستلام',
      icon: Package,
      descriptionEn: codFee > 0 ? `Pay when you receive (+${codFee} ${currencySymbol} fee)` : 'Pay when you receive',
      descriptionAr: codFee > 0 ? `ادفع عند الاستلام (+${codFee} ${currencySymbol})` : 'ادفع عند الاستلام',
      enabled: codEnabled,
      fee: codFee,
    },
  ].filter(m => m.enabled);
  
  // Set default payment method when payment methods are loaded
  React.useEffect(() => {
    if (!selectedPayment && paymentMethods.length > 0) {
      setSelectedPayment(paymentMethods[0].id);
    }
  }, [paymentMethods, selectedPayment]);
  
  const form = useForm<ShippingFormData>({
    resolver: zodResolver(shippingSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      postalCode: '',
    },
  });
  
  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) return;
    
    setIsApplyingDiscount(true);
    setDiscountError('');
    
    try {
      const response = await csrfFetch('/api/discounts/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code: discountCode.toUpperCase(),
          subtotal: subtotal 
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.valid && data.discount) {
        setAppliedDiscount({ 
          type: data.discount.type, 
          value: data.discount.value 
        });
        toast({
          title: language === 'ar' ? 'تم تطبيق الخصم' : 'Discount Applied',
          description: language === 'ar' 
            ? `خصم ${data.discount.type === 'percentage' ? data.discount.value + '%' : formatPrice(data.discount.value, currencySymbol, language)}`
            : `${data.discount.type === 'percentage' ? data.discount.value + '%' : formatPrice(data.discount.value, currencySymbol, language)} discount applied`,
        });
      } else {
        setDiscountError(data.error || (language === 'ar' ? 'كود الخصم غير صالح' : 'Invalid discount code'));
        setAppliedDiscount(null);
      }
    } catch (error) {
      // Handle error silently
      setDiscountError(language === 'ar' ? 'خطأ في التحقق من الكود' : 'Error validating code');
    } finally {
      setIsApplyingDiscount(false);
    }
  };
  
  const handlePlaceOrder = async (data: ShippingFormData) => {
    // Require a shipping zone when the store has zones configured.
    if (hasZones && !selectedZone) {
      toast({
        title: language === 'ar' ? 'اختر منطقة الشحن' : 'Select a shipping zone',
        description: language === 'ar'
          ? 'يرجى اختيار منطقة الشحن قبل إتمام الطلب'
          : 'Please choose a shipping zone before placing your order',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Prepare order items
      const orderItems = items.map(item => {
        const variant = item.product.variants.find(v => v.id === item.variantId);
        return {
          productId: item.productId,
          variantId: item.variantId,
          productName: language === 'ar' ? item.product.nameAr : item.product.nameEn,
          variantName: variant?.name || null,
          price: variant?.price ?? item.product.price,
          quantity: item.quantity,
        };
      });
      
      const orderData = {
        items: orderItems,
        shippingAddress: {
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          email: data.email,
          address: data.address,
          city: data.city,
          postalCode: data.postalCode,
        },
        discountCode: appliedDiscount ? discountCode.toUpperCase() : null,
        paymentMethod: selectedPayment,
        shippingZoneId: selectedZone?.id ?? null,
        shippingZoneName: selectedZone?.name ?? null,
        subtotal,
        shipping: shippingCost,
        tax: 0,
        discount: discountAmount,
        total,
      };
      
      const response = await csrfFetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(orderData),
      });
      
      if (response.ok) {
        clearCart();
        onSuccess?.();
      } else {
        const error = await response.json();
        
        // Check if login is required
        if (response.status === 401 && error.requireLogin) {
          setPendingOrderData(data);
          setShowLoginDialog(true);
          return;
        }
        
        // Check if products are unavailable
        if (response.status === 400 && error.missingProducts) {
          toast({
            title: language === 'ar' ? 'منتجات غير متوفرة' : 'Products Unavailable',
            description: language === 'ar' 
              ? 'بعض المنتجات في سلتك لم تعد متوفرة. يرجى تحديث الصفحة والمحاولة مرة أخرى.'
              : 'Some products in your cart are no longer available. Please refresh and try again.',
            variant: 'destructive',
          });
          return;
        }
        
        throw new Error(error.error || 'Failed to place order');
      }
    } catch (error) {
      // Handle error silently
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error instanceof Error ? error.message : (language === 'ar' ? 'فشل في إرسال الطلب' : 'Failed to place order'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-background" dir={dir}>
      {/* Cart Validation Loading */}
      {isValidatingCart && (
        <div className="fixed inset-0 bg-background/80 z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">
              {language === 'ar' ? 'جاري التحقق من السلة...' : 'Validating cart...'}
            </p>
          </div>
        </div>
      )}
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {language === 'ar' ? 'إتمام الشراء' : 'Checkout'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'ar'
              ? 'أكملي طلبك بخطوات بسيطة'
              : 'Complete your order in a few simple steps'}
          </p>
        </div>
        
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Forms */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Address */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="h-5 w-5 text-primary" />
                  {language === 'ar' ? 'عنوان الشحن' : 'Shipping Address'}
                </CardTitle>
                <CardDescription>
                  {language === 'ar'
                    ? 'أدخلي عنوان التوصيل'
                    : 'Enter your delivery address'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {language === 'ar' ? 'الاسم الأول' : 'First Name'}
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder={language === 'ar' ? 'الاسم الأول' : 'First name'}
                                className="rounded-lg"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {language === 'ar' ? 'الاسم الأخير' : 'Last Name'}
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder={language === 'ar' ? 'الاسم الأخير' : 'Last name'}
                                className="rounded-lg"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="email@example.com"
                                className="rounded-lg"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {language === 'ar' ? 'رقم الجوال' : 'Phone Number'}
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="tel"
                                placeholder="+966 5XX XXX XXXX"
                                className="rounded-lg"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {language === 'ar' ? 'العنوان' : 'Street Address'}
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder={language === 'ar' ? 'الشارع، الحي، رقم المبنى' : 'Street, District, Building No.'}
                              className="rounded-lg"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {language === 'ar' ? 'المدينة' : 'City'}
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder={language === 'ar' ? 'المدينة' : 'City'}
                                className="rounded-lg"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="postalCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {language === 'ar' ? 'الرمز البريدي' : 'Postal Code'}
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="12345"
                                className="rounded-lg"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
            
            {/* Shipping Zone Selector */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Truck className="h-5 w-5 text-primary" />
                  {language === 'ar' ? 'منطقة الشحن' : 'Shipping Zone'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Loading state */}
                {zonesLoading ? (
                  <div className="space-y-3" aria-busy="true">
                    {[0, 1].map((i) => (
                      <div
                        key={i}
                        className="h-[72px] rounded-xl border-2 border-gray-100 bg-gray-50 animate-pulse"
                      />
                    ))}
                  </div>
                ) : zonesError ? (
                  /* Error state */
                  <div className="flex flex-col items-center text-center gap-3 py-6">
                    <AlertCircle className="h-8 w-8 text-destructive" />
                    <p className="text-sm text-muted-foreground">
                      {language === 'ar'
                        ? 'تعذّر تحميل مناطق الشحن'
                        : 'Could not load shipping zones'}
                    </p>
                    <Button variant="outline" size="sm" onClick={fetchShippingZones}>
                      {language === 'ar' ? 'إعادة المحاولة' : 'Retry'}
                    </Button>
                  </div>
                ) : !hasZones ? (
                  /* Empty state — checkout still works with standard shipping */
                  <div className="flex items-start gap-3 rounded-xl border-2 border-dashed border-gray-200 p-4 bg-gray-50/60">
                    <Package className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium">
                        {language === 'ar' ? 'الشحن القياسي' : 'Standard Shipping'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {language === 'ar'
                          ? 'لا توجد مناطق شحن محددة حاليًا، سيتم تطبيق الشحن القياسي.'
                          : 'No shipping zones are configured yet, standard shipping applies.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Selectable zone cards */
                  <RadioGroup
                    value={selectedZoneId}
                    onValueChange={setSelectedZoneId}
                    className="space-y-3"
                  >
                    <AnimatePresence initial={false}>
                      {shippingZones.map((zone) => {
                        const isSelected = selectedZoneId === zone.id;
                        const baseCost = zoneBaseCost(zone);
                        const isFree = zoneIsFree(zone);
                        // Free because the admin set the zone cost to 0 (no real price to show)
                        const isAdminFree = baseCost === 0;
                        // Free right now thanks to a threshold, but the zone has a real base price
                        const isFreeByThreshold = isFree && !isAdminFree;
                        return (
                          <motion.label
                            key={zone.id}
                            layout
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.18 }}
                            className={cn(
                              'flex items-center justify-between gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200',
                              isSelected
                                ? 'border-primary bg-primary/10 shadow-sm'
                                : 'border-gray-200 hover:border-primary/50'
                            )}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <RadioGroupItem value={zone.id} />
                              <div className="min-w-0">
                                <p className="font-medium truncate">{zone.name}</p>
                                {zone.estimatedDays && (
                                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5 shrink-0" />
                                    {zone.estimatedDays}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-end shrink-0">
                              {isAdminFree ? (
                                <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                                  {language === 'ar' ? 'مجاني' : 'Free'}
                                </Badge>
                              ) : isFreeByThreshold ? (
                                <>
                                  <span className="text-sm text-muted-foreground line-through">
                                    {formatPrice(baseCost, currencySymbol, language)}
                                  </span>
                                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                                    {language === 'ar' ? 'مجاني' : 'Free'}
                                  </Badge>
                                </>
                              ) : (
                                <span className="font-semibold">
                                  {formatPrice(baseCost, currencySymbol, language)}
                                </span>
                              )}
                            </div>
                          </motion.label>
                        );
                      })}
                    </AnimatePresence>
                  </RadioGroup>
                )}
              </CardContent>
            </Card>
            
            {/* Payment Method */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CreditCard className="h-5 w-5 text-primary" />
                  {language === 'ar' ? 'طريقة الدفع' : 'Payment Method'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={selectedPayment}
                  onValueChange={setSelectedPayment}
                  className="space-y-3"
                >
                  {paymentMethods.map((method) => (
                    <label
                      key={method.id}
                      className={cn(
                        'flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all',
                        selectedPayment === method.id
                          ? 'border-primary bg-primary/10'
                          : 'border-gray-200 hover:border-primary/50'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value={method.id} />
                        <div className="flex items-center gap-2">
                          <method.icon className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">
                              {language === 'ar' ? method.nameAr : method.nameEn}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {language === 'ar' ? method.descriptionAr : method.descriptionEn}
                            </p>
                          </div>
                        </div>
                      </div>
                      {selectedPayment === method.id && (
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </label>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>
            
            {/* Place Order Button - Mobile */}
            <div className="lg:hidden">
              <Button
                onClick={form.handleSubmit(handlePlaceOrder)}
                disabled={isSubmitting || items.length === 0}
                className="w-full h-14 rounded-full text-lg font-semibold bg-primary hover:bg-primary/90"
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    {language === 'ar' ? 'جاري المعالجة...' : 'Processing...'}
                  </>
                ) : (
                  <>
                    <ShoppingBag className="h-5 w-5 mr-2" />
                    {language === 'ar' ? 'تأكيد الطلب' : 'Place Order'}
                  </>
                )}
              </Button>
            </div>
          </div>
          
          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-sm sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                  {language === 'ar' ? 'ملخص الطلب' : 'Order Summary'}
                  <Badge variant="secondary" className="ms-2">
                    {items.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Order Items */}
                <ScrollArea className="h-64">
                  <div className="space-y-3 pe-2">
                    <AnimatePresence mode="popLayout">
                      {items.map((item) => {
                        const variant = item.product.variants.find((v) => v.id === item.variantId);
                        const price = variant?.price ?? item.product.price;
                        const image = item.product.images[0]?.url;
                        
                        return (
                          <motion.div
                            key={`${item.productId}-${item.variantId}`}
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="flex gap-3 p-2 rounded-lg bg-gray-50"
                          >
                            <div className="w-16 h-16 rounded-md overflow-hidden bg-muted shrink-0">
                              {image ? (
                                <img
                                  src={image}
                                  alt={item.product.nameEn}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <ShoppingBag className="h-6 w-6 text-gray-300" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm line-clamp-1">
                                {language === 'ar' ? item.product.nameAr : item.product.nameEn}
                              </p>
                              {variant && (
                                <p className="text-xs text-muted-foreground">
                                  {variant.name}
                                </p>
                              )}
                              <div className="flex justify-between items-center mt-1">
                                <span className="text-xs text-muted-foreground">
                                  x{item.quantity}
                                </span>
                                <span className="font-semibold text-sm">
                                  {formatPrice(price * item.quantity, currencySymbol, language)}
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </ScrollArea>
                
                {/* Free Shipping Progress */}
                <div className="mb-4">
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
                            ? `أضف ${formatPrice(freeShippingThreshold - subtotal, currencySymbol, language)} للشحن المجاني`
                            : `Add ${formatPrice(freeShippingThreshold - subtotal, currencySymbol, language)} for free shipping`}
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
                        <span>{formatPrice(subtotal, currencySymbol, language)}</span>
                        <span>{freeShippingThreshold.toLocaleString()} {currencySymbol}</span>
                      </div>
                    </div>
                  )}
                </div>
                
                <Separator />
                
                {/* Discount Code */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    {language === 'ar' ? 'كود الخصم' : 'Discount Code'}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder={language === 'ar' ? 'أدخلي الكود' : 'Enter code'}
                      value={discountCode}
                      onChange={(e) => {
                        setDiscountCode(e.target.value)
                        setDiscountError('')
                      }}
                      className="rounded-lg"
                      disabled={appliedDiscount !== null}
                    />
                    {appliedDiscount ? (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setAppliedDiscount(null)
                          setDiscountCode('')
                        }}
                        className="shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={handleApplyDiscount}
                        disabled={isApplyingDiscount || !discountCode.trim()}
                        className="shrink-0"
                      >
                        {isApplyingDiscount ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          language === 'ar' ? 'تطبيق' : 'Apply'
                        )}
                      </Button>
                    )}
                  </div>
                  {discountError && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {discountError}
                    </p>
                  )}
                  {appliedDiscount && (
                    <div className="flex items-center gap-2 text-green-600">
                      <Check className="h-4 w-4" />
                      <span className="text-sm">
                        {appliedDiscount.type === 'percentage'
                          ? (language === 'ar' 
                              ? `خصم ${appliedDiscount.value}% مطبق`
                              : `${appliedDiscount.value}% discount applied`)
                          : (language === 'ar'
                              ? `خصم ${formatPrice(appliedDiscount.value, currencySymbol, language)} مطبق`
                              : `${formatPrice(appliedDiscount.value, currencySymbol, language)} discount applied`)}
                      </span>
                    </div>
                  )}
                </div>
                
                <Separator />
                
                {/* Order Totals */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {language === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}
                    </span>
                    <span>{formatPrice(subtotal, currencySymbol, language)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {language === 'ar' ? 'الشحن' : 'Shipping'}
                    </span>
                    <span className={shippingCost === 0 ? 'text-green-600' : ''}>
                      {shippingCost === 0
                        ? (language === 'ar' ? 'مجاني' : 'Free')
                        : formatPrice(shippingCost, currencySymbol, language)}
                    </span>
                  </div>
                  
                  {appliedDiscount && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>
                        {language === 'ar' ? 'الخصم' : 'Discount'}
                      </span>
                      <span>-{formatPrice(discountAmount, currencySymbol, language)}</span>
                    </div>
                  )}
                  
                  <Separator />
                  
                  <div className="flex justify-between font-semibold text-lg">
                    <span>{language === 'ar' ? 'الإجمالي' : 'Total'}</span>
                    <span className="text-primary">{formatPrice(total, currencySymbol, language)}</span>
                  </div>
                </div>
                
                {/* Place Order Button - Desktop */}
                <Button
                  onClick={form.handleSubmit(handlePlaceOrder)}
                  disabled={isSubmitting || items.length === 0}
                  className="w-full h-12 rounded-full font-semibold hidden lg:flex bg-primary hover:bg-primary/90"
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      {language === 'ar' ? 'جاري المعالجة...' : 'Processing...'}
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="h-5 w-5 mr-2" />
                      {language === 'ar' ? 'تأكيد الطلب' : 'Place Order'}
                    </>
                  )}
                </Button>
                
                {/* Security Badges */}
                <div className="flex items-center justify-center gap-4 pt-2">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <ShieldCheck className="h-4 w-4" />
                    {language === 'ar' ? 'آمن' : 'Secure'}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {language === 'ar' ? 'توصيل سريع' : 'Fast Delivery'}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Login Required Dialog */}
      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <AlertCircle className="h-5 w-5" />
              {language === 'ar' ? 'تسجيل الدخول مطلوب' : 'Login Required'}
            </DialogTitle>
            <DialogDescription className="text-center pt-4">
              {language === 'ar' 
                ? 'يجب تسجيل الدخول لإتمام الطلب. سجلي دخولك أو أنشئي حساباً جديداً للمتابعة.'
                : 'You need to login to place an order. Please login or create a new account to continue.'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-4">
            <Button
              onClick={() => {
                setShowLoginDialog(false);
                window.location.href = '/?view=login';
              }}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {language === 'ar' ? 'تسجيل الدخول' : 'Login'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowLoginDialog(false);
                window.location.href = '/?view=login';
              }}
              className="w-full"
            >
              {language === 'ar' ? 'إنشاء حساب جديد' : 'Create New Account'}
            </Button>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShowLoginDialog(false)}
              className="w-full"
            >
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
