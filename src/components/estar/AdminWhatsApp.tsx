'use client'

import * as React from 'react'
import { csrfFetch } from '@/lib/csrf-fetch'
import { dispatchSettingsUpdate } from '@/hooks/useSiteSettings'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Save, Smartphone, Monitor, RefreshCw, MousePointerClick, Clock } from 'lucide-react'
import {
  defaultWhatsAppSettings,
  parseWhatsAppSettings,
  type WhatsAppSettings,
} from '@/lib/whatsapp'
import { WhatsAppButtonView } from './WhatsAppButtonView'

interface Analytics {
  total: number
  today: number
  week: number
  month: number
  lastClickedAt: string | null
  devices: { mobile: number; desktop: number }
  topPages: { page: string; count: number }[]
}

/* -------------------- small reusable field helpers -------------------- */

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

function SwitchRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string
  hint?: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
      <div className="space-y-0.5">
        <Label className="text-sm font-medium">{label}</Label>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 cursor-pointer rounded-md border border-border bg-transparent p-1"
          aria-label={label}
        />
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="font-mono" />
      </div>
    </Field>
  )
}

function SliderField({
  label,
  value,
  min,
  max,
  step = 1,
  unit = 'px',
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  onChange: (v: number) => void
}) {
  return (
    <Field label={`${label}: ${value}${unit}`}>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(v) => onChange(v[0])}
      />
    </Field>
  )
}

/* -------------------------------- page -------------------------------- */

export function AdminWhatsApp() {
  const { toast } = useToast()
  const [settings, setSettings] = React.useState<WhatsAppSettings>(defaultWhatsAppSettings)
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [analytics, setAnalytics] = React.useState<Analytics | null>(null)
  const [previewLang, setPreviewLang] = React.useState<'ar' | 'en'>('ar')
  const [previewDevice, setPreviewDevice] = React.useState<'mobile' | 'desktop'>('desktop')

  const update = React.useCallback(
    <K extends keyof WhatsAppSettings>(key: K, value: WhatsAppSettings[K]) => {
      setSettings((prev) => ({ ...prev, [key]: value }))
    },
    [],
  )

  const loadSettings = React.useCallback(async () => {
    try {
      const res = await csrfFetch('/api/admin/whatsapp')
      if (res.ok) {
        const data = await res.json()
        setSettings(parseWhatsAppSettings(data.settings))
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadAnalytics = React.useCallback(async () => {
    try {
      const res = await csrfFetch('/api/admin/whatsapp/analytics')
      if (res.ok) {
        const data = await res.json()
        setAnalytics(data.analytics)
      }
    } catch (e) {
      console.error(e)
    }
  }, [])

  React.useEffect(() => {
    loadSettings()
    loadAnalytics()
  }, [loadSettings, loadAnalytics])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await csrfFetch('/api/admin/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.settings) setSettings(parseWhatsAppSettings(data.settings))
        // Refresh the live storefront button in every open tab, no rebuild.
        dispatchSettingsUpdate()
        toast({ title: 'تم الحفظ', description: 'تم تحديث زر واتساب على الموقع مباشرة.' })
      } else {
        toast({ title: 'خطأ', description: 'تعذّر حفظ الإعدادات.', variant: 'destructive' })
      }
    } catch (e) {
      console.error(e)
      toast({ title: 'خطأ', description: 'حدث خطأ غير متوقع.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  const phoneMissing = !settings.phoneNumber.replace(/[^\d]/g, '')

  const previewCornerStyle: React.CSSProperties = {}
  if (settings.position.startsWith('bottom')) previewCornerStyle.bottom = '16px'
  else previewCornerStyle.top = '16px'
  if (settings.position.endsWith('right')) previewCornerStyle.right = '16px'
  else previewCornerStyle.left = '16px'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">إعدادات واتساب</h1>
          <p className="text-sm text-muted-foreground">
            تحكم كامل في زر واتساب العائم على الموقع.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={settings.enabled ? 'default' : 'secondary'}>
            {settings.enabled ? 'مُفعّل' : 'مُعطّل'}
          </Badge>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="ml-2 h-4 w-4" />
            {saving ? 'جارٍ الحفظ...' : 'حفظ التغييرات'}
          </Button>
        </div>
      </div>

      {phoneMissing && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
          لن يظهر الزر على الموقع حتى تُدخل رقم واتساب في تبويب &laquo;التواصل&raquo;.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ---------------- Form ---------------- */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="flex w-full flex-wrap">
              <TabsTrigger value="general">عام</TabsTrigger>
              <TabsTrigger value="contact">التواصل</TabsTrigger>
              <TabsTrigger value="appearance">المظهر</TabsTrigger>
              <TabsTrigger value="position">الموضع</TabsTrigger>
              <TabsTrigger value="visibility">الظهور</TabsTrigger>
              <TabsTrigger value="devices">الأجهزة</TabsTrigger>
              <TabsTrigger value="analytics">التحليلات</TabsTrigger>
            </TabsList>

            {/* General */}
            <TabsContent value="general" className="mt-4 space-y-4">
              <SwitchRow
                label="تفعيل زر واتساب"
                hint="إظهار / إخفاء الزر على كامل الموقع فوراً."
                checked={settings.enabled}
                onChange={(v) => update('enabled', v)}
              />
            </TabsContent>

            {/* Contact */}
            <TabsContent value="contact" className="mt-4 space-y-4">
              <Field
                label="رقم واتساب (بصيغة دولية)"
                hint="مثال: 201223618815 — الأرقام فقط مع رمز الدولة."
              >
                <Input
                  value={settings.phoneNumber}
                  onChange={(e) => update('phoneNumber', e.target.value)}
                  placeholder="201223618815"
                  dir="ltr"
                  inputMode="tel"
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="الرسالة المُسبقة (عربي)">
                  <Textarea
                    value={settings.messageAr}
                    onChange={(e) => update('messageAr', e.target.value)}
                    rows={3}
                  />
                </Field>
                <Field label="الرسالة المُسبقة (إنجليزي)">
                  <Textarea
                    value={settings.messageEn}
                    onChange={(e) => update('messageEn', e.target.value)}
                    rows={3}
                    dir="ltr"
                  />
                </Field>
              </div>
            </TabsContent>

            {/* Appearance */}
            <TabsContent value="appearance" className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="نص الزر (عربي)">
                  <Input
                    value={settings.buttonTextAr}
                    onChange={(e) => update('buttonTextAr', e.target.value)}
                  />
                </Field>
                <Field label="نص الزر (إنجليزي)">
                  <Input
                    value={settings.buttonTextEn}
                    onChange={(e) => update('buttonTextEn', e.target.value)}
                    dir="ltr"
                  />
                </Field>
                <Field label="نص التلميح (عربي)">
                  <Input
                    value={settings.tooltipTextAr}
                    onChange={(e) => update('tooltipTextAr', e.target.value)}
                  />
                </Field>
                <Field label="نص التلميح (إنجليزي)">
                  <Input
                    value={settings.tooltipTextEn}
                    onChange={(e) => update('tooltipTextEn', e.target.value)}
                    dir="ltr"
                  />
                </Field>
              </div>

              <Field label="الأيقونة">
                <Select value={settings.icon} onValueChange={(v) => update('icon', v as WhatsAppSettings['icon'])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="whatsapp">شعار واتساب</SelectItem>
                    <SelectItem value="message">فقاعة رسالة</SelectItem>
                    <SelectItem value="phone">هاتف</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <div className="grid gap-4 sm:grid-cols-3">
                <SliderField label="حجم الزر" value={settings.buttonSize} min={40} max={120} onChange={(v) => update('buttonSize', v)} />
                <SliderField label="حجم الأيقونة" value={settings.iconSize} min={16} max={72} onChange={(v) => update('iconSize', v)} />
                <SliderField label="استدارة الحواف" value={settings.borderRadius} min={0} max={50} onChange={(v) => update('borderRadius', v)} />
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <ColorField label="لون الخلفية" value={settings.bgColor} onChange={(v) => update('bgColor', v)} />
                <ColorField label="لون النص/الأيقونة" value={settings.textColor} onChange={(v) => update('textColor', v)} />
                <ColorField label="لون الخلفية عند التمرير" value={settings.hoverBgColor} onChange={(v) => update('hoverBgColor', v)} />
                <ColorField label="لون النص عند التمرير" value={settings.hoverTextColor} onChange={(v) => update('hoverTextColor', v)} />
              </div>

              <Field label="شدة الظل">
                <Select value={settings.shadow} onValueChange={(v) => update('shadow', v as WhatsAppSettings['shadow'])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">بدون</SelectItem>
                    <SelectItem value="sm">خفيف</SelectItem>
                    <SelectItem value="md">متوسط</SelectItem>
                    <SelectItem value="lg">قوي</SelectItem>
                    <SelectItem value="xl">قوي جداً</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <div className="grid gap-3 sm:grid-cols-2">
                <SwitchRow label="تأثير النبض" checked={settings.pulse} onChange={(v) => update('pulse', v)} />
                <SwitchRow label="حركة عند التمرير" checked={settings.hoverAnimation} onChange={(v) => update('hoverAnimation', v)} />
              </div>

              <Field label="فئة CSS مخصصة (اختياري)">
                <Input
                  value={settings.customClass}
                  onChange={(e) => update('customClass', e.target.value)}
                  dir="ltr"
                  placeholder="my-custom-class"
                />
              </Field>
            </TabsContent>

            {/* Position */}
            <TabsContent value="position" className="mt-4 space-y-4">
              <Field label="موضع الزر">
                <Select value={settings.position} onValueChange={(v) => update('position', v as WhatsAppSettings['position'])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bottom-right">أسفل يمين</SelectItem>
                    <SelectItem value="bottom-left">أسفل يسار</SelectItem>
                    <SelectItem value="top-right">أعلى يمين</SelectItem>
                    <SelectItem value="top-left">أعلى يسار</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <SliderField label="المسافة العمودية" value={settings.bottomSpacing} min={0} max={200} onChange={(v) => update('bottomSpacing', v)} />
                <SliderField label="المسافة الجانبية" value={settings.sideSpacing} min={0} max={200} onChange={(v) => update('sideSpacing', v)} />
                <SliderField label="مسافة الموبايل (0 = افتراضي)" value={settings.mobileSpacing} min={0} max={200} onChange={(v) => update('mobileSpacing', v)} />
                <SliderField label="مسافة سطح المكتب (0 = افتراضي)" value={settings.desktopSpacing} min={0} max={200} onChange={(v) => update('desktopSpacing', v)} />
              </div>

              <SliderField label="ترتيب الطبقة (z-index)" value={settings.zIndex} min={0} max={9999} unit="" onChange={(v) => update('zIndex', v)} />
              <p className="text-xs text-muted-foreground">
                القيمة الافتراضية (40) تُبقي الزر أسفل النوافذ المنبثقة والإشعارات فلا يغطّي السلة أو الدفع.
              </p>
            </TabsContent>

            {/* Visibility */}
            <TabsContent value="visibility" className="mt-4 space-y-4">
              <Field label="أين يظهر الزر؟">
                <Select value={settings.visibility} onValueChange={(v) => update('visibility', v as WhatsAppSettings['visibility'])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل الموقع</SelectItem>
                    <SelectItem value="home">الصفحة الرئيسية فقط</SelectItem>
                    <SelectItem value="products">صفحات المنتجات فقط</SelectItem>
                    <SelectItem value="category">صفحات الفئات/المتجر فقط</SelectItem>
                    <SelectItem value="cart">السلة</SelectItem>
                    <SelectItem value="checkout">الدفع</SelectItem>
                    <SelectItem value="contact">تواصل معنا</SelectItem>
                    <SelectItem value="custom">صفحات مخصصة</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              {settings.visibility === 'custom' && (
                <Field label="الصفحات المخصصة" hint="اختر الصفحات التي يظهر فيها الزر.">
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: 'home', label: 'الرئيسية' },
                      { key: 'shop', label: 'المتجر' },
                      { key: 'product', label: 'المنتج' },
                      { key: 'cart', label: 'السلة' },
                      { key: 'checkout', label: 'الدفع' },
                      { key: 'contact', label: 'تواصل' },
                      { key: 'about', label: 'من نحن' },
                      { key: 'wishlist', label: 'المفضلة' },
                    ].map((p) => {
                      const active = settings.customPages.includes(p.key)
                      return (
                        <button
                          key={p.key}
                          type="button"
                          onClick={() =>
                            update(
                              'customPages',
                              active
                                ? settings.customPages.filter((x) => x !== p.key)
                                : [...settings.customPages, p.key],
                            )
                          }
                          className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                            active
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-border bg-background hover:bg-muted'
                          }`}
                        >
                          {p.label}
                        </button>
                      )
                    })}
                  </div>
                </Field>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <SwitchRow label="إخفاء على الموبايل" checked={settings.hideOnMobile} onChange={(v) => update('hideOnMobile', v)} />
                <SwitchRow label="إخفاء على سطح المكتب" checked={settings.hideOnDesktop} onChange={(v) => update('hideOnDesktop', v)} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <SliderField label="الظهور بعد التمرير" value={settings.showAfterScroll} min={0} max={2000} step={50} onChange={(v) => update('showAfterScroll', v)} />
                <SliderField label="تأخير الظهور" value={settings.delaySeconds} min={0} max={30} unit="ث" onChange={(v) => update('delaySeconds', v)} />
              </div>
            </TabsContent>

            {/* Devices */}
            <TabsContent value="devices" className="mt-4 space-y-6">
              <div className="space-y-3">
                <h3 className="flex items-center gap-2 font-semibold">
                  <Smartphone className="h-4 w-4" /> إعدادات الموبايل
                </h3>
                <Field label="طريقة العرض">
                  <Select value={settings.mobileDisplay} onValueChange={(v) => update('mobileDisplay', v as WhatsAppSettings['mobileDisplay'])}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="icon">أيقونة فقط</SelectItem>
                      <SelectItem value="icon-text">أيقونة + نص</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <SliderField label="حجم مختلف للموبايل (0 = افتراضي)" value={settings.mobileSize} min={0} max={120} onChange={(v) => update('mobileSize', v)} />
              </div>

              <Separator />

              <div className="space-y-3">
                <h3 className="flex items-center gap-2 font-semibold">
                  <Monitor className="h-4 w-4" /> إعدادات سطح المكتب
                </h3>
                <Field label="طريقة العرض">
                  <Select value={settings.desktopDisplay} onValueChange={(v) => update('desktopDisplay', v as WhatsAppSettings['desktopDisplay'])}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="icon">أيقونة فقط</SelectItem>
                      <SelectItem value="icon-text">أيقونة + نص</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <SliderField label="عرض مخصص (0 = تلقائي)" value={settings.desktopWidth} min={0} max={400} onChange={(v) => update('desktopWidth', v)} />
                  <SliderField label="ارتفاع مخصص (0 = افتراضي)" value={settings.desktopHeight} min={0} max={120} onChange={(v) => update('desktopHeight', v)} />
                </div>
              </div>
            </TabsContent>

            {/* Analytics */}
            <TabsContent value="analytics" className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">إحصائيات النقر</h3>
                <Button variant="outline" size="sm" onClick={loadAnalytics}>
                  <RefreshCw className="ml-2 h-4 w-4" /> تحديث
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard label="إجمالي النقرات" value={analytics?.total ?? 0} />
                <StatCard label="اليوم" value={analytics?.today ?? 0} />
                <StatCard label="آخر 7 أيام" value={analytics?.week ?? 0} />
                <StatCard label="آخر 30 يوم" value={analytics?.month ?? 0} />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4" /> آخر نقرة
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    {analytics?.lastClickedAt
                      ? new Date(analytics.lastClickedAt).toLocaleString('ar-EG')
                      : 'لا توجد نقرات بعد'}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <MousePointerClick className="h-4 w-4" /> حسب الجهاز
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">موبايل</span>
                      <span className="font-medium">{analytics?.devices.mobile ?? 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">سطح المكتب</span>
                      <span className="font-medium">{analytics?.devices.desktop ?? 0}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">الصفحات الأكثر نقراً</CardTitle>
                </CardHeader>
                <CardContent>
                  {analytics && analytics.topPages.length > 0 ? (
                    <div className="space-y-1.5">
                      {analytics.topPages.map((p) => (
                        <div key={p.page} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{p.page}</span>
                          <span className="font-medium">{p.count}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">لا توجد بيانات بعد.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* ---------------- Live Preview ---------------- */}
        <div className="lg:col-span-1">
          <div className="sticky top-20 space-y-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">معاينة مباشرة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex rounded-md border border-border p-0.5">
                    <button
                      type="button"
                      onClick={() => setPreviewDevice('desktop')}
                      className={`rounded px-2 py-1 text-xs ${previewDevice === 'desktop' ? 'bg-primary text-primary-foreground' : ''}`}
                    >
                      سطح المكتب
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewDevice('mobile')}
                      className={`rounded px-2 py-1 text-xs ${previewDevice === 'mobile' ? 'bg-primary text-primary-foreground' : ''}`}
                    >
                      موبايل
                    </button>
                  </div>
                  <div className="flex rounded-md border border-border p-0.5">
                    <button
                      type="button"
                      onClick={() => setPreviewLang('ar')}
                      className={`rounded px-2 py-1 text-xs ${previewLang === 'ar' ? 'bg-primary text-primary-foreground' : ''}`}
                    >
                      عربي
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewLang('en')}
                      className={`rounded px-2 py-1 text-xs ${previewLang === 'en' ? 'bg-primary text-primary-foreground' : ''}`}
                    >
                      EN
                    </button>
                  </div>
                </div>

                {/* Mock viewport with the button placed in the chosen corner. */}
                <div className="relative h-72 w-full overflow-hidden rounded-lg border border-dashed border-border bg-[linear-gradient(45deg,transparent_48%,rgba(0,0,0,0.04)_50%,transparent_52%)] bg-muted/40">
                  <div className="absolute" style={previewCornerStyle}>
                    {settings.enabled ? (
                      <WhatsAppButtonView
                        settings={settings}
                        lang={previewLang}
                        device={previewDevice}
                        asButton
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground">الزر مُعطّل</span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  تظهر التغييرات هنا فوراً. اضغط &laquo;حفظ التغييرات&raquo; لنشرها على الموقع.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-2xl font-bold">{value.toLocaleString('ar-EG')}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  )
}

export default AdminWhatsApp
