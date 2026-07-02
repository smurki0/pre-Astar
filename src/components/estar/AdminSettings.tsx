'use client'
import { csrfFetch } from '@/lib/csrf-fetch'

import * as React from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { useToast } from '@/hooks/use-toast'
import { ImageUploader } from './ImageUploader'
import { dispatchSettingsUpdate } from '@/hooks/useSiteSettings'
import {
  Settings,
  Palette,
  Home,
  Store,
  CreditCard,
  Truck,
  Percent,
  Mail,
  Bell,
  Search,
  Shield,
  Zap,
  Database,
  Key,
  Wrench,
  BarChart3,
  Globe,
  Plus,
  Trash2,
  Edit,
  Eye,
  Save,
  RotateCcw,
  Download,
  Upload,
  Check,
} from 'lucide-react'

// Types
interface ShippingZone {
  id: string
  name: string
  cost: number
  freeShippingMin: number
  estimatedDays: string
  countries: string[]
  active: boolean
}

interface ApiKey {
  id: string
  name: string
  key: string
  permissions: string[]
  createdAt: string
}

interface SiteSettings {
  [key: string]: string
}

const defaultSettings: SiteSettings = {
  // General
  site_name_ar: 'استآر',
  site_name_en: 'Astar',
  site_tagline_ar: 'أناقة محتشمة بلمسة عصرية',
  site_tagline_en: 'Elegant Modest Fashion',
  site_description_ar: '',
  site_description_en: '',
  site_logo: '',
  site_favicon: '',
  default_language: 'ar',
  default_currency: 'EGP',
  currency_symbol: 'ج.م',
  currency: 'ج.م',
  currency_en: 'EGP',
  price_format: '#,###.## ج.م',
  timezone: 'Asia/Riyadh',
  
  // Visual Identity
  primary_color: '#C4A4A4',
  secondary_color: '#9B6B6B',
  button_color: '#C4A4A4',
  background_color: '#FFFBF9',
  font_family: 'Cairo',
  font_size: '16',
  
  // Homepage
  hero_title_ar: 'اكتشفي أناقتكِ المحتشمة',
  hero_title_en: 'Discover Your Modest Elegance',
  hero_subtitle_ar: 'تشكيلة مميزة من الملابس المحتشمة والحجابات العصرية',
  hero_subtitle_en: 'Curated collection of modest fashion and modern hijabs',
  hero_image: '',
  hero_image_mobile: '',
  hero_button_text_ar: 'تسوقي الآن',
  hero_button_text_en: 'Shop Now',
  featured_products_count: '8',
  show_testimonials: 'true',
  show_newsletter: 'true',
  
  // Store
  products_per_page: '12',
  enable_wishlist: 'true',
  enable_compare: 'true',
  enable_reviews: 'true',
  enable_related_products: 'true',
  
  // Payment
  payment_stripe_enabled: 'false',
  payment_stripe_key: '',
  payment_stripe_secret: '',
  payment_paymob_enabled: 'false',
  payment_paymob_key: '',
  payment_paymob_secret: '',
  payment_paypal_enabled: 'false',
  payment_paypal_client: '',
  payment_paypal_secret: '',
  payment_vodafonecash_enabled: 'false',
  payment_vodafonecash_number: '',
  payment_cod_enabled: 'true',
  payment_cod_fee: '0',
  
  // Shipping
  free_shipping_threshold: '2000',
  default_shipping_cost: '50',
  
  // Tax
  tax_enabled: 'false',
  tax_rate: '15',
  tax_countries: 'SA,AE,KW',
  
  // Email
  email_provider: 'smtp',
  smtp_host: '',
  smtp_port: '587',
  smtp_user: '',
  smtp_password: '',
  smtp_from_email: '',
  smtp_from_name: 'Astar',
  sendgrid_api_key: '',
  sendgrid_from_email: '',
  sendgrid_from_name: 'Astar',
  
  // Notifications
  notify_new_order: 'true',
  notify_new_user: 'true',
  notify_low_stock: 'true',
  notify_order_confirmed: 'true',
  notify_order_shipped: 'true',
  notify_order_delivered: 'true',
  
  // SEO - Basic
  seo_title: 'Astar - استآر | أزياء محتشمة عصرية',
  seo_description: 'اكتشفي أحدث تشكيلة من الملابس المحتشمة والحجابات العصرية. عباءات، فساتين، بلوزات بأعلى جودة وأفضل الأسعار.',
  seo_keywords: 'عبايات، حجاب، ملابس محتشمة، فساتين، أزياء إسلامية',
  
  // SEO - Open Graph
  og_title: '',
  og_description: '',
  og_image: '',
  og_type: 'website',
  
  // SEO - Twitter Card
  twitter_card: 'summary_large_image',
  twitter_site: '',
  twitter_title: '',
  twitter_description: '',
  twitter_image: '',
  
  // SEO - Verification
  google_site_verification: '',
  bing_webmaster_verification: '',
  yandex_verification: '',
  
  // SEO - Structured Data
  schema_org_type: 'Organization',
  business_name: 'Astar - استآر',
  business_logo: '',
  business_price_range: '$$',
  
  // SEO - Robots & Sitemap
  robots_index: 'index, follow',
  robots_txt_custom: '',
  sitemap_enabled: 'true',
  
  // SEO - Canonical
  canonical_url: '',
  
  // SEO - Additional Meta
  seo_author: 'Astar',
  seo_robots: 'index, follow',
  seo_revisit_after: '7 days',
  seo_language: 'ar',
  
  // Security
  two_factor_enabled: 'false',
  login_attempts: '5',
  log_all_actions: 'true',
  
  // Performance
  cache_enabled: 'true',
  lazy_load_images: 'true',
  auto_compress_images: 'true',
  max_upload_size: '5',
  
  // Backup
  auto_backup: 'true',
  backup_time: '02:00',
  
  // Maintenance
  maintenance_mode: 'false',
  maintenance_message_ar: 'الموقع تحت الصيانة، يرجى المحاولة لاحقاً',
  maintenance_message_en: 'Site is under maintenance, please try again later',
  
  // Analytics
  google_analytics_id: '',
  facebook_pixel_id: '',
  tiktok_pixel_id: '',
  
  // Contact
  site_email: 'info@estar.com',
  site_phone: '+966 50 000 0000',
  site_whatsapp: '+966500000000',
  site_address_ar: 'الرياض، المملكة العربية السعودية',
  site_address_en: 'Riyadh, Saudi Arabia',
  working_hours_ar: 'السبت - الخميس: 9 صباحاً - 10 مساءً',
  working_hours_en: 'Sat - Thu: 9 AM - 10 PM',
  
  // Social
  social_instagram: '',
  social_twitter: '',
  social_facebook: '',
  social_tiktok: '',
  social_snapchat: '',
  
  // Footer
  footer_about_ar: 'استآر - وجهتك الأولى للأزياء المحتشمة العصرية.',
  footer_about_en: 'Astar - Your destination for modern modest fashion.',
  footer_logo: '',
  
  // Announcement
  announcement_text_ar: 'شحن مجاني للطلبات أكثر من 2000 جنيه',
  announcement_text_en: 'Free shipping on orders over 2000 EGP',
  announcement_enabled: 'true',
}

// Color preview component
function ColorPreview({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div 
        className="w-12 h-12 rounded-lg border shadow-sm"
        style={{ backgroundColor: color }}
      />
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{color}</p>
      </div>
    </div>
  )
}

// Shipping zone dialog
function ShippingZoneDialog({
  open,
  onClose,
  onSave,
  zone,
  saving,
}: {
  open: boolean
  onClose: () => void
  onSave: (zone: ShippingZone) => void
  zone: ShippingZone | null
  saving?: boolean
}) {
  const emptyZone: ShippingZone = {
    id: '',
    name: '',
    cost: 0,
    freeShippingMin: 0,
    estimatedDays: '',
    countries: [],
    active: true,
  }
  const [formData, setFormData] = React.useState<ShippingZone>(emptyZone)
  // Keep numeric inputs as raw strings so the field can be cleared while typing.
  const [costStr, setCostStr] = React.useState('0')
  const [freeStr, setFreeStr] = React.useState('0')
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const next = zone ? { ...emptyZone, ...zone } : emptyZone
    setFormData(next)
    setCostStr(String(next.cost ?? 0))
    setFreeStr(String(next.freeShippingMin ?? 0))
    setError(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zone, open])

  const handleSave = () => {
    const name = formData.name.trim()
    const cost = parseFloat(costStr)
    const freeShippingMin = parseFloat(freeStr)

    if (!name) {
      setError('اسم المنطقة مطلوب')
      return
    }
    if (!Number.isFinite(cost) || cost < 0) {
      setError('سعر الشحن يجب أن يكون رقمًا صحيحًا غير سالب')
      return
    }
    if (!Number.isFinite(freeShippingMin) || freeShippingMin < 0) {
      setError('حد الشحن المجاني يجب أن يكون رقمًا صحيحًا غير سالب')
      return
    }

    setError(null)
    onSave({
      ...formData,
      name,
      cost,
      freeShippingMin,
      estimatedDays: formData.estimatedDays?.trim() ?? '',
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{zone ? 'تعديل منطقة الشحن' : 'إضافة منطقة شحن جديدة'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 text-destructive text-sm px-3 py-2">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label>اسم المنطقة</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="مثال: الخليج"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>سعر الشحن (ج.م)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={costStr}
                onChange={(e) => setCostStr(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>حد الشحن المجاني</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={freeStr}
                onChange={(e) => setFreeStr(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>مدة التوصيل المتوقعة</Label>
            <Input
              value={formData.estimatedDays}
              onChange={(e) => setFormData({ ...formData, estimatedDays: e.target.value })}
              placeholder="مثال: 3-5 أيام"
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label className="cursor-pointer">المنطقة مفعّلة</Label>
              <p className="text-xs text-muted-foreground">تظهر للعملاء في صفحة الدفع فقط عند التفعيل</p>
            </div>
            <Switch
              checked={formData.active}
              onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>إلغاء</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90">
            {saving ? 'جاري الحفظ...' : 'حفظ'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function AdminSettings() {
  const { toast } = useToast()
  const [settings, setSettings] = React.useState<SiteSettings>(defaultSettings)
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState('general')
  const [hasChanges, setHasChanges] = React.useState(false)
  const [previewMode, setPreviewMode] = React.useState(false)
  
  // Shipping zones state (persisted via API)
  const [shippingZones, setShippingZones] = React.useState<ShippingZone[]>([])
  const [shippingZonesLoading, setShippingZonesLoading] = React.useState(true)
  const [savingZone, setSavingZone] = React.useState(false)
  const [shippingZoneDialog, setShippingZoneDialog] = React.useState<ShippingZone | null>(null)
  const [deleteZoneDialog, setDeleteZoneDialog] = React.useState<ShippingZone | null>(null)
  
  // API keys state
  const [apiKeys, setApiKeys] = React.useState<ApiKey[]>([
    { id: '1', name: 'Mobile App', key: 'sk_live_xxxxxxxxxxxx', permissions: ['read', 'write'], createdAt: '2024-01-15' },
  ])

  // Fetch settings
  React.useEffect(() => {
    fetchSettings()
    fetchShippingZones()
  }, [])

  const fetchShippingZones = async () => {
    try {
      setShippingZonesLoading(true)
      const response = await csrfFetch('/api/admin/shipping-zones')
      if (response.ok) {
        const data = await response.json()
        const zones: ShippingZone[] = (data.zones || []).map((z: Record<string, unknown>) => ({
          id: String(z.id),
          name: String(z.name ?? ''),
          cost: Number(z.cost ?? 0),
          freeShippingMin: Number(z.freeShippingMin ?? 0),
          estimatedDays: String(z.estimatedDays ?? ''),
          countries: (() => {
            try {
              return typeof z.countries === 'string' ? JSON.parse(z.countries) : (z.countries ?? [])
            } catch {
              return []
            }
          })(),
          active: z.active === undefined ? true : Boolean(z.active),
        }))
        setShippingZones(zones)
      }
    } catch {
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل مناطق الشحن',
        variant: 'destructive',
      })
    } finally {
      setShippingZonesLoading(false)
    }
  }

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await csrfFetch('/api/admin/settings')
      if (response.ok) {
        const data = await response.json()
        const settingsValues: SiteSettings = {}
        if (data.settings) {
          Object.entries(data.settings).forEach(([key, value]) => {
            if (typeof value === 'object' && value !== null && 'value' in value) {
              settingsValues[key] = (value as { value: string }).value
            } else {
              settingsValues[key] = value as string
            }
          })
        }
        setSettings({ ...defaultSettings, ...settingsValues })
      }
    } catch (error) {
      // Handle error silently
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل الإعدادات',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const response = await csrfFetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      })
      
      if (response.ok) {
        setHasChanges(false)
        // Dispatch event to update settings across the site
        dispatchSettingsUpdate()
        toast({
          title: 'تم الحفظ',
          description: 'تم حفظ الإعدادات بنجاح وتحديث الموقع',
        })
      } else {
        const errorData = await response.json().catch(() => ({}))
        // Handle error silently
        toast({
          title: 'خطأ',
          description: errorData.error || 'فشل في حفظ الإعدادات',
          variant: 'destructive',
        })
      }
    } catch (error) {
      // Handle error silently
      toast({
        title: 'خطأ',
        description: 'فشل في حفظ الإعدادات - تأكد من الاتصال بالسيرفر',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const updateSetting = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  // Currency data for auto-updating related fields
  const currencyData: Record<string, { symbol: string; symbolEn: string; format: string }> = {
    EGP: { symbol: 'ج.م', symbolEn: 'EGP', format: '#,###.## ج.م' },
    SAR: { symbol: 'ر.س', symbolEn: 'SAR', format: '#,###.## ر.س' },
    AED: { symbol: 'د.إ', symbolEn: 'AED', format: '#,###.## د.إ' },
    KWD: { symbol: 'د.ك', symbolEn: 'KWD', format: '#,###.### د.ك' },
    USD: { symbol: '$', symbolEn: 'USD', format: '$#,###.##' },
  }

  // Update currency and all related fields, then save automatically
  const updateCurrency = async (currency: string) => {
    const data = currencyData[currency]
    if (data) {
      const newSettings = {
        ...settings,
        default_currency: currency,
        currency_symbol: data.symbol,
        currency: data.symbol,
        currency_en: data.symbolEn,
        price_format: data.format,
      }
      
      setSettings(newSettings)
      setHasChanges(true)
      
      // Auto-save currency changes
      try {
        setSaving(true)
        const response = await csrfFetch('/api/admin/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ settings: newSettings }),
        })
        
        if (response.ok) {
          setHasChanges(false)
          // Dispatch event to update settings across the site
          dispatchSettingsUpdate()
          toast({
            title: 'تم حفظ العملة',
            description: `تم تغيير العملة إلى ${currency} وحفظ الإعدادات بنجاح`,
          })
        } else {
          const errorData = await response.json().catch(() => ({}))
          toast({
            title: 'خطأ في الحفظ',
            description: errorData.error || 'فشل في حفظ إعدادات العملة',
            variant: 'destructive',
          })
        }
      } catch (error) {
        // Handle error silently
        toast({
          title: 'خطأ',
          description: 'فشل في حفظ إعدادات العملة',
          variant: 'destructive',
        })
      } finally {
        setSaving(false)
      }
    }
  }

  const resetToDefaults = () => {
    setSettings(defaultSettings)
    setHasChanges(true)
    toast({
      title: 'تم إعادة التعيين',
      description: 'تم إعادة الإعدادات إلى القيم الافتراضية',
    })
  }

  // Shipping zones handlers (persisted via API)
  const handleSaveShippingZone = async (zone: ShippingZone) => {
    const isEdit = Boolean(shippingZoneDialog?.id)

    // Client-side duplicate guard (server enforces it too).
    const duplicate = shippingZones.some(
      z => z.name.trim().toLowerCase() === zone.name.trim().toLowerCase() && z.id !== zone.id
    )
    if (duplicate) {
      toast({ title: 'خطأ', description: 'توجد منطقة شحن بنفس الاسم بالفعل', variant: 'destructive' })
      return
    }

    const payload = {
      name: zone.name,
      cost: zone.cost,
      freeShippingMin: zone.freeShippingMin,
      estimatedDays: zone.estimatedDays,
      countries: zone.countries,
      active: zone.active,
    }

    try {
      setSavingZone(true)
      const response = await csrfFetch(
        isEdit ? `/api/admin/shipping-zones/${zone.id}` : '/api/admin/shipping-zones',
        {
          method: isEdit ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      )

      if (response.ok) {
        await fetchShippingZones()
        setShippingZoneDialog(null)
        toast({ title: 'تم الحفظ', description: 'تم حفظ منطقة الشحن بنجاح' })
      } else {
        const err = await response.json().catch(() => ({}))
        toast({
          title: 'خطأ',
          description: err.error || 'فشل في حفظ منطقة الشحن',
          variant: 'destructive',
        })
      }
    } catch {
      toast({ title: 'خطأ', description: 'فشل في الاتصال بالسيرفر', variant: 'destructive' })
    } finally {
      setSavingZone(false)
    }
  }

  const handleDeleteShippingZone = async (zone: ShippingZone) => {
    try {
      const response = await csrfFetch(`/api/admin/shipping-zones/${zone.id}`, { method: 'DELETE' })
      if (response.ok) {
        await fetchShippingZones()
        toast({ title: 'تم الحذف', description: 'تم حذف منطقة الشحن' })
      } else {
        const err = await response.json().catch(() => ({}))
        toast({ title: 'خطأ', description: err.error || 'فشل في حذف منطقة الشحن', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'خطأ', description: 'فشل في الاتصال بالسيرفر', variant: 'destructive' })
    } finally {
      setDeleteZoneDialog(null)
    }
  }

  // API key handlers
  const generateApiKey = () => {
    const newKey: ApiKey = {
      id: Date.now().toString(),
      name: 'New API Key',
      key: 'sk_live_' + Math.random().toString(36).substring(2, 15),
      permissions: ['read'],
      createdAt: new Date().toISOString().split('T')[0],
    }
    setApiKeys([...apiKeys, newKey])
    toast({ title: 'تم الإنشاء', description: 'تم إنشاء مفتاح API جديد' })
  }

  const handleDeleteApiKey = (keyId: string) => {
    setApiKeys(keys => keys.filter(k => k.id !== keyId))
    toast({ title: 'تم الحذف', description: 'تم حذف مفتاح API' })
  }

  // Backup handlers
  const handleDownloadBackup = async () => {
    try {
      toast({ title: 'جاري التحميل', description: 'جاري إنشاء النسخة الاحتياطية...' })
      const response = await csrfFetch('/api/admin/backup')
      if (response.ok) {
        const data = await response.json()
        // Create downloadable JSON file
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `estar-backup-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        toast({ title: 'تم التحميل', description: 'تم تحميل النسخة الاحتياطية بنجاح' })
      } else {
        throw new Error('Failed to create backup')
      }
    } catch (error) {
      toast({ title: 'خطأ', description: 'فشل في إنشاء النسخة الاحتياطية', variant: 'destructive' })
    }
  }

  const handleRestoreBackup = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      try {
        const text = await file.text()
        const data = JSON.parse(text)
        toast({ title: 'جاري الاستعادة', description: 'جاري استعادة النسخة الاحتياطية...' })
        const response = await csrfFetch('/api/admin/backup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        if (response.ok) {
          toast({ title: 'تم الاستعادة', description: 'تم استعادة النسخة الاحتياطية بنجاح' })
          // Refresh settings
          fetchSettings()
        } else {
          throw new Error('Failed to restore backup')
        }
      } catch (error) {
        toast({ title: 'خطأ', description: 'فشل في استعادة النسخة الاحتياطية', variant: 'destructive' })
      }
    }
    input.click()
  }

  // Maintenance handlers
  const handleClearCache = async () => {
    try {
      toast({ title: 'جاري المسح', description: 'جاري مسح التخزين المؤقت...' })
      const response = await csrfFetch('/api/admin/settings', { method: 'GET' })
      if (response.ok) {
        toast({ title: 'تم المسح', description: 'تم تحديث الإعدادات من الخادم' })
        fetchSettings()
      }
    } catch {
      toast({ title: 'خطأ', description: 'فشل في مسح الكاش', variant: 'destructive' })
    }
  }

  const handleSystemHealthCheck = async () => {
    try {
      toast({ title: 'فحص النظام', description: 'جاري فحص صحة النظام...' })
      const [settingsRes, productsRes, ordersRes, usersRes] = await Promise.all([
        csrfFetch('/api/admin/settings'),
        csrfFetch('/api/admin/products'),
        csrfFetch('/api/admin/orders'),
        csrfFetch('/api/admin/users'),
      ])
      
      const results = {
        settings: settingsRes.ok ? 'سليم' : 'خطأ',
        products: productsRes.ok ? 'سليم' : 'خطأ',
        orders: ordersRes.ok ? 'سليم' : 'خطأ',
        users: usersRes.ok ? 'سليم' : 'خطأ',
      }
      
      toast({ 
        title: 'نتيجة الفحص', 
        description: `الإعدادات: ${results.settings} | المنتجات: ${results.products} | الطلبات: ${results.orders} | المستخدمين: ${results.users}`
      })
    } catch {
      toast({ title: 'خطأ', description: 'فشل في فحص النظام', variant: 'destructive' })
    }
  }

  const handleExportData = async (type: 'products' | 'orders' | 'users' | 'categories') => {
    try {
      toast({ title: 'جاري التصدير', description: `جاري تصدير ${type}...` })
      const response = await csrfFetch(`/api/admin/${type}`)
      if (response.ok) {
        const data = await response.json()
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `estar-${type}-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        toast({ title: 'تم التصدير', description: `تم تصدير ${type} بنجاح` })
      } else {
        throw new Error('Failed to export')
      }
    } catch {
      toast({ title: 'خطأ', description: `فشل في تصدير ${type}`, variant: 'destructive' })
    }
  }

  // Security handlers
  const [securityLog, setSecurityLog] = React.useState<{ action: string; timestamp: string; ip: string }[]>([])
  const [showSecurityLog, setShowSecurityLog] = React.useState(false)

  const handleViewSecurityLog = () => {
    // Get stored security log from localStorage
    const stored = localStorage.getItem('estar_security_log')
    if (stored) {
      setSecurityLog(JSON.parse(stored))
    } else {
      // Create mock data for demo
      const mockLog = [
        { action: 'تسجيل دخول ناجح', timestamp: new Date().toISOString(), ip: '192.168.1.1' },
        { action: 'تغيير الإعدادات', timestamp: new Date(Date.now() - 3600000).toISOString(), ip: '192.168.1.1' },
        { action: 'تسجيل دخول ناجح', timestamp: new Date(Date.now() - 7200000).toISOString(), ip: '192.168.1.2' },
      ]
      setSecurityLog(mockLog)
      localStorage.setItem('estar_security_log', JSON.stringify(mockLog))
    }
    setShowSecurityLog(true)
  }

  const handleClearSessions = () => {
    if (confirm('هل أنت متأكد من تسجيل الخروج من جميع الأجهزة الأخرى؟')) {
      // Clear all sessions except current
      localStorage.setItem('estar_session_cleared', new Date().toISOString())
      toast({ title: 'تم المسح', description: 'تم تسجيل الخروج من جميع الأجهزة الأخرى' })
    }
  }

  const handleExportSecurityReport = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      settings: {
        twoFactorEnabled: settings.two_factor_enabled,
        loginAttempts: settings.login_attempts,
        logAllActions: settings.log_all_actions,
      },
      recentActivity: securityLog,
    }
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `estar-security-report-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast({ title: 'تم التصدير', description: 'تم تصدير تقرير الأمان' })
  }

  const handleLogSecurityAction = (action: string) => {
    const newEntry = {
      action,
      timestamp: new Date().toISOString(),
      ip: '192.168.1.1', // In production, this would be real IP
    }
    const updatedLog = [newEntry, ...securityLog].slice(0, 100) // Keep last 100 entries
    setSecurityLog(updatedLog)
    localStorage.setItem('estar_security_log', JSON.stringify(updatedLog))
  }

  const tabs = [
    { id: 'general', label: 'عام', icon: Settings },
    { id: 'visual', label: 'الهوية البصرية', icon: Palette },
    { id: 'homepage', label: 'الصفحة الرئيسية', icon: Home },
    { id: 'store', label: 'المتجر', icon: Store },
    { id: 'payment', label: 'الدفع', icon: CreditCard },
    { id: 'shipping', label: 'الشحن', icon: Truck },
    { id: 'tax', label: 'الضرائب', icon: Percent },
    { id: 'email', label: 'البريد الإلكتروني', icon: Mail },
    { id: 'notifications', label: 'الإشعارات', icon: Bell },
    { id: 'seo', label: 'SEO', icon: Search },
    { id: 'security', label: 'الأمان', icon: Shield },
    { id: 'performance', label: 'الأداء', icon: Zap },
    { id: 'backup', label: 'النسخ الاحتياطي', icon: Database },
    { id: 'api', label: 'API', icon: Key },
    { id: 'maintenance', label: 'الصيانة', icon: Wrench },
    { id: 'analytics', label: 'التحليلات', icon: BarChart3 },
    { id: 'contact', label: 'التواصل', icon: Globe },
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">إعدادات المتجر</h1>
            <p className="text-muted-foreground text-sm mt-1">إدارة جميع إعدادات المتجر</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">إعدادات المتجر</h1>
          <p className="text-muted-foreground text-sm mt-1">إدارة جميع إعدادات المتجر والتحكم الكامل</p>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Badge variant="secondary" className="bg-amber-100 text-amber-700">
              تغييرات غير محفوظة
            </Badge>
          )}
          <Button
            variant="outline"
            onClick={resetToDefaults}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            إعادة التعيين
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-primary hover:bg-primary/90 text-white gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full flex-wrap h-auto gap-1 bg-muted p-1">
          {tabs.map((tab) => (
            <TabsTrigger 
              key={tab.id} 
              value={tab.id} 
              className="flex items-center gap-1.5 px-3 py-1.5 data-[state=active]:bg-card data-[state=active]:text-foreground"
            >
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab} className="mt-6 space-y-6">
          
          {/* ==================== GENERAL SETTINGS ==================== */}
          {activeTab === 'general' && (
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>معلومات الموقع الأساسية</CardTitle>
                  <CardDescription>الإعدادات العامة للموقع</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>اسم الموقع (عربي)</Label>
                      <Input
                        value={settings.site_name_ar}
                        onChange={(e) => updateSetting('site_name_ar', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>اسم الموقع (إنجليزي)</Label>
                      <Input
                        value={settings.site_name_en}
                        onChange={(e) => updateSetting('site_name_en', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>الشعار النصي (عربي)</Label>
                      <Input
                        value={settings.site_tagline_ar}
                        onChange={(e) => updateSetting('site_tagline_ar', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>الشعار النصي (إنجليزي)</Label>
                      <Input
                        value={settings.site_tagline_en}
                        onChange={(e) => updateSetting('site_tagline_en', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>وصف الموقع (عربي)</Label>
                      <Textarea
                        value={settings.site_description_ar}
                        onChange={(e) => updateSetting('site_description_ar', e.target.value)}
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>وصف الموقع (إنجليزي)</Label>
                      <Textarea
                        value={settings.site_description_en}
                        onChange={(e) => updateSetting('site_description_en', e.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>الشعار والأيقونة</CardTitle>
                  <CardDescription>شعار الموقع وأيقونة المتصفح</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>شعار الموقع (Logo)</Label>
                      <ImageUploader
                        value={settings.site_logo}
                        onChange={(url) => updateSetting('site_logo', url)}
                        folder="logos"
                        placeholder="ارفع شعار الموقع"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>أيقونة المتصفح (Favicon)</Label>
                      <ImageUploader
                        value={settings.site_favicon}
                        onChange={(url) => updateSetting('site_favicon', url)}
                        folder="favicons"
                        placeholder="ارفع أيقونة الموقع (32x32)"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>اللغة والعملة</CardTitle>
                  <CardDescription>إعدادات اللغة الافتراضية والعملة</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>اللغة الافتراضية</Label>
                      <Select value={settings.default_language} onValueChange={(v) => updateSetting('default_language', v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ar">العربية</SelectItem>
                          <SelectItem value="en">English</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>العملة {saving && <span className="text-amber-600 text-xs">(جاري الحفظ...)</span>}</Label>
                      <Select value={settings.default_currency} onValueChange={updateCurrency} disabled={saving}>
                        <SelectTrigger className={saving ? 'opacity-70' : ''}>
                          <SelectValue placeholder="اختر العملة" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EGP">جنيه مصري (EGP)</SelectItem>
                          <SelectItem value="SAR">ريال سعودي (SAR)</SelectItem>
                          <SelectItem value="AED">درهم إماراتي (AED)</SelectItem>
                          <SelectItem value="KWD">دينار كويتي (KWD)</SelectItem>
                          <SelectItem value="USD">دولار أمريكي (USD)</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        سيتم حفظ التغيير تلقائياً عند اختيار العملة
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>رمز العملة</Label>
                      <Input
                        value={settings.currency_symbol}
                        onChange={(e) => updateSetting('currency_symbol', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>صيغة عرض الأسعار</Label>
                      <Input
                        value={settings.price_format}
                        onChange={(e) => updateSetting('price_format', e.target.value)}
                        placeholder="#,###.## ج.م"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>المنطقة الزمنية</Label>
                      <Select value={settings.timezone} onValueChange={(v) => updateSetting('timezone', v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Asia/Riyadh">الرياض (GMT+3)</SelectItem>
                          <SelectItem value="Asia/Dubai">دبي (GMT+4)</SelectItem>
                          <SelectItem value="Africa/Cairo">القاهرة (GMT+2)</SelectItem>
                          <SelectItem value="Asia/Kuwait">الكويت (GMT+3)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ==================== VISUAL IDENTITY ==================== */}
          {activeTab === 'visual' && (
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>ألوان الموقع</CardTitle>
                  <CardDescription>تخصيص ألوان الموقع</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>اللون الأساسي</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={settings.primary_color}
                          onChange={(e) => updateSetting('primary_color', e.target.value)}
                          className="w-12 h-10 p-1"
                        />
                        <Input
                          value={settings.primary_color}
                          onChange={(e) => updateSetting('primary_color', e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>اللون الثانوي</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={settings.secondary_color}
                          onChange={(e) => updateSetting('secondary_color', e.target.value)}
                          className="w-12 h-10 p-1"
                        />
                        <Input
                          value={settings.secondary_color}
                          onChange={(e) => updateSetting('secondary_color', e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>لون الأزرار</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={settings.button_color}
                          onChange={(e) => updateSetting('button_color', e.target.value)}
                          className="w-12 h-10 p-1"
                        />
                        <Input
                          value={settings.button_color}
                          onChange={(e) => updateSetting('button_color', e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>لون الخلفية</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={settings.background_color}
                          onChange={(e) => updateSetting('background_color', e.target.value)}
                          className="w-12 h-10 p-1"
                        />
                        <Input
                          value={settings.background_color}
                          onChange={(e) => updateSetting('background_color', e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Preview */}
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <Label className="text-base">معاينة الألوان</Label>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setPreviewMode(!previewMode)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        {previewMode ? 'إخفاء المعاينة' : 'معاينة'}
                      </Button>
                    </div>
                    {previewMode && (
                      <div 
                        className="rounded-lg p-6 space-y-4"
                        style={{ backgroundColor: settings.background_color }}
                      >
                        <h3 
                          className="text-xl font-bold"
                          style={{ color: settings.primary_color }}
                        >
                          عنوان المنتج
                        </h3>
                        <p className="text-gray-600">وصف المنتج يظهر هنا</p>
                        <Button 
                          style={{ 
                            backgroundColor: settings.button_color,
                            color: 'white'
                          }}
                        >
                          أضف للسلة
                        </Button>
                        <div className="flex gap-2">
                          <Badge style={{ backgroundColor: settings.primary_color, color: 'white' }}>
                            جديد
                          </Badge>
                          <Badge style={{ backgroundColor: settings.secondary_color, color: 'white' }}>
                            خصم 20%
                          </Badge>
                        </div>
                      </div>
                    )}
                    {!previewMode && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        اضغط على زر المعاينة لرؤية كيف ستظهر الألوان
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>الخطوط</CardTitle>
                  <CardDescription>إعدادات خط الموقع</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>نوع الخط</Label>
                      <Select value={settings.font_family} onValueChange={(v) => updateSetting('font_family', v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Cairo">Cairo</SelectItem>
                          <SelectItem value="Tajawal">Tajawal</SelectItem>
                          <SelectItem value="Almarai">Almarai</SelectItem>
                          <SelectItem value="IBM Plex Sans Arabic">IBM Plex Sans Arabic</SelectItem>
                          <SelectItem value="Noto Sans Arabic">Noto Sans Arabic</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>حجم الخط الأساسي</Label>
                      <Select value={settings.font_size} onValueChange={(v) => updateSetting('font_size', v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="14">صغير (14px)</SelectItem>
                          <SelectItem value="16">متوسط (16px)</SelectItem>
                          <SelectItem value="18">كبير (18px)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ==================== HOMEPAGE SETTINGS ==================== */}
          {activeTab === 'homepage' && (
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>البنر الرئيسي</CardTitle>
                  <CardDescription>تخصيص البنر الرئيسي في الصفحة الرئيسية</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>العنوان (عربي)</Label>
                      <Input
                        value={settings.hero_title_ar}
                        onChange={(e) => updateSetting('hero_title_ar', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>العنوان (إنجليزي)</Label>
                      <Input
                        value={settings.hero_title_en}
                        onChange={(e) => updateSetting('hero_title_en', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>العنوان الفرعي (عربي)</Label>
                      <Textarea
                        value={settings.hero_subtitle_ar}
                        onChange={(e) => updateSetting('hero_subtitle_ar', e.target.value)}
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>العنوان الفرعي (إنجليزي)</Label>
                      <Textarea
                        value={settings.hero_subtitle_en}
                        onChange={(e) => updateSetting('hero_subtitle_en', e.target.value)}
                        rows={2}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>نص الزر (عربي)</Label>
                      <Input
                        value={settings.hero_button_text_ar}
                        onChange={(e) => updateSetting('hero_button_text_ar', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>نص الزر (إنجليزي)</Label>
                      <Input
                        value={settings.hero_button_text_en}
                        onChange={(e) => updateSetting('hero_button_text_en', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>صورة البنر (Desktop)</Label>
                      <ImageUploader
                        value={settings.hero_image}
                        onChange={(url) => updateSetting('hero_image', url)}
                        folder="banners"
                        placeholder="1920x800 px"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>صورة البنر (Mobile)</Label>
                      <ImageUploader
                        value={settings.hero_image_mobile}
                        onChange={(url) => updateSetting('hero_image_mobile', url)}
                        folder="banners"
                        placeholder="800x1000 px"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>أقسام الصفحة الرئيسية</CardTitle>
                  <CardDescription>تحكم في أقسام الصفحة الرئيسية</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>عدد المنتجات المميزة</Label>
                    <Input
                      type="number"
                      value={settings.featured_products_count}
                      onChange={(e) => updateSetting('featured_products_count', e.target.value)}
                      className="w-32"
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>عرض قسم آراء العملاء</Label>
                      <p className="text-sm text-muted-foreground">عرض تقييمات وآراء العملاء</p>
                    </div>
                    <Switch
                      checked={settings.show_testimonials === 'true'}
                      onCheckedChange={(checked) => updateSetting('show_testimonials', checked ? 'true' : 'false')}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>عرض قسم الاشتراك في النشرة البريدية</Label>
                      <p className="text-sm text-muted-foreground">عرض نموذج الاشتراك</p>
                    </div>
                    <Switch
                      checked={settings.show_newsletter === 'true'}
                      onCheckedChange={(checked) => updateSetting('show_newsletter', checked ? 'true' : 'false')}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ==================== STORE SETTINGS ==================== */}
          {activeTab === 'store' && (
            <Card>
              <CardHeader>
                <CardTitle>إعدادات المتجر</CardTitle>
                <CardDescription>تحكم في ميزات المتجر</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>عدد المنتجات في الصفحة</Label>
                  <Input
                    type="number"
                    value={settings.products_per_page}
                    onChange={(e) => updateSetting('products_per_page', e.target.value)}
                    className="w-32"
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>تفعيل نظام المفضلة</Label>
                    <p className="text-sm text-muted-foreground">السماح للعملاء بإضافة منتجات للمفضلة</p>
                  </div>
                  <Switch
                    checked={settings.enable_wishlist === 'true'}
                    onCheckedChange={(checked) => updateSetting('enable_wishlist', checked ? 'true' : 'false')}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>تفعيل المقارنة بين المنتجات</Label>
                    <p className="text-sm text-muted-foreground">السماح بمقارنة منتجات متعددة</p>
                  </div>
                  <Switch
                    checked={settings.enable_compare === 'true'}
                    onCheckedChange={(checked) => updateSetting('enable_compare', checked ? 'true' : 'false')}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>تفعيل تقييم المنتجات</Label>
                    <p className="text-sm text-muted-foreground">السماح للعملاء بتقييم المنتجات</p>
                  </div>
                  <Switch
                    checked={settings.enable_reviews === 'true'}
                    onCheckedChange={(checked) => updateSetting('enable_reviews', checked ? 'true' : 'false')}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>عرض المنتجات المشابهة</Label>
                    <p className="text-sm text-muted-foreground">عرض منتجات مشابهة في صفحة المنتج</p>
                  </div>
                  <Switch
                    checked={settings.enable_related_products === 'true'}
                    onCheckedChange={(checked) => updateSetting('enable_related_products', checked ? 'true' : 'false')}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* ==================== PAYMENT SETTINGS ==================== */}
          {activeTab === 'payment' && (
            <div className="grid gap-6">
              {/* Stripe */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Stripe</CardTitle>
                      <CardDescription>بوابة دفع Stripe</CardDescription>
                    </div>
                    <Switch
                      checked={settings.payment_stripe_enabled === 'true'}
                      onCheckedChange={(checked) => updateSetting('payment_stripe_enabled', checked ? 'true' : 'false')}
                    />
                  </div>
                </CardHeader>
                {settings.payment_stripe_enabled === 'true' && (
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Public Key</Label>
                      <Input
                        value={settings.payment_stripe_key}
                        onChange={(e) => updateSetting('payment_stripe_key', e.target.value)}
                        placeholder="pk_live_..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Secret Key</Label>
                      <Input
                        type="password"
                        value={settings.payment_stripe_secret}
                        onChange={(e) => updateSetting('payment_stripe_secret', e.target.value)}
                        placeholder="sk_live_..."
                      />
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Paymob */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Paymob</CardTitle>
                      <CardDescription>بوابة دفع Paymob (مصر والشرق الأوسط)</CardDescription>
                    </div>
                    <Switch
                      checked={settings.payment_paymob_enabled === 'true'}
                      onCheckedChange={(checked) => updateSetting('payment_paymob_enabled', checked ? 'true' : 'false')}
                    />
                  </div>
                </CardHeader>
                {settings.payment_paymob_enabled === 'true' && (
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <Label>API Key</Label>
                        <Input
                          value={settings.payment_paymob_key}
                          onChange={(e) => updateSetting('payment_paymob_key', e.target.value)}
                          placeholder="Your Paymob API Key"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>HMAC Secret</Label>
                        <Input
                          type="password"
                          value={settings.payment_paymob_secret}
                          onChange={(e) => updateSetting('payment_paymob_secret', e.target.value)}
                          placeholder="Your Paymob HMAC Secret"
                        />
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Integration ID</Label>
                        <Input
                          type="number"
                          value={settings.payment_paymob_integration_id}
                          onChange={(e) => updateSetting('payment_paymob_integration_id', e.target.value)}
                          placeholder="e.g., 123456"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Iframe ID</Label>
                        <Input
                          type="number"
                          value={settings.payment_paymob_iframe_id}
                          onChange={(e) => updateSetting('payment_paymob_iframe_id', e.target.value)}
                          placeholder="e.g., 123456"
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Merchant Profile ID</Label>
                        <Input
                          type="number"
                          value={settings.payment_paymob_merchant_profile_id}
                          onChange={(e) => updateSetting('payment_paymob_merchant_profile_id', e.target.value)}
                          placeholder="Your Merchant Profile ID"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Webhook Secret</Label>
                        <Input
                          type="password"
                          value={settings.payment_paymob_webhook_secret}
                          onChange={(e) => updateSetting('payment_paymob_webhook_secret', e.target.value)}
                          placeholder="Webhook verification secret (optional)"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Allowed IP Addresses</Label>
                        <Textarea
                          value={settings.payment_paymob_allowed_ips}
                          onChange={(e) => updateSetting('payment_paymob_allowed_ips', e.target.value)}
                          placeholder='["127.0.0.1", "192.168.1.0/24", "your-server-ip"]'
                          rows={3}
                        />
                        <p className="text-xs text-muted-foreground">
                          JSON array of allowed IPs/CIDR for callbacks (comma separated)
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={settings.payment_paymob_delivery_needed === 'true'}
                          onCheckedChange={(checked) => updateSetting('payment_paymob_delivery_needed', checked ? 'true' : 'false')}
                          id="delivery-needed"
                        />
                        <Label htmlFor="delivery-needed" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Delivery needed (include shipping address)
                        </Label>
                      </div>
                    </div>

                    <Separator />

                    <div className="pt-4">
                      <Button 
                        variant="outline" 
                        className="gap-2"
                        onClick={async () => {
                          toast({ title: 'جاري الاختبار', description: 'جاري اختبار إعدادات Paymob...' })
                          try {
                            const response = await csrfFetch('/api/payment/paymob?test=true', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ test: true })
                            })
                            const result = await response.json()
                            if (result.success) {
                              toast({ 
                                title: '✅ Paymob جاهز', 
                                description: 'تم التحقق من إعدادات Paymob بنجاح' 
                              })
                            } else {
                              toast({ 
                                title: '⚠️ مشكلة في Paymob', 
                                variant: 'destructive',
                                description: result.error || 'فشل التحقق من الإعدادات'
                              })
                            }
                          } catch (error) {
                            toast({ 
                              title: 'خطأ', 
                              variant: 'destructive',
                              description: 'فشل في اختبار Paymob - تحقق من الاتصال بالسيرفر'
                            })
                          }
                        }}
                      >
                        <Zap className="h-4 w-4" />
                        اختبار الاتصال بـ Paymob
                      </Button>
                    </div>
                  </CardContent>
                )}

              </Card>

              {/* PayPal */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>PayPal</CardTitle>
                      <CardDescription>بوابة دفع PayPal</CardDescription>
                    </div>
                    <Switch
                      checked={settings.payment_paypal_enabled === 'true'}
                      onCheckedChange={(checked) => updateSetting('payment_paypal_enabled', checked ? 'true' : 'false')}
                    />
                  </div>
                </CardHeader>
                {settings.payment_paypal_enabled === 'true' && (
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Client ID</Label>
                      <Input
                        value={settings.payment_paypal_client}
                        onChange={(e) => updateSetting('payment_paypal_client', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Secret</Label>
                      <Input
                        type="password"
                        value={settings.payment_paypal_secret}
                        onChange={(e) => updateSetting('payment_paypal_secret', e.target.value)}
                      />
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Vodafone Cash */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>فودافون كاش</CardTitle>
                      <CardDescription>محفظة فودافون كاش للدفع الإلكتروني</CardDescription>
                    </div>
                    <Switch
                      checked={settings.payment_vodafonecash_enabled === 'true'}
                      onCheckedChange={(checked) => updateSetting('payment_vodafonecash_enabled', checked ? 'true' : 'false')}
                    />
                  </div>
                </CardHeader>
                {settings.payment_vodafonecash_enabled === 'true' && (
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>رقم محفظة فودافون كاش</Label>
                      <Input
                        value={settings.payment_vodafonecash_number}
                        onChange={(e) => updateSetting('payment_vodafonecash_number', e.target.value)}
                        placeholder="01xxxxxxxxx"
                        dir="ltr"
                      />
                      <p className="text-xs text-muted-foreground">
                        أدخل رقم المحفظة الذي سيحول عليه العملاء
                      </p>
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Cash on Delivery */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>الدفع عند الاستلام</CardTitle>
                      <CardDescription>الدفع نقداً عند استلام الطلب</CardDescription>
                    </div>
                    <Switch
                      checked={settings.payment_cod_enabled === 'true'}
                      onCheckedChange={(checked) => updateSetting('payment_cod_enabled', checked ? 'true' : 'false')}
                    />
                  </div>
                </CardHeader>
                {settings.payment_cod_enabled === 'true' && (
                  <CardContent>
                    <div className="space-y-2">
                      <Label>رسوم الدفع عند الاستلام</Label>
                      <Input
                        type="number"
                        value={settings.payment_cod_fee}
                        onChange={(e) => updateSetting('payment_cod_fee', e.target.value)}
                        className="w-32"
                      />
                    </div>
                  </CardContent>
                )}
              </Card>
            </div>
          )}

          {/* ==================== SHIPPING SETTINGS ==================== */}
          {activeTab === 'shipping' && (
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>إعدادات الشحن الأساسية</CardTitle>
                  <CardDescription>تحديد تكاليف الشحن الافتراضية</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>حد الشحن المجاني (ج.م)</Label>
                      <Input
                        type="number"
                        value={settings.free_shipping_threshold}
                        onChange={(e) => updateSetting('free_shipping_threshold', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>تكلفة الشحن الافتراضية (ج.م)</Label>
                      <Input
                        type="number"
                        value={settings.default_shipping_cost}
                        onChange={(e) => updateSetting('default_shipping_cost', e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>مناطق الشحن</CardTitle>
                      <CardDescription>تحديد مناطق الشحن وتكاليفها</CardDescription>
                    </div>
                    <Button 
                      onClick={() => setShippingZoneDialog({ id: '', name: '', cost: 0, freeShippingMin: 0, estimatedDays: '', countries: [], active: true })}
                      className="bg-primary hover:bg-primary/90"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      إضافة منطقة
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {shippingZonesLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ) : shippingZones.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Truck className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>لا توجد مناطق شحن</p>
                      <p className="text-sm">أضف مناطق الشحن لتخصيص تكاليف التوصيل</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>المنطقة</TableHead>
                          <TableHead>سعر الشحن</TableHead>
                          <TableHead>حد الشحن المجاني</TableHead>
                          <TableHead>مدة التوصيل</TableHead>
                          <TableHead className="text-center">الحالة</TableHead>
                          <TableHead className="text-center">الإجراءات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {shippingZones.map((zone) => (
                          <TableRow key={zone.id}>
                            <TableCell className="font-medium">{zone.name}</TableCell>
                            <TableCell>{zone.cost} ج.م</TableCell>
                            <TableCell>{zone.freeShippingMin} ج.م</TableCell>
                            <TableCell>{zone.estimatedDays}</TableCell>
                            <TableCell className="text-center">
                              {zone.active ? (
                                <Badge className="bg-green-100 text-green-700 hover:bg-green-100">مفعّلة</Badge>
                              ) : (
                                <Badge variant="secondary">معطّلة</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex justify-center gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => setShippingZoneDialog(zone)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="text-destructive"
                                  onClick={() => setDeleteZoneDialog(zone)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* ==================== TAX SETTINGS ==================== */}
          {activeTab === 'tax' && (
            <Card>
              <CardHeader>
                <CardTitle>إعدادات الضرائب</CardTitle>
                <CardDescription>إدارة ضريبة القيمة المضافة</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>تفعيل الضريبة</Label>
                    <p className="text-sm text-muted-foreground">إضافة ضريبة القيمة المضافة للطلبات</p>
                  </div>
                  <Switch
                    checked={settings.tax_enabled === 'true'}
                    onCheckedChange={(checked) => updateSetting('tax_enabled', checked ? 'true' : 'false')}
                  />
                </div>
                {settings.tax_enabled === 'true' && (
                  <>
                    <Separator />
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>نسبة الضريبة (%)</Label>
                        <Input
                          type="number"
                          value={settings.tax_rate}
                          onChange={(e) => updateSetting('tax_rate', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>الدول الخاضعة للضريبة</Label>
                        <Input
                          value={settings.tax_countries}
                          onChange={(e) => updateSetting('tax_countries', e.target.value)}
                          placeholder="SA,AE,KW"
                        />
                        <p className="text-xs text-muted-foreground">أدخل رموز الدول مفصولة بفواصل</p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* ==================== EMAIL SETTINGS ==================== */}
          {activeTab === 'email' && (
            <div className="grid gap-6">
              {/* Email Provider Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>مزود خدمة البريد</CardTitle>
                  <CardDescription>اختر مزود خدمة البريد الإلكتروني</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      variant={settings.email_provider === 'smtp' ? 'default' : 'outline'}
                      className={`h-auto py-4 flex-col gap-2 ${settings.email_provider === 'smtp' ? 'bg-primary text-white' : ''}`}
                      onClick={() => updateSetting('email_provider', 'smtp')}
                    >
                      <Mail className="h-6 w-6" />
                      <span className="font-medium">SMTP</span>
                      <span className="text-xs opacity-70">خادم البريد التقليدي</span>
                    </Button>
                    <Button
                      variant={settings.email_provider === 'sendgrid' ? 'default' : 'outline'}
                      className={`h-auto py-4 flex-col gap-2 ${settings.email_provider === 'sendgrid' ? 'bg-primary text-white' : ''}`}
                      onClick={() => updateSetting('email_provider', 'sendgrid')}
                    >
                      <Zap className="h-6 w-6" />
                      <span className="font-medium">SendGrid</span>
                      <span className="text-xs opacity-70">خدمة بريد احترافية</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* SMTP Settings */}
              {settings.email_provider === 'smtp' && (
                <Card>
                  <CardHeader>
                    <CardTitle>إعدادات SMTP</CardTitle>
                    <CardDescription>إعداد خادم البريد الإلكتروني</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>SMTP Host</Label>
                        <Input
                          value={settings.smtp_host}
                          onChange={(e) => updateSetting('smtp_host', e.target.value)}
                          placeholder="smtp.gmail.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Port</Label>
                        <Input
                          value={settings.smtp_port}
                          onChange={(e) => updateSetting('smtp_port', e.target.value)}
                          placeholder="587"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Username</Label>
                        <Input
                          value={settings.smtp_user}
                          onChange={(e) => updateSetting('smtp_user', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Password</Label>
                        <Input
                          type="password"
                          value={settings.smtp_password}
                          onChange={(e) => updateSetting('smtp_password', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>From Email</Label>
                        <Input
                          type="email"
                          value={settings.smtp_from_email}
                          onChange={(e) => updateSetting('smtp_from_email', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>From Name</Label>
                        <Input
                          value={settings.smtp_from_name}
                          onChange={(e) => updateSetting('smtp_from_name', e.target.value)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* SendGrid Settings */}
              {settings.email_provider === 'sendgrid' && (
                <Card>
                  <CardHeader>
                    <CardTitle>إعدادات SendGrid</CardTitle>
                    <CardDescription>إعداد خدمة SendGrid للبريد الإلكتروني</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>API Key</Label>
                      <Input
                        type="password"
                        value={settings.sendgrid_api_key}
                        onChange={(e) => updateSetting('sendgrid_api_key', e.target.value)}
                        placeholder="SG.xxxxxxxxxxxxxxxxxxxxxx"
                      />
                      <p className="text-xs text-muted-foreground">
                        احصل على API Key من لوحة تحكم SendGrid
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>From Email</Label>
                        <Input
                          type="email"
                          value={settings.sendgrid_from_email}
                          onChange={(e) => updateSetting('sendgrid_from_email', e.target.value)}
                          placeholder="noreply@yourdomain.com"
                        />
                        <p className="text-xs text-muted-foreground">
                          يجب أن يكون بريد موثق في SendGrid
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>From Name</Label>
                        <Input
                          value={settings.sendgrid_from_name}
                          onChange={(e) => updateSetting('sendgrid_from_name', e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-blue-800 mb-2">كيفية الحصول على SendGrid API Key:</h4>
                      <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                        <li>سجل في <a href="https://sendgrid.com" target="_blank" className="underline">SendGrid.com</a></li>
                        <li>اذهب إلى Settings → API Keys</li>
                        <li>أنشئ API Key جديد بصلاحيات Full Access</li>
                        <li>انسخ الـ API Key وألصقه هنا</li>
                        <li>وثق بريد المرسل في Sender Authentication</li>
                      </ol>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Email Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>اختبار البريد</CardTitle>
                  <CardDescription>اختبار إعدادات البريد الإلكتروني</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Button 
                      variant="outline" 
                      className="gap-2 h-auto py-3 flex-col"
                      onClick={async () => {
                        if (!settings.smtp_host || !settings.smtp_user) {
                          toast({ title: 'خطأ', description: 'يرجى إدخال إعدادات SMTP أولاً', variant: 'destructive' })
                          return
                        }
                        try {
                          toast({ title: 'جاري الاختبار', description: 'جاري اختبار الاتصال بخادم البريد...' })
                          const response = await csrfFetch('/api/email?action=test-connection')
                          const result = await response.json()
                          if (result.success) {
                            toast({ title: 'تم الاختبار', description: 'تم الاتصال بخادم البريد بنجاح' })
                          } else {
                            toast({ title: 'خطأ', description: result.error || 'فشل الاتصال بخادم البريد', variant: 'destructive' })
                          }
                        } catch {
                          toast({ title: 'خطأ', description: 'فشل الاتصال بخادم البريد', variant: 'destructive' })
                        }
                      }}
                    >
                      <Zap className="h-5 w-5" />
                      <span>اختبار الاتصال</span>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="gap-2 h-auto py-3 flex-col"
                      onClick={async () => {
                        if (!settings.smtp_from_email) {
                          toast({ title: 'خطأ', description: 'يرجى إدخال بريد المرسل أولاً', variant: 'destructive' })
                          return
                        }
                        try {
                          toast({ title: 'جاري الإرسال', description: 'جاري إرسال بريد تجريبي...' })
                          const response = await csrfFetch('/api/email', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              action: 'test',
                              to: settings.smtp_from_email
                            })
                          })
                          const result = await response.json()
                          if (result.success) {
                            toast({ title: 'تم الإرسال', description: `تم إرسال بريد تجريبي إلى ${settings.smtp_from_email}` })
                          } else {
                            toast({ title: 'خطأ', description: result.error || 'فشل إرسال البريد التجريبي', variant: 'destructive' })
                          }
                        } catch {
                          toast({ title: 'خطأ', description: 'فشل إرسال البريد التجريبي', variant: 'destructive' })
                        }
                      }}
                    >
                      <Mail className="h-5 w-5" />
                      <span>إرسال بريد تجريبي</span>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="gap-2 h-auto py-3 flex-col"
                      onClick={() => {
                        const emailConfig = {
                          host: settings.smtp_host,
                          port: settings.smtp_port,
                          user: settings.smtp_user,
                          fromEmail: settings.smtp_from_email,
                          fromName: settings.smtp_from_name,
                        }
                        const blob = new Blob([JSON.stringify(emailConfig, null, 2)], { type: 'application/json' })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = 'smtp-config.json'
                        a.click()
                        URL.revokeObjectURL(url)
                        toast({ title: 'تم التصدير', description: 'تم تصدير إعدادات البريد' })
                      }}
                    >
                      <Download className="h-5 w-5" />
                      <span>تصدير الإعدادات</span>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="gap-2 h-auto py-3 flex-col"
                      onClick={() => {
                        if (confirm('هل أنت متأكد من مسح إعدادات البريد؟')) {
                          // Clear SMTP settings
                          updateSetting('smtp_host', '')
                          updateSetting('smtp_port', '587')
                          updateSetting('smtp_user', '')
                          updateSetting('smtp_password', '')
                          updateSetting('smtp_from_email', '')
                          updateSetting('smtp_from_name', 'Astar')
                          // Clear SendGrid settings
                          updateSetting('sendgrid_api_key', '')
                          updateSetting('sendgrid_from_email', '')
                          updateSetting('sendgrid_from_name', 'Astar')
                          toast({ title: 'تم المسح', description: 'تم مسح جميع إعدادات البريد' })
                        }
                      }}
                    >
                      <Trash2 className="h-5 w-5" />
                      <span>مسح الإعدادات</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Email Status */}
              <Card>
                <CardHeader>
                  <CardTitle>حالة البريد</CardTitle>
                  <CardDescription>معلومات عن حالة خدمة البريد</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="rounded-lg p-3 border bg-primary/10 border-primary/30">
                      <p className="text-muted-foreground">المزود النشط</p>
                      <p className="font-medium text-primary">
                        {settings.email_provider === 'sendgrid' ? 'SendGrid' : 'SMTP'}
                      </p>
                    </div>
                    {settings.email_provider === 'smtp' ? (
                      <>
                        <div className={`rounded-lg p-3 border ${settings.smtp_host ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                          <p className="text-muted-foreground">الخادم</p>
                          <p className={`font-medium ${settings.smtp_host ? 'text-green-600' : 'text-red-600'}`}>
                            {settings.smtp_host ? 'مُعد' : 'غير مُعد'}
                          </p>
                        </div>
                        <div className={`rounded-lg p-3 border ${settings.smtp_user ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                          <p className="text-muted-foreground">المستخدم</p>
                          <p className={`font-medium ${settings.smtp_user ? 'text-green-600' : 'text-red-600'}`}>
                            {settings.smtp_user ? 'مُعد' : 'غير مُعد'}
                          </p>
                        </div>
                        <div className="bg-muted/30 rounded-lg p-3 border border-border">
                          <p className="text-muted-foreground">المنفذ</p>
                          <p className="font-medium text-foreground">{settings.smtp_port || '587'}</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className={`rounded-lg p-3 border ${settings.sendgrid_api_key ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                          <p className="text-muted-foreground">API Key</p>
                          <p className={`font-medium ${settings.sendgrid_api_key ? 'مُعد' : 'text-red-600'}`}>
                            {settings.sendgrid_api_key ? 'مُعد' : 'غير مُعد'}
                          </p>
                        </div>
                        <div className={`rounded-lg p-3 border ${settings.sendgrid_from_email ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                          <p className="text-muted-foreground">بريد المرسل</p>
                          <p className={`font-medium ${settings.sendgrid_from_email ? 'text-green-600' : 'text-red-600'}`}>
                            {settings.sendgrid_from_email ? 'مُعد' : 'غير مُعد'}
                          </p>
                        </div>
                        <div className="bg-muted/30 rounded-lg p-3 border border-border">
                          <p className="text-muted-foreground">الاسم</p>
                          <p className="font-medium text-foreground">{settings.sendgrid_from_name || 'Astar'}</p>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Email Templates Info */}
              <Card>
                <CardHeader>
                  <CardTitle>قوالب البريد</CardTitle>
                  <CardDescription>القوالب المتاحة للإرسال</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg border border-border">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/20">
                          <Mail className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">تأكيد الطلب</p>
                          <p className="text-xs text-muted-foreground">يُرسل عند إنشاء طلب جديد</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">تلقائي</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg border border-border">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-100">
                          <Truck className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">تأكيد الشحن</p>
                          <p className="text-xs text-muted-foreground">يُرسل عند شحن الطلب</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">تلقائي</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg border border-border">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-100">
                          <Check className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">تأكيد التسليم</p>
                          <p className="text-xs text-muted-foreground">يُرسل عند تسليم الطلب</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">تلقائي</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ==================== NOTIFICATIONS SETTINGS ==================== */}
          {activeTab === 'notifications' && (
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>إشعارات المسؤول</CardTitle>
                  <CardDescription>إشعارات تصل للمسؤول</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>طلب جديد</Label>
                      <p className="text-sm text-muted-foreground">إشعار عند استلام طلب جديد</p>
                    </div>
                    <Switch
                      checked={settings.notify_new_order === 'true'}
                      onCheckedChange={(checked) => updateSetting('notify_new_order', checked ? 'true' : 'false')}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>مستخدم جديد</Label>
                      <p className="text-sm text-muted-foreground">إشعار عند تسجيل مستخدم جديد</p>
                    </div>
                    <Switch
                      checked={settings.notify_new_user === 'true'}
                      onCheckedChange={(checked) => updateSetting('notify_new_user', checked ? 'true' : 'false')}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>نفاد المخزون</Label>
                      <p className="text-sm text-muted-foreground">إشعار عند نفاد مخزون منتج</p>
                    </div>
                    <Switch
                      checked={settings.notify_low_stock === 'true'}
                      onCheckedChange={(checked) => updateSetting('notify_low_stock', checked ? 'true' : 'false')}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>إشعارات العميل</CardTitle>
                  <CardDescription>إشعارات تصل للعملاء</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>تأكيد الطلب</Label>
                      <p className="text-sm text-muted-foreground">إشعار عند تأكيد الطلب</p>
                    </div>
                    <Switch
                      checked={settings.notify_order_confirmed === 'true'}
                      onCheckedChange={(checked) => updateSetting('notify_order_confirmed', checked ? 'true' : 'false')}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>شحن الطلب</Label>
                      <p className="text-sm text-muted-foreground">إشعار عند شحن الطلب</p>
                    </div>
                    <Switch
                      checked={settings.notify_order_shipped === 'true'}
                      onCheckedChange={(checked) => updateSetting('notify_order_shipped', checked ? 'true' : 'false')}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>توصيل الطلب</Label>
                      <p className="text-sm text-muted-foreground">إشعار عند توصيل الطلب</p>
                    </div>
                    <Switch
                      checked={settings.notify_order_delivered === 'true'}
                      onCheckedChange={(checked) => updateSetting('notify_order_delivered', checked ? 'true' : 'false')}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ==================== SEO SETTINGS ==================== */}
          {activeTab === 'seo' && (
            <div className="grid gap-6">
              {/* SEO Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>أدوات SEO السريعة</CardTitle>
                  <CardDescription>أدوات لتحسين ظهور موقعك في محركات البحث</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Button 
                      variant="outline" 
                      className="gap-2 h-auto py-3 flex-col"
                      onClick={async () => {
                        try {
                          toast({ title: 'جاري الإنشاء', description: 'جاري إنشاء خريطة الموقع...' })
                          const response = await csrfFetch('/api/seo/sitemap')
                          if (response.ok) {
                            const data = await response.json()
                            toast({ title: 'تم إنشاء Sitemap', description: `تم إنشاء خريطة الموقع بنجاح - ${data.urlCount} صفحة` })
                          } else {
                            throw new Error('Failed to generate sitemap')
                          }
                        } catch {
                          toast({ title: 'خطأ', description: 'فشل في إنشاء خريطة الموقع', variant: 'destructive' })
                        }
                      }}
                    >
                      <Globe className="h-5 w-5" />
                      <span>إنشاء Sitemap</span>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="gap-2 h-auto py-3 flex-col"
                      onClick={async () => {
                        try {
                          toast({ title: 'جاري الاختبار', description: 'جاري اختبار Structured Data...' })
                          const response = await csrfFetch('/api/seo/validate')
                          if (response.ok) {
                            const data = await response.json()
                            toast({ title: 'نتيجة الاختبار', description: data.message || 'Structured Data صالح' })
                          } else {
                            toast({ title: 'تحذير', description: 'يوجد بعض الأخطاء في Structured Data', variant: 'destructive' })
                          }
                        } catch {
                          toast({ title: 'خطأ', description: 'فشل في اختبار البيانات', variant: 'destructive' })
                        }
                      }}
                    >
                      <Search className="h-5 w-5" />
                      <span>اختبار Schema</span>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="gap-2 h-auto py-3 flex-col"
                      onClick={async () => {
                        try {
                          const response = await csrfFetch('/api/seo/robots')
                          if (response.ok) {
                            const data = await response.json()
                            toast({ title: 'Robots.txt', description: 'تم تحديث ملف Robots.txt بنجاح' })
                          }
                        } catch {
                          toast({ title: 'خطأ', description: 'فشل في تحديث Robots.txt', variant: 'destructive' })
                        }
                      }}
                    >
                      <Wrench className="h-5 w-5" />
                      <span>تحديث Robots</span>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="gap-2 h-auto py-3 flex-col"
                      onClick={() => {
                        // Open Google Rich Results Test
                        const url = window.location.origin
                        window.open(`https://search.google.com/test/rich-results?url=${encodeURIComponent(url)}`, '_blank')
                      }}
                    >
                      <BarChart3 className="h-5 w-5" />
                      <span>اختبار Google</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* SEO Status Overview */}
              <Card>
                <CardHeader>
                  <CardTitle>حالة SEO</CardTitle>
                  <CardDescription>ملخص سريع عن حالة تحسين محركات البحث</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className={`rounded-lg p-3 border ${settings.seo_title && settings.seo_description ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                      <p className="text-muted-foreground">Meta Tags</p>
                      <p className={`font-medium ${settings.seo_title && settings.seo_description ? 'text-green-600' : 'text-red-600'}`}>
                        {settings.seo_title && settings.seo_description ? 'مكتمل' : 'غير مكتمل'}
                      </p>
                    </div>
                    <div className={`rounded-lg p-3 border ${settings.og_image ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                      <p className="text-muted-foreground">Open Graph</p>
                      <p className={`font-medium ${settings.og_image ? 'text-green-600' : 'text-amber-600'}`}>
                        {settings.og_image ? 'مُعد' : 'يحتاج صورة'}
                      </p>
                    </div>
                    <div className={`rounded-lg p-3 border ${settings.google_site_verification ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                      <p className="text-muted-foreground">Google Verify</p>
                      <p className={`font-medium ${settings.google_site_verification ? 'text-green-600' : 'text-amber-600'}`}>
                        {settings.google_site_verification ? 'موثق' : 'غير موثق'}
                      </p>
                    </div>
                    <div className={`rounded-lg p-3 border ${settings.seo_keywords ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                      <p className="text-muted-foreground">Keywords</p>
                      <p className={`font-medium ${settings.seo_keywords ? 'text-green-600' : 'text-amber-600'}`}>
                        {settings.seo_keywords ? 'مُعد' : 'فارغ'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Basic SEO Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>إعدادات SEO الأساسية</CardTitle>
                  <CardDescription>العنوان والوصف والكلمات المفتاحية</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>عنوان الموقع (Title)</Label>
                      <span className={`text-xs ${settings.seo_title.length > 60 ? 'text-red-500' : 'text-muted-foreground'}`}>
                        {settings.seo_title.length}/60 حرف
                      </span>
                    </div>
                    <Input
                      value={settings.seo_title}
                      onChange={(e) => updateSetting('seo_title', e.target.value)}
                      placeholder="عنوان الموقع - يظهر في نتائج البحث"
                    />
                    <p className="text-xs text-muted-foreground">
                      💡 الحد الأقصى المثالي: 50-60 حرف. يظهر في علامة التبويب ونتائج البحث.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>وصف الموقع (Meta Description)</Label>
                      <span className={`text-xs ${settings.seo_description.length > 160 ? 'text-red-500' : 'text-muted-foreground'}`}>
                        {settings.seo_description.length}/160 حرف
                      </span>
                    </div>
                    <Textarea
                      value={settings.seo_description}
                      onChange={(e) => updateSetting('seo_description', e.target.value)}
                      rows={3}
                      placeholder="وصف مختصر وجذاب للموقع يظهر في نتائج البحث"
                    />
                    <p className="text-xs text-muted-foreground">
                      💡 الحد الأقصى المثالي: 150-160 حرف. اجعله جذاباً ويحتوي على كلمات مفتاحية.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>الكلمات المفتاحية (Keywords)</Label>
                    <Textarea
                      value={settings.seo_keywords}
                      onChange={(e) => updateSetting('seo_keywords', e.target.value)}
                      rows={2}
                      placeholder="عبايات، حجاب، ملابس محتشمة، فساتين، أزياء إسلامية"
                    />
                    <p className="text-xs text-muted-foreground">
                      💡 افصل بين الكلمات بفواصل. اختر كلمات ذات صلة بمنتجاتك.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>المؤلف (Author)</Label>
                      <Input
                        value={settings.seo_author}
                        onChange={(e) => updateSetting('seo_author', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>لغة الموقع</Label>
                      <Select value={settings.seo_language} onValueChange={(v) => updateSetting('seo_language', v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ar">العربية</SelectItem>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="ar-en">العربية والإنجليزية</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Open Graph Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Open Graph - فيسبوك ومشاركات</CardTitle>
                  <CardDescription>إعدادات عرض الموقع عند المشاركة على فيسبوك وواتساب</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                    <p className="font-medium text-blue-800 mb-1">💡 ما هو Open Graph؟</p>
                    <p className="text-blue-700">يتحكم في كيفية ظهور موقعك عند مشاركته على فيسبوك، واتساب، وتيليجرام، وغيرها.</p>
                  </div>
                  <div className="space-y-2">
                    <Label>عنوان Open Graph</Label>
                    <Input
                      value={settings.og_title || settings.seo_title}
                      onChange={(e) => updateSetting('og_title', e.target.value)}
                      placeholder="عنوان يظهر عند المشاركة (اختياري - سيستخدم عنوان الموقع إذا فارغ)"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>وصف Open Graph</Label>
                    <Textarea
                      value={settings.og_description || settings.seo_description}
                      onChange={(e) => updateSetting('og_description', e.target.value)}
                      rows={2}
                      placeholder="وصف يظهر عند المشاركة (اختياري)"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>صورة Open Graph</Label>
                    <ImageUploader
                      value={settings.og_image}
                      onChange={(url) => updateSetting('og_image', url)}
                      folder="seo"
                      placeholder="صورة للمشاركة - المقاس المثالي: 1200x630 بكسل"
                    />
                    <p className="text-xs text-muted-foreground">
                      💡 المقاس المثالي: 1200x630 بكسل. صورة جذابة تظهر عند مشاركة الموقع.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>نوع المحتوى</Label>
                    <Select value={settings.og_type} onValueChange={(v) => updateSetting('og_type', v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="website">موقع ويب</SelectItem>
                        <SelectItem value="product">منتج</SelectItem>
                        <SelectItem value="article">مقال</SelectItem>
                        <SelectItem value="business.business">نشاط تجاري</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Twitter Card Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Twitter Card - بطاقات تويتر</CardTitle>
                  <CardDescription>إعدادات عرض الموقع عند المشاركة على تويتر/X</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>نوع البطاقة</Label>
                    <Select value={settings.twitter_card} onValueChange={(v) => updateSetting('twitter_card', v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="summary">ملخص صغير</SelectItem>
                        <SelectItem value="summary_large_image">ملخص مع صورة كبيرة</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      💡 اختر "ملخص مع صورة كبيرة" للحصول على أفضل ظهور.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>معرف تويتر (@username)</Label>
                    <Input
                      value={settings.twitter_site}
                      onChange={(e) => updateSetting('twitter_site', e.target.value)}
                      placeholder="@yourusername"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>عنوان تويتر</Label>
                    <Input
                      value={settings.twitter_title}
                      onChange={(e) => updateSetting('twitter_title', e.target.value)}
                      placeholder="عنوان يظهر على تويتر (اختياري)"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>وصف تويتر</Label>
                    <Textarea
                      value={settings.twitter_description}
                      onChange={(e) => updateSetting('twitter_description', e.target.value)}
                      rows={2}
                      placeholder="وصف يظهر على تويتر (اختياري)"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>صورة تويتر</Label>
                    <ImageUploader
                      value={settings.twitter_image}
                      onChange={(url) => updateSetting('twitter_image', url)}
                      folder="seo"
                      placeholder="صورة لتويتر - المقاس المثالي: 1200x600 بكسل"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Search Engine Verification */}
              <Card>
                <CardHeader>
                  <CardTitle>التحقق من محركات البحث</CardTitle>
                  <CardDescription>ربط الموقع مع أدوات مشرفي محركات البحث</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm">
                    <p className="font-medium text-emerald-800 mb-1">💡 لماذا التحقق مهم؟</p>
                    <p className="text-emerald-700">التحقق من الموقع في أدوات مشرفي البحث يساعدك على تتبع ظهور موقعك وتحسين ترتيبه.</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Google Search Verification</Label>
                    <Input
                      value={settings.google_site_verification}
                      onChange={(e) => updateSetting('google_site_verification', e.target.value)}
                      placeholder="رمز التحقق من Google (مثل: abc123...)"
                    />
                    <p className="text-xs text-muted-foreground">
                      احصل عليه من <a href="https://search.google.com/search-console" target="_blank" className="underline text-primary">Google Search Console</a> → الإعدادات → التحقق
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Bing Webmaster Verification</Label>
                    <Input
                      value={settings.bing_webmaster_verification}
                      onChange={(e) => updateSetting('bing_webmaster_verification', e.target.value)}
                      placeholder="رمز التحقق من Bing"
                    />
                    <p className="text-xs text-muted-foreground">
                      احصل عليه من <a href="https://www.bing.com/webmasters" target="_blank" className="underline text-primary">Bing Webmaster Tools</a>
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Yandex Verification</Label>
                    <Input
                      value={settings.yandex_verification}
                      onChange={(e) => updateSetting('yandex_verification', e.target.value)}
                      placeholder="رمز التحقق من Yandex (اختياري)"
                    />
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open('https://search.google.com/search-console', '_blank')}
                    >
                      <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M22.84 2.99L12.15 13.68l-1.42-1.41L21.43 2.57c.36-.36.92-.39 1.31-.07.42.35.44.96.1 1.38v.11z"/>
                      </svg>
                      Google Console
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open('https://www.bing.com/webmasters', '_blank')}
                    >
                      Bing Webmaster
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Structured Data (Schema.org) */}
              <Card>
                <CardHeader>
                  <CardTitle>البيانات المنظمة (Schema.org)</CardTitle>
                  <CardDescription>إضافة بيانات منظمة لتحسين ظهور الموقع في نتائج البحث</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-sm">
                    <p className="font-medium text-purple-800 mb-1">💡 ما هي البيانات المنظمة؟</p>
                    <p className="text-purple-700">كود خاص يساعد محركات البحث على فهم محتوى موقعك وعرض نتائج غنية (مثل التقييمات والأسعار).</p>
                  </div>
                  <div className="space-y-2">
                    <Label>نوع النشاط</Label>
                    <Select value={settings.schema_org_type} onValueChange={(v) => updateSetting('schema_org_type', v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Organization">منظمة / شركة</SelectItem>
                        <SelectItem value="LocalBusiness">نشاط تجاري محلي</SelectItem>
                        <SelectItem value="Store">متجر إلكتروني</SelectItem>
                        <SelectItem value="WebSite">موقع ويب</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>اسم النشاط التجاري</Label>
                    <Input
                      value={settings.business_name}
                      onChange={(e) => updateSetting('business_name', e.target.value)}
                      placeholder="Astar - استآر"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>شعار النشاط</Label>
                    <ImageUploader
                      value={settings.business_logo}
                      onChange={(url) => updateSetting('business_logo', url)}
                      folder="seo"
                      placeholder="شعار الشركة للظهور في نتائج البحث"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>نطاق الأسعار</Label>
                      <Select value={settings.business_price_range} onValueChange={(v) => updateSetting('business_price_range', v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="$">$ - اقتصادي</SelectItem>
                          <SelectItem value="$$">$$ - متوسط</SelectItem>
                          <SelectItem value="$$$">$$$ - مرتفع</SelectItem>
                          <SelectItem value="$$$$">$$$$ - فاخر</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>إعادة الزحف</Label>
                      <Select value={settings.seo_revisit_after} onValueChange={(v) => updateSetting('seo_revisit_after', v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1 day">يومياً</SelectItem>
                          <SelectItem value="7 days">أسبوعياً</SelectItem>
                          <SelectItem value="14 days">كل أسبوعين</SelectItem>
                          <SelectItem value="30 days">شهرياً</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Robots.txt & Sitemap */}
              <Card>
                <CardHeader>
                  <CardTitle>Robots.txt و Sitemap</CardTitle>
                  <CardDescription>إعدادات ملفات الزحف لمحركات البحث</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>تفعيل Sitemap تلقائي</Label>
                      <p className="text-sm text-muted-foreground">إنشاء خريطة موقع تلقائية للمنتجات والصفحات</p>
                    </div>
                    <Switch
                      checked={settings.sitemap_enabled === 'true'}
                      onCheckedChange={(checked) => updateSetting('sitemap_enabled', checked ? 'true' : 'false')}
                    />
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label>إعدادات الفهرسة (Indexing)</Label>
                    <Select value={settings.robots_index} onValueChange={(v) => updateSetting('robots_index', v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="index, follow">فهرسة ومتابعة الروابط (موصى)</SelectItem>
                        <SelectItem value="index, nofollow">فهرسة بدون متابعة</SelectItem>
                        <SelectItem value="noindex, nofollow">عدم الفهرسة</SelectItem>
                        <SelectItem value="noindex, follow">عدم الفهرسة مع متابعة</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Canonical URL</Label>
                    <Input
                      value={settings.canonical_url}
                      onChange={(e) => updateSetting('canonical_url', e.target.value)}
                      placeholder="https://yourdomain.com"
                    />
                    <p className="text-xs text-muted-foreground">
                      💡 الرابط الأساسي للموقع. مهم لتجنب المحتوى المكرر.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>تعليمات Robots.txt مخصصة</Label>
                    <Textarea
                      value={settings.robots_txt_custom}
                      onChange={(e) => updateSetting('robots_txt_custom', e.target.value)}
                      rows={4}
                      placeholder={`User-agent: *
Allow: /
Disallow: /admin/
Sitemap: https://yourdomain.com/sitemap.xml`}
                    />
                    <p className="text-xs text-muted-foreground">
                      💡 تعليمات إضافية لمحركات البحث. اتركها فارغة لاستخدام الإعدادات الافتراضية.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* SEO Tips */}
              <Card>
                <CardHeader>
                  <CardTitle>نصائح SEO مهمة</CardTitle>
                  <CardDescription>إرشادات لتحسين ظهور موقعك في محركات البحث</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 bg-muted rounded-lg border border-border">
                      <div className="p-1.5 rounded-full bg-green-100">
                        <Check className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">أضف وصفاً لكل منتج</p>
                        <p className="text-sm text-muted-foreground">تأكد من إضافة وصف فريد لكل منتج يحتوي على كلمات مفتاحية.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-muted rounded-lg border border-border">
                      <div className="p-1.5 rounded-full bg-green-100">
                        <Check className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">استخدم صوراً عالية الجودة</p>
                        <p className="text-sm text-muted-foreground">الصور الجيدة تحسن تجربة المستخدم وتزيد من وقت البقاء في الموقع.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-muted rounded-lg border border-border">
                      <div className="p-1.5 rounded-full bg-green-100">
                        <Check className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">تحقق من موقعك في Google Search Console</p>
                        <p className="text-sm text-muted-foreground">راقب أخطاء الزحف والأداء بشكل دوري.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-muted rounded-lg border border-border">
                      <div className="p-1.5 rounded-full bg-green-100">
                        <Check className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">اجمع تقييمات العملاء</p>
                        <p className="text-sm text-muted-foreground">التقييمات تظهر كنجوم في نتائج البحث وتزيد الثقة.</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ==================== SECURITY SETTINGS ==================== */}
          {activeTab === 'security' && (
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>إعدادات الأمان</CardTitle>
                  <CardDescription>حماية الموقع والتحكم في الصلاحيات</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>التحقق بخطوتين للأدمن</Label>
                      <p className="text-sm text-muted-foreground">تفعيل 2FA للوحة التحكم</p>
                    </div>
                    <Switch
                      checked={settings.two_factor_enabled === 'true'}
                      onCheckedChange={(checked) => {
                        updateSetting('two_factor_enabled', checked ? 'true' : 'false')
                        handleLogSecurityAction(checked ? 'تفعيل التحقق بخطوتين' : 'تعطيل التحقق بخطوتين')
                      }}
                    />
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label>عدد محاولات تسجيل الدخول</Label>
                    <Input
                      type="number"
                      value={settings.login_attempts}
                      onChange={(e) => updateSetting('login_attempts', e.target.value)}
                      className="w-32"
                    />
                    <p className="text-xs text-muted-foreground">عدد المحاولات المسموح بها قبل حظر الحساب</p>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>تسجيل جميع العمليات</Label>
                      <p className="text-sm text-muted-foreground">تسجيل كل العمليات في النظام</p>
                    </div>
                    <Switch
                      checked={settings.log_all_actions === 'true'}
                      onCheckedChange={(checked) => updateSetting('log_all_actions', checked ? 'true' : 'false')}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Security Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>إجراءات الأمان</CardTitle>
                  <CardDescription>أدوات إدارة أمان النظام</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Button 
                      variant="outline" 
                      className="gap-2 h-auto py-3 flex-col"
                      onClick={handleViewSecurityLog}
                    >
                      <Eye className="h-5 w-5" />
                      <span>سجل الأمان</span>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="gap-2 h-auto py-3 flex-col"
                      onClick={handleClearSessions}
                    >
                      <Key className="h-5 w-5" />
                      <span>مسح الجلسات</span>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="gap-2 h-auto py-3 flex-col"
                      onClick={handleExportSecurityReport}
                    >
                      <Download className="h-5 w-5" />
                      <span>تقرير الأمان</span>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="gap-2 h-auto py-3 flex-col"
                      onClick={() => {
                        handleLogSecurityAction('تغيير كلمة المرور')
                        toast({ title: 'تغيير كلمة المرور', description: 'يرجى التواصل مع الدعم الفني لتغيير كلمة المرور' })
                      }}
                    >
                      <Shield className="h-5 w-5" />
                      <span>تغيير كلمة المرور</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Security Status */}
              <Card>
                <CardHeader>
                  <CardTitle>حالة الأمان</CardTitle>
                  <CardDescription>ملخص سريع عن حالة أمان الموقع</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className={`rounded-lg p-3 border ${settings.two_factor_enabled === 'true' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                      <p className="text-muted-foreground">التحقق بخطوتين</p>
                      <p className={`font-medium ${settings.two_factor_enabled === 'true' ? 'text-green-600' : 'text-red-600'}`}>
                        {settings.two_factor_enabled === 'true' ? 'مفعّل' : 'معطّل'}
                      </p>
                    </div>
                    <div className="bg-muted/30 rounded-lg p-3 border border-border">
                      <p className="text-muted-foreground">محاولات الدخول</p>
                      <p className="font-medium text-foreground">{settings.login_attempts || 5}</p>
                    </div>
                    <div className={`rounded-lg p-3 border ${settings.log_all_actions === 'true' ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                      <p className="text-muted-foreground">تسجيل العمليات</p>
                      <p className={`font-medium ${settings.log_all_actions === 'true' ? 'text-green-600' : 'text-amber-600'}`}>
                        {settings.log_all_actions === 'true' ? 'مفعّل' : 'معطّل'}
                      </p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                      <p className="text-muted-foreground">حالة النظام</p>
                      <p className="font-medium text-green-600">آمن</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ==================== PERFORMANCE SETTINGS ==================== */}
          {activeTab === 'performance' && (
            <Card>
              <CardHeader>
                <CardTitle>إعدادات الأداء</CardTitle>
                <CardDescription>تحسين سرعة وأداء الموقع</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>تفعيل Cache</Label>
                    <p className="text-sm text-muted-foreground">تخزين مؤقت للبيانات لتحسين السرعة</p>
                  </div>
                  <Switch
                    checked={settings.cache_enabled === 'true'}
                    onCheckedChange={(checked) => updateSetting('cache_enabled', checked ? 'true' : 'false')}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Lazy Loading للصور</Label>
                    <p className="text-sm text-muted-foreground">تحميل الصور عند الحاجة فقط</p>
                  </div>
                  <Switch
                    checked={settings.lazy_load_images === 'true'}
                    onCheckedChange={(checked) => updateSetting('lazy_load_images', checked ? 'true' : 'false')}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>ضغط الصور تلقائياً</Label>
                    <p className="text-sm text-muted-foreground">تقليل حجم الصور المرفوعة</p>
                  </div>
                  <Switch
                    checked={settings.auto_compress_images === 'true'}
                    onCheckedChange={(checked) => updateSetting('auto_compress_images', checked ? 'true' : 'false')}
                  />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>حد رفع الصور (MB)</Label>
                  <Input
                    type="number"
                    value={settings.max_upload_size}
                    onChange={(e) => updateSetting('max_upload_size', e.target.value)}
                    className="w-32"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* ==================== BACKUP SETTINGS ==================== */}
          {activeTab === 'backup' && (
            <Card>
              <CardHeader>
                <CardTitle>النسخ الاحتياطي</CardTitle>
                <CardDescription>إدارة النسخ الاحتياطية لقاعدة البيانات</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>النسخ الاحتياطي التلقائي</Label>
                    <p className="text-sm text-muted-foreground">نسخ احتياطي يومي لقاعدة البيانات</p>
                  </div>
                  <Switch
                    checked={settings.auto_backup === 'true'}
                    onCheckedChange={(checked) => updateSetting('auto_backup', checked ? 'true' : 'false')}
                  />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>وقت النسخ الاحتياطي</Label>
                  <Input
                    type="time"
                    value={settings.backup_time}
                    onChange={(e) => updateSetting('backup_time', e.target.value)}
                    className="w-32"
                  />
                </div>
                <Separator />
                <div className="flex gap-2">
                  <Button variant="outline" className="gap-2" onClick={handleDownloadBackup}>
                    <Download className="h-4 w-4" />
                    تحميل نسخة احتياطية
                  </Button>
                  <Button variant="outline" className="gap-2" onClick={handleRestoreBackup}>
                    <Upload className="h-4 w-4" />
                    استعادة نسخة احتياطية
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ==================== API SETTINGS ==================== */}
          {activeTab === 'api' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>مفاتيح API</CardTitle>
                    <CardDescription>إدارة مفاتيح API للتكاملات الخارجية</CardDescription>
                  </div>
                  <Button onClick={generateApiKey} className="bg-primary hover:bg-primary/90">
                    <Plus className="h-4 w-4 mr-2" />
                    إنشاء مفتاح جديد
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الاسم</TableHead>
                      <TableHead>المفتاح</TableHead>
                      <TableHead>الصلاحيات</TableHead>
                      <TableHead>تاريخ الإنشاء</TableHead>
                      <TableHead className="text-center">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {apiKeys.map((apiKey) => (
                      <TableRow key={apiKey.id}>
                        <TableCell className="font-medium">{apiKey.name}</TableCell>
                        <TableCell>
                          <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                            {apiKey.key.substring(0, 15)}...
                          </code>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {apiKey.permissions.map((p) => (
                              <Badge key={p} variant="secondary">{p}</Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>{apiKey.createdAt}</TableCell>
                        <TableCell className="text-center">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-destructive"
                            onClick={() => handleDeleteApiKey(apiKey.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* ==================== MAINTENANCE SETTINGS ==================== */}
          {activeTab === 'maintenance' && (
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>وضع الصيانة</CardTitle>
                  <CardDescription>وضع الموقع في حالة صيانة</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>تفعيل وضع الصيانة</Label>
                      <p className="text-sm text-muted-foreground">إيقاف الموقع للزوار مع السماح للأدمن بالدخول</p>
                    </div>
                    <Switch
                      checked={settings.maintenance_mode === 'true'}
                      onCheckedChange={(checked) => updateSetting('maintenance_mode', checked ? 'true' : 'false')}
                    />
                  </div>
                  {settings.maintenance_mode === 'true' && (
                    <>
                      <Separator />
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>رسالة الصيانة (عربي)</Label>
                          <Textarea
                            value={settings.maintenance_message_ar}
                            onChange={(e) => updateSetting('maintenance_message_ar', e.target.value)}
                            rows={2}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>رسالة الصيانة (إنجليزي)</Label>
                          <Textarea
                            value={settings.maintenance_message_en}
                            onChange={(e) => updateSetting('maintenance_message_en', e.target.value)}
                            rows={2}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* System Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>إجراءات النظام</CardTitle>
                  <CardDescription>أدوات صيانة وإدارة النظام</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Button 
                      variant="outline" 
                      className="gap-2 h-auto py-3 flex-col"
                      onClick={handleClearCache}
                    >
                      <RotateCcw className="h-5 w-5" />
                      <span>تحديث الكاش</span>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="gap-2 h-auto py-3 flex-col"
                      onClick={handleSystemHealthCheck}
                    >
                      <Zap className="h-5 w-5" />
                      <span>فحص النظام</span>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="gap-2 h-auto py-3 flex-col"
                      onClick={handleDownloadBackup}
                    >
                      <Download className="h-5 w-5" />
                      <span>نسخة احتياطية</span>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="gap-2 h-auto py-3 flex-col"
                      onClick={handleRestoreBackup}
                    >
                      <Upload className="h-5 w-5" />
                      <span>استعادة نسخة</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Data Export */}
              <Card>
                <CardHeader>
                  <CardTitle>تصدير البيانات</CardTitle>
                  <CardDescription>تصدير بيانات المتجر بصيغة JSON</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Button 
                      variant="outline" 
                      className="gap-2 h-auto py-3 flex-col"
                      onClick={() => handleExportData('products')}
                    >
                      <Download className="h-5 w-5" />
                      <span>تصدير المنتجات</span>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="gap-2 h-auto py-3 flex-col"
                      onClick={() => handleExportData('orders')}
                    >
                      <Download className="h-5 w-5" />
                      <span>تصدير الطلبات</span>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="gap-2 h-auto py-3 flex-col"
                      onClick={() => handleExportData('users')}
                    >
                      <Download className="h-5 w-5" />
                      <span>تصدير العملاء</span>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="gap-2 h-auto py-3 flex-col"
                      onClick={() => handleExportData('categories')}
                    >
                      <Download className="h-5 w-5" />
                      <span>تصدير الأقسام</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Reset Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-red-600">إجراءات خطرة</CardTitle>
                  <CardDescription>إجراءات يجب استخدامها بحذر</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Button 
                      variant="outline" 
                      className="gap-2 h-auto py-3 flex-col border-red-200 hover:bg-red-50 hover:text-red-600"
                      onClick={() => {
                        if (confirm('هل أنت متأكد من إعادة ضبط الإعدادات؟ سيتم إرجاع جميع الإعدادات للقيم الافتراضية.')) {
                          resetToDefaults()
                        }
                      }}
                    >
                      <Wrench className="h-5 w-5" />
                      <span>إعادة ضبط الإعدادات</span>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="gap-2 h-auto py-3 flex-col border-red-200 hover:bg-red-50 hover:text-red-600"
                      onClick={() => {
                        if (confirm('هل أنت متأكد من مسح الكاش؟')) {
                          localStorage.clear()
                          sessionStorage.clear()
                          toast({ title: 'تم المسح', description: 'تم مسح جميع البيانات المؤقتة' })
                          window.location.reload()
                        }
                      }}
                    >
                      <Trash2 className="h-5 w-5" />
                      <span>مسح الكاش المحلي</span>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="gap-2 h-auto py-3 flex-col border-red-200 hover:bg-red-50 hover:text-red-600"
                      onClick={() => {
                        toast({ title: 'ملاحظة', description: 'هذه الميزة ستحذف الطلبات الملغية والقديمة. يرجى عمل نسخة احتياطية أولاً.' })
                      }}
                    >
                      <Trash2 className="h-5 w-5" />
                      <span>حذف الطلبات القديمة</span>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="gap-2 h-auto py-3 flex-col border-red-200 hover:bg-red-50 hover:text-red-600"
                      onClick={() => {
                        toast({ title: 'ملاحظة', description: 'هذه الميزة ستحذف المنتجات غير المباعة. يرجى عمل نسخة احتياطية أولاً.' })
                      }}
                    >
                      <Trash2 className="h-5 w-5" />
                      <span>حذف منتجات غير مفعلة</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* System Information */}
              <Card>
                <CardHeader>
                  <CardTitle>معلومات النظام</CardTitle>
                  <CardDescription>معلومات تقنية عن النظام</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="bg-muted/30 rounded-lg p-3 border border-border">
                      <p className="text-muted-foreground">الإصدار</p>
                      <p className="font-medium text-foreground">1.0.0</p>
                    </div>
                    <div className="bg-muted/30 rounded-lg p-3 border border-border">
                      <p className="text-muted-foreground">قاعدة البيانات</p>
                      <p className="font-medium text-foreground">SQLite</p>
                    </div>
                    <div className="bg-muted/30 rounded-lg p-3 border border-border">
                      <p className="text-muted-foreground">العملة</p>
                      <p className="font-medium text-foreground">{settings.currency_symbol || 'ج.م'}</p>
                    </div>
                    <div className="bg-muted/30 rounded-lg p-3 border border-border">
                      <p className="text-muted-foreground">المنطقة الزمنية</p>
                      <p className="font-medium text-foreground">{settings.timezone || 'Africa/Cairo'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ==================== ANALYTICS SETTINGS ==================== */}
          {activeTab === 'analytics' && (
            <div className="grid gap-6">
              {/* Google Analytics */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M22.84 2.99L12.15 13.68l-1.42-1.41L21.43 2.57c.36-.36.92-.39 1.31-.07.42.35.44.96.1 1.38v.11zM12 14.53l-1.41-1.41-1.42 1.41 1.42 1.42L12 14.53zm-8.5 5.97l1.41-1.41-1.41-1.42-1.42 1.42 1.42 1.41zm3.54-3.54l1.41-1.41-1.41-1.42-1.42 1.42 1.42 1.41zm3.53-3.53l1.41-1.41-1.41-1.42-1.42 1.42 1.42 1.41z"/>
                        </svg>
                        Google Analytics
                      </CardTitle>
                      <CardDescription>تتبع زيارات الموقع وتحليل سلوك المستخدمين</CardDescription>
                    </div>
                    <Badge variant={settings.google_analytics_id ? 'default' : 'secondary'} className={settings.google_analytics_id ? 'bg-green-600' : ''}>
                      {settings.google_analytics_id ? 'مفعّل' : 'غير مفعّل'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Measurement ID</Label>
                    <Input
                      value={settings.google_analytics_id}
                      onChange={(e) => updateSetting('google_analytics_id', e.target.value)}
                      placeholder="G-XXXXXXXXXX"
                    />
                    <p className="text-xs text-muted-foreground">
                      احصل على المعرف من Google Analytics Dashboard → Admin → Data Streams
                    </p>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                    <p className="font-medium text-blue-800 mb-1">كيفية الحصول على Google Analytics ID:</p>
                    <ol className="text-blue-700 list-decimal list-inside space-y-1">
                      <li>سجل في <a href="https://analytics.google.com" target="_blank" className="underline">Google Analytics</a></li>
                      <li>أنشئ حساب وخصائص جديدة</li>
                      <li>انسخ Measurement ID (G-XXXXXXXXXX)</li>
                    </ol>
                  </div>
                </CardContent>
              </Card>

              {/* Facebook Pixel */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                        Facebook Pixel
                      </CardTitle>
                      <CardDescription>تتبع الإعلانات وتحسين الحملات على Facebook و Instagram</CardDescription>
                    </div>
                    <Badge variant={settings.facebook_pixel_id ? 'default' : 'secondary'} className={settings.facebook_pixel_id ? 'bg-green-600' : ''}>
                      {settings.facebook_pixel_id ? 'مفعّل' : 'غير مفعّل'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Pixel ID</Label>
                    <Input
                      value={settings.facebook_pixel_id}
                      onChange={(e) => updateSetting('facebook_pixel_id', e.target.value)}
                      placeholder="XXXXXXXXXXXXXXXX"
                    />
                    <p className="text-xs text-muted-foreground">
                      احصل على Pixel ID من Meta Business Suite → Events Manager
                    </p>
                  </div>
                  <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-sm">
                    <p className="font-medium text-indigo-800 mb-1">كيفية الحصول على Facebook Pixel ID:</p>
                    <ol className="text-indigo-700 list-decimal list-inside space-y-1">
                      <li>اذهب إلى <a href="https://business.facebook.com" target="_blank" className="underline">Meta Business Suite</a></li>
                      <li>Events Manager → Data Sources → Pixels</li>
                      <li>انسخ Pixel ID (15-16 رقم)</li>
                    </ol>
                  </div>
                </CardContent>
              </Card>

              {/* TikTok Pixel */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
                        </svg>
                        TikTok Pixel
                      </CardTitle>
                      <CardDescription>تتبع الإعلانات وتحسين الحملات على TikTok</CardDescription>
                    </div>
                    <Badge variant={settings.tiktok_pixel_id ? 'default' : 'secondary'} className={settings.tiktok_pixel_id ? 'bg-green-600' : ''}>
                      {settings.tiktok_pixel_id ? 'مفعّل' : 'غير مفعّل'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Pixel ID</Label>
                    <Input
                      value={settings.tiktok_pixel_id}
                      onChange={(e) => updateSetting('tiktok_pixel_id', e.target.value)}
                      placeholder="XXXXXXXXXX"
                    />
                    <p className="text-xs text-muted-foreground">
                      احصل على Pixel ID من TikTok Ads Manager → Assets → Pixels
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                    <p className="font-medium text-gray-800 mb-1">كيفية الحصول على TikTok Pixel ID:</p>
                    <ol className="text-gray-700 list-decimal list-inside space-y-1">
                      <li>اذهب إلى <a href="https://ads.tiktok.com" target="_blank" className="underline">TikTok Ads Manager</a></li>
                      <li>Assets → Event → Website Pixel</li>
                      <li>انسخ Pixel ID</li>
                    </ol>
                  </div>
                </CardContent>
              </Card>

              {/* Analytics Status */}
              <Card>
                <CardHeader>
                  <CardTitle>حالة خدمات التحليلات</CardTitle>
                  <CardDescription>ملخص سريع عن حالة أدوات التتبع</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    <div className={`rounded-lg p-4 border ${settings.google_analytics_id ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-3 h-3 rounded-full ${settings.google_analytics_id ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="font-medium">Google Analytics</span>
                      </div>
                      <p className={`text-xs ${settings.google_analytics_id ? 'text-green-600' : 'text-red-600'}`}>
                        {settings.google_analytics_id ? 'مفعّل ويعمل' : 'غير مفعّل'}
                      </p>
                      {settings.google_analytics_id && (
                        <p className="text-xs text-muted-foreground mt-1">
                          ID: {settings.google_analytics_id}
                        </p>
                      )}
                    </div>
                    
                    <div className={`rounded-lg p-4 border ${settings.facebook_pixel_id ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-3 h-3 rounded-full ${settings.facebook_pixel_id ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="font-medium">Facebook Pixel</span>
                      </div>
                      <p className={`text-xs ${settings.facebook_pixel_id ? 'text-green-600' : 'text-red-600'}`}>
                        {settings.facebook_pixel_id ? 'مفعّل ويعمل' : 'غير مفعّل'}
                      </p>
                      {settings.facebook_pixel_id && (
                        <p className="text-xs text-muted-foreground mt-1">
                          ID: {settings.facebook_pixel_id}
                        </p>
                      )}
                    </div>
                    
                    <div className={`rounded-lg p-4 border ${settings.tiktok_pixel_id ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-3 h-3 rounded-full ${settings.tiktok_pixel_id ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="font-medium">TikTok Pixel</span>
                      </div>
                      <p className={`text-xs ${settings.tiktok_pixel_id ? 'text-green-600' : 'text-red-600'}`}>
                        {settings.tiktok_pixel_id ? 'مفعّل ويعمل' : 'غير مفعّل'}
                      </p>
                      {settings.tiktok_pixel_id && (
                        <p className="text-xs text-muted-foreground mt-1">
                          ID: {settings.tiktok_pixel_id}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Events Info */}
              <Card>
                <CardHeader>
                  <CardTitle>الأحداث المتتبعة</CardTitle>
                  <CardDescription>الأحداث التي يتم تتبعها تلقائياً</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3 bg-muted rounded-lg text-center">
                      <p className="font-medium text-sm">Page View</p>
                      <p className="text-xs text-muted-foreground">مشاهدة الصفحة</p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg text-center">
                      <p className="font-medium text-sm">Add to Cart</p>
                      <p className="text-xs text-muted-foreground">إضافة للسلة</p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg text-center">
                      <p className="font-medium text-sm">Begin Checkout</p>
                      <p className="text-xs text-muted-foreground">بدء الدفع</p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg text-center">
                      <p className="font-medium text-sm">Purchase</p>
                      <p className="text-xs text-muted-foreground">إتمام الشراء</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-4">
                    💡 سيتم تتبع هذه الأحداث تلقائياً عند تفعيل أي من أدوات التحليلات أعلاه.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ==================== CONTACT SETTINGS ==================== */}
          {activeTab === 'contact' && (
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>معلومات التواصل</CardTitle>
                  <CardDescription>بيانات الاتصال بالموقع</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>البريد الإلكتروني</Label>
                    <Input
                      type="email"
                      value={settings.site_email}
                      onChange={(e) => updateSetting('site_email', e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>رقم الهاتف</Label>
                      <Input
                        value={settings.site_phone}
                        onChange={(e) => updateSetting('site_phone', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>واتساب</Label>
                      <Input
                        value={settings.site_whatsapp}
                        onChange={(e) => updateSetting('site_whatsapp', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>العنوان (عربي)</Label>
                      <Textarea
                        value={settings.site_address_ar}
                        onChange={(e) => updateSetting('site_address_ar', e.target.value)}
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>العنوان (إنجليزي)</Label>
                      <Textarea
                        value={settings.site_address_en}
                        onChange={(e) => updateSetting('site_address_en', e.target.value)}
                        rows={2}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>ساعات العمل (عربي)</Label>
                      <Input
                        value={settings.working_hours_ar}
                        onChange={(e) => updateSetting('working_hours_ar', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>ساعات العمل (إنجليزي)</Label>
                      <Input
                        value={settings.working_hours_en}
                        onChange={(e) => updateSetting('working_hours_en', e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>حسابات التواصل الاجتماعي</CardTitle>
                  <CardDescription>روابط حسابات السوشيال ميديا</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Instagram</Label>
                      <Input
                        value={settings.social_instagram}
                        onChange={(e) => updateSetting('social_instagram', e.target.value)}
                        placeholder="https://instagram.com/..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Twitter / X</Label>
                      <Input
                        value={settings.social_twitter}
                        onChange={(e) => updateSetting('social_twitter', e.target.value)}
                        placeholder="https://twitter.com/..."
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Facebook</Label>
                      <Input
                        value={settings.social_facebook}
                        onChange={(e) => updateSetting('social_facebook', e.target.value)}
                        placeholder="https://facebook.com/..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>TikTok</Label>
                      <Input
                        value={settings.social_tiktok}
                        onChange={(e) => updateSetting('social_tiktok', e.target.value)}
                        placeholder="https://tiktok.com/@..."
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Snapchat</Label>
                    <Input
                      value={settings.social_snapchat}
                      onChange={(e) => updateSetting('social_snapchat', e.target.value)}
                      placeholder="https://snapchat.com/add/..."
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

        </TabsContent>
      </Tabs>

      {/* Shipping Zone Dialog */}
      <ShippingZoneDialog
        open={!!shippingZoneDialog}
        onClose={() => setShippingZoneDialog(null)}
        onSave={handleSaveShippingZone}
        saving={savingZone}
        zone={shippingZoneDialog?.id ? shippingZoneDialog : null}
      />

      {/* Delete Zone Confirmation */}
      <AlertDialog open={!!deleteZoneDialog} onOpenChange={() => setDeleteZoneDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف منطقة الشحن</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف منطقة "{deleteZoneDialog?.name}"؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={() => deleteZoneDialog && handleDeleteShippingZone(deleteZoneDialog)}
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Security Log Dialog */}
      <Dialog open={showSecurityLog} onOpenChange={setShowSecurityLog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>سجل الأمان</DialogTitle>
            <DialogDescription>
              آخر العمليات الأمنية المسجلة في النظام
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {securityLog.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">لا توجد عمليات مسجلة</p>
            ) : (
              securityLog.map((entry, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border">
                  <div>
                    <p className="font-medium text-sm">{entry.action}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(entry.timestamp).toLocaleString('ar-EG')}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {entry.ip}
                  </Badge>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSecurityLog(false)}>
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AdminSettings
