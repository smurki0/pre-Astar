/**
 * WhatsApp Chat Button - shared config module.
 *
 * This is the single source of truth for the WhatsApp button configuration
 * shape and defaults. It is deliberately framework-agnostic (no React / no DB
 * imports) so it can be consumed from:
 *   - server route handlers (src/app/api/whatsapp/*)
 *   - the admin dashboard form (AdminWhatsApp)
 *   - the public floating button (WhatsAppButton)
 *   - the client provider (useWhatsAppSettings)
 *
 * Everything the admin can control lives here. Nothing about the button is
 * hardcoded in the UI components - they all read from this config, which is
 * persisted in the existing key/value `Setting` table under WHATSAPP_SETTINGS_KEY.
 */

/** The Setting.key under which the whole config JSON blob is stored. */
export const WHATSAPP_SETTINGS_KEY = 'whatsapp_settings'

export type WhatsAppPosition =
  | 'bottom-right'
  | 'bottom-left'
  | 'top-right'
  | 'top-left'

export type WhatsAppVisibility =
  | 'all'
  | 'home'
  | 'products'
  | 'category'
  | 'checkout'
  | 'cart'
  | 'contact'
  | 'custom'

export type WhatsAppShadow = 'none' | 'sm' | 'md' | 'lg' | 'xl'

export type WhatsAppDisplay = 'icon' | 'icon-text'

export type WhatsAppIcon = 'whatsapp' | 'message' | 'phone'

export type WhatsAppDevice = 'mobile' | 'desktop'

export interface WhatsAppSettings {
  /* -------- General -------- */
  enabled: boolean

  /* -------- Contact -------- */
  phoneNumber: string // full international number, digits only preferred
  messageEn: string
  messageAr: string

  /* -------- Appearance -------- */
  buttonTextEn: string
  buttonTextAr: string
  tooltipTextEn: string
  tooltipTextAr: string
  icon: WhatsAppIcon
  buttonSize: number // px (diameter for icon-only / height for icon+text)
  iconSize: number // px
  borderRadius: number // px
  bgColor: string
  textColor: string
  hoverBgColor: string
  hoverTextColor: string
  shadow: WhatsAppShadow
  pulse: boolean
  hoverAnimation: boolean
  customClass: string

  /* -------- Position -------- */
  position: WhatsAppPosition
  bottomSpacing: number // px (vertical offset from top/bottom edge)
  sideSpacing: number // px (horizontal offset from the near edge)
  mobileSpacing: number // px override applied on mobile (0 = use bottom/side)
  desktopSpacing: number // px override applied on desktop (0 = use bottom/side)
  zIndex: number

  /* -------- Visibility -------- */
  visibility: WhatsAppVisibility
  customPages: string[] // list of view keys when visibility === 'custom'
  hideOnMobile: boolean
  hideOnDesktop: boolean
  showAfterScroll: number // px; 0 = show immediately
  delaySeconds: number // seconds to wait before showing; 0 = immediate

  /* -------- Mobile -------- */
  mobileDisplay: WhatsAppDisplay
  mobileSize: number // px override (0 = inherit buttonSize)

  /* -------- Desktop -------- */
  desktopDisplay: WhatsAppDisplay
  desktopWidth: number // px (0 = auto)
  desktopHeight: number // px (0 = inherit buttonSize)
}

/**
 * Safe defaults. The phone number intentionally reuses the store's existing
 * public WhatsApp number so the button works out-of-the-box, but the admin can
 * override every single field from the dashboard.
 */
export const defaultWhatsAppSettings: WhatsAppSettings = {
  // General
  enabled: false,

  // Contact
  phoneNumber: '',
  messageEn: 'Hello! I have a question about your products.',
  messageAr: 'مرحباً! لدي استفسار عن منتجاتكم.',

  // Appearance
  buttonTextEn: 'Chat with us',
  buttonTextAr: 'تواصل معنا',
  tooltipTextEn: 'Need help? Chat on WhatsApp',
  tooltipTextAr: 'تحتاج مساعدة؟ تواصل عبر واتساب',
  icon: 'whatsapp',
  buttonSize: 60,
  iconSize: 32,
  borderRadius: 50,
  bgColor: '#25D366',
  textColor: '#FFFFFF',
  hoverBgColor: '#1DA851',
  hoverTextColor: '#FFFFFF',
  shadow: 'lg',
  pulse: true,
  hoverAnimation: true,
  customClass: '',

  // Position
  position: 'bottom-right',
  bottomSpacing: 24,
  sideSpacing: 24,
  mobileSpacing: 0,
  desktopSpacing: 0,
  // Below Radix dialog/sheet overlays (z-50) and toasts (z-100) on purpose, so
  // the button never covers the checkout modal, cart drawer, cookie banners or
  // toasts, while still floating above ordinary page content.
  zIndex: 40,

  // Visibility
  visibility: 'all',
  customPages: [],
  hideOnMobile: false,
  hideOnDesktop: false,
  showAfterScroll: 0,
  delaySeconds: 0,

  // Mobile
  mobileDisplay: 'icon',
  mobileSize: 0,

  // Desktop
  desktopDisplay: 'icon',
  desktopWidth: 0,
  desktopHeight: 0,
}

/** Tailwind-independent CSS box-shadow values keyed by intensity. */
export const WHATSAPP_SHADOW_MAP: Record<WhatsAppShadow, string> = {
  none: 'none',
  sm: '0 1px 3px rgba(0,0,0,0.18)',
  md: '0 4px 10px rgba(0,0,0,0.22)',
  lg: '0 8px 20px rgba(0,0,0,0.28)',
  xl: '0 14px 34px rgba(0,0,0,0.34)',
}

const clampNumber = (value: unknown, fallback: number, min: number, max: number): number => {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, n))
}

const asBool = (value: unknown, fallback: boolean): boolean => {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') return value === 'true'
  return fallback
}

const asString = (value: unknown, fallback: string): string =>
  typeof value === 'string' ? value : fallback

const oneOf = <T extends string>(value: unknown, allowed: readonly T[], fallback: T): T =>
  typeof value === 'string' && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback

/** Strip everything that is not a digit; wa.me only accepts bare digits. */
export function sanitizePhone(phone: string): string {
  return (phone || '').replace(/[^\d]/g, '')
}

/**
 * Merge an arbitrary (possibly partial / stringified) settings object with the
 * defaults, coercing and validating every field. Accepts either a parsed object
 * or a raw JSON string (as stored in the DB). Never throws.
 */
export function parseWhatsAppSettings(
  raw: string | Record<string, unknown> | null | undefined,
): WhatsAppSettings {
  let obj: Record<string, unknown> = {}
  if (typeof raw === 'string') {
    try {
      obj = raw.trim() ? (JSON.parse(raw) as Record<string, unknown>) : {}
    } catch {
      obj = {}
    }
  } else if (raw && typeof raw === 'object') {
    obj = raw
  }

  const d = defaultWhatsAppSettings

  return {
    enabled: asBool(obj.enabled, d.enabled),

    phoneNumber: asString(obj.phoneNumber, d.phoneNumber),
    messageEn: asString(obj.messageEn, d.messageEn),
    messageAr: asString(obj.messageAr, d.messageAr),

    buttonTextEn: asString(obj.buttonTextEn, d.buttonTextEn),
    buttonTextAr: asString(obj.buttonTextAr, d.buttonTextAr),
    tooltipTextEn: asString(obj.tooltipTextEn, d.tooltipTextEn),
    tooltipTextAr: asString(obj.tooltipTextAr, d.tooltipTextAr),
    icon: oneOf<WhatsAppIcon>(obj.icon, ['whatsapp', 'message', 'phone'], d.icon),
    buttonSize: clampNumber(obj.buttonSize, d.buttonSize, 40, 120),
    iconSize: clampNumber(obj.iconSize, d.iconSize, 16, 72),
    borderRadius: clampNumber(obj.borderRadius, d.borderRadius, 0, 50),
    bgColor: asString(obj.bgColor, d.bgColor),
    textColor: asString(obj.textColor, d.textColor),
    hoverBgColor: asString(obj.hoverBgColor, d.hoverBgColor),
    hoverTextColor: asString(obj.hoverTextColor, d.hoverTextColor),
    shadow: oneOf<WhatsAppShadow>(obj.shadow, ['none', 'sm', 'md', 'lg', 'xl'], d.shadow),
    pulse: asBool(obj.pulse, d.pulse),
    hoverAnimation: asBool(obj.hoverAnimation, d.hoverAnimation),
    customClass: asString(obj.customClass, d.customClass),

    position: oneOf<WhatsAppPosition>(
      obj.position,
      ['bottom-right', 'bottom-left', 'top-right', 'top-left'],
      d.position,
    ),
    bottomSpacing: clampNumber(obj.bottomSpacing, d.bottomSpacing, 0, 200),
    sideSpacing: clampNumber(obj.sideSpacing, d.sideSpacing, 0, 200),
    mobileSpacing: clampNumber(obj.mobileSpacing, d.mobileSpacing, 0, 200),
    desktopSpacing: clampNumber(obj.desktopSpacing, d.desktopSpacing, 0, 200),
    zIndex: clampNumber(obj.zIndex, d.zIndex, 0, 2147483000),

    visibility: oneOf<WhatsAppVisibility>(
      obj.visibility,
      ['all', 'home', 'products', 'category', 'checkout', 'cart', 'contact', 'custom'],
      d.visibility,
    ),
    customPages: Array.isArray(obj.customPages)
      ? (obj.customPages as unknown[]).filter((p): p is string => typeof p === 'string')
      : d.customPages,
    hideOnMobile: asBool(obj.hideOnMobile, d.hideOnMobile),
    hideOnDesktop: asBool(obj.hideOnDesktop, d.hideOnDesktop),
    showAfterScroll: clampNumber(obj.showAfterScroll, d.showAfterScroll, 0, 100000),
    delaySeconds: clampNumber(obj.delaySeconds, d.delaySeconds, 0, 120),

    mobileDisplay: oneOf<WhatsAppDisplay>(obj.mobileDisplay, ['icon', 'icon-text'], d.mobileDisplay),
    mobileSize: clampNumber(obj.mobileSize, d.mobileSize, 0, 120),

    desktopDisplay: oneOf<WhatsAppDisplay>(
      obj.desktopDisplay,
      ['icon', 'icon-text'],
      d.desktopDisplay,
    ),
    desktopWidth: clampNumber(obj.desktopWidth, d.desktopWidth, 0, 400),
    desktopHeight: clampNumber(obj.desktopHeight, d.desktopHeight, 0, 120),
  }
}

/**
 * Build the wa.me deep link. Returns an empty string when no phone number is
 * configured so callers can decide not to render the button.
 */
export function buildWhatsAppUrl(phoneNumber: string, message?: string): string {
  const phone = sanitizePhone(phoneNumber)
  if (!phone) return ''
  const base = `https://wa.me/${phone}`
  const text = (message || '').trim()
  return text ? `${base}?text=${encodeURIComponent(text)}` : base
}

/**
 * Map the SPA's `view`/`section` query params to a coarse "page kind" used by
 * the visibility rules. The whole storefront lives on `/` and swaps content via
 * ?view=, so page identity comes from the query string, not the pathname.
 */
export function resolvePageKind(view: string | null | undefined): {
  kind: 'home' | 'products' | 'category' | 'cart' | 'checkout' | 'contact' | 'admin' | 'other'
  view: string
} {
  const v = (view || 'home').toLowerCase()
  switch (v) {
    case 'admin':
      return { kind: 'admin', view: v }
    case 'home':
      return { kind: 'home', view: v }
    case 'product':
      return { kind: 'products', view: v }
    case 'shop':
      return { kind: 'category', view: v }
    case 'cart':
      return { kind: 'cart', view: v }
    case 'checkout':
      return { kind: 'checkout', view: v }
    case 'contact':
      return { kind: 'contact', view: v }
    default:
      return { kind: 'other', view: v }
  }
}

/** Decide whether the button is allowed on the given page kind, per settings. */
export function isVisibleOnPage(
  settings: Pick<WhatsAppSettings, 'visibility' | 'customPages'>,
  view: string | null | undefined,
): boolean {
  const { kind, view: v } = resolvePageKind(view)
  // The admin dashboard never shows the customer-facing button.
  if (kind === 'admin') return false

  switch (settings.visibility) {
    case 'all':
      return true
    case 'home':
      return kind === 'home'
    case 'products':
      return kind === 'products'
    case 'category':
      return kind === 'category'
    case 'checkout':
      return kind === 'checkout'
    case 'cart':
      return kind === 'cart'
    case 'contact':
      return kind === 'contact'
    case 'custom':
      return settings.customPages.includes(v)
    default:
      return true
  }
}
