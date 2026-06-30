'use client'

import * as React from 'react'

interface SiteSettings {
  // General
  site_name_ar: string
  site_name_en: string
  site_tagline_ar: string
  site_tagline_en: string
  site_description_ar: string
  site_description_en: string
  site_logo: string
  site_favicon: string
  site_email: string
  site_phone: string
  site_whatsapp: string
  site_address_ar: string
  site_address_en: string
  default_language: string
  
  // Social
  social_instagram: string
  social_twitter: string
  social_facebook: string
  social_tiktok: string
  social_snapchat: string
  
  // Shipping
  free_shipping_threshold: string
  default_shipping_cost: string
  
  // Currency
  default_currency: string
  currency_symbol: string
  currency: string
  currency_en: string
  price_format: string
  
  // Hero
  hero_title_ar: string
  hero_title_en: string
  hero_subtitle_ar: string
  hero_subtitle_en: string
  hero_image: string
  hero_image_mobile: string
  hero_button_text_ar: string
  hero_button_text_en: string
  
  // Homepage
  featured_products_count: string
  show_testimonials: string
  show_newsletter: string
  
  // Footer
  footer_about_ar: string
  footer_about_en: string
  footer_logo: string
  working_hours_ar: string
  working_hours_en: string
  
  // Announcement
  announcement_text_ar: string
  announcement_text_en: string
  announcement_enabled: string
  
  // Visual Identity
  primary_color: string
  secondary_color: string
  button_color: string
  background_color: string
  font_family: string
  font_size: string
  
  // Store
  products_per_page: string
  enable_wishlist: string
  enable_compare: string
  enable_reviews: string
  enable_related_products: string
  
  // Payment Methods
  payment_cod_enabled: string
  payment_cod_fee: string
  payment_fawry_enabled: string
  payment_fawry_merchant_code: string
  payment_fawry_security_key: string
  payment_vodafonecash_enabled: string
  payment_vodafonecash_number: string
  payment_paymob_enabled: string
  payment_paymob_key: string
  payment_stripe_enabled: string
  payment_stripe_key: string
  payment_stripe_secret: string
  payment_paymob_secret: string
  payment_paypal_enabled: string
  payment_paypal_client: string
  payment_paypal_secret: string
  
  // Tax
  tax_enabled: string
  tax_rate: string
  
  // SEO
  seo_title: string
  seo_description: string
  seo_keywords: string
  seo_author?: string
  seo_robots?: string
  seo_revisit_after?: string
  canonical_url?: string
  schema_org_type?: string
  business_name?: string
  business_logo?: string
  // Open Graph
  og_image: string
  og_title?: string
  og_description?: string
  og_type?: string
  // Twitter
  twitter_card?: string
  twitter_site?: string
  twitter_title?: string
  twitter_description?: string
  twitter_image?: string
  // Search engine verification
  google_site_verification?: string
  bing_webmaster_verification?: string
  yandex_verification?: string
  
  // Performance
  cache_enabled: string
  lazy_load_images: string
  
  // Maintenance
  maintenance_mode: string
  maintenance_message_ar: string
  maintenance_message_en: string
  
  // Analytics
  google_analytics_id: string
  facebook_pixel_id: string
  tiktok_pixel_id: string
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
  site_email: 'info@estar.com',
  site_phone: '+20 100 000 0000',
  site_whatsapp: '+201000000000',
  site_address_ar: 'القاهرة، مصر',
  site_address_en: 'Cairo, Egypt',
  default_language: 'ar',
  
  // Social
  social_instagram: '',
  social_twitter: '',
  social_facebook: '',
  social_tiktok: '',
  social_snapchat: '',
  
  // Shipping
  free_shipping_threshold: '2000',
  default_shipping_cost: '50',
  
  // Currency
  default_currency: 'EGP',
  currency_symbol: 'ج.م',
  currency: 'ج.م',
  currency_en: 'EGP',
  price_format: '#,###.## ج.م',
  
  // Hero
  hero_title_ar: 'اكتشفي أناقتكِ المحتشمة',
  hero_title_en: 'Discover Your Modest Elegance',
  hero_subtitle_ar: 'تشكيلة مميزة من الملابس المحتشمة والحجابات العصرية',
  hero_subtitle_en: 'Curated collection of modest fashion and modern hijabs',
  hero_image: '',
  hero_image_mobile: '',
  hero_button_text_ar: 'تسوقي الآن',
  hero_button_text_en: 'Shop Now',
  
  // Homepage
  featured_products_count: '8',
  show_testimonials: 'true',
  show_newsletter: 'true',
  
  // Footer
  footer_about_ar: 'استآر - وجهتك الأولى للأزياء المحتشمة العصرية.',
  footer_about_en: 'Astar - Your destination for modern modest fashion.',
  footer_logo: '',
  working_hours_ar: 'السبت - الخميس: 9 صباحاً - 10 مساءً',
  working_hours_en: 'Sat - Thu: 9 AM - 10 PM',
  
  // Announcement
  announcement_text_ar: 'شحن مجاني للطلبات أكثر من 2000 جنيه',
  announcement_text_en: 'Free shipping on orders over 2000 EGP',
  announcement_enabled: 'true',
  
  // Visual Identity
  primary_color: '#C4A4A4',
  secondary_color: '#9B6B6B',
  button_color: '#C4A4A4',
  background_color: '#FFFBF9',
  font_family: 'Cairo',
  font_size: '16',
  
  // Store
  products_per_page: '12',
  enable_wishlist: 'true',
  enable_compare: 'true',
  enable_reviews: 'true',
  enable_related_products: 'true',
  
  // Payment Methods
  payment_cod_enabled: 'true',
  payment_cod_fee: '0',
  payment_fawry_enabled: 'false',
  payment_fawry_merchant_code: '',
  payment_fawry_security_key: '',
  payment_vodafonecash_enabled: 'false',
  payment_vodafonecash_number: '',
  payment_paymob_enabled: 'false',
  payment_paymob_key: '',
  payment_stripe_enabled: 'false',
  payment_stripe_key: '',
  payment_stripe_secret: '',
  payment_paymob_secret: '',
  payment_paypal_enabled: 'false',
  payment_paypal_client: '',
  payment_paypal_secret: '',
  
  // Tax
  tax_enabled: 'false',
  tax_rate: '15',
  
  // SEO
  seo_title: 'Astar - استآر | أزياء محتشمة عصرية',
  seo_description: 'اكتشفي أحدث تشكيلة من الملابس المحتشمة والحجابات العصرية.',
  seo_keywords: 'عبايات، حجاب، ملابس محتشمة',
  og_image: '',
  
  // Performance
  cache_enabled: 'true',
  lazy_load_images: 'true',
  
  // Maintenance
  maintenance_mode: 'false',
  maintenance_message_ar: 'الموقع تحت الصيانة، يرجى المحاولة لاحقاً',
  maintenance_message_en: 'Site is under maintenance, please try again later',
  
  // Analytics
  google_analytics_id: '',
  facebook_pixel_id: '',
  tiktok_pixel_id: '',
}

interface SiteSettingsContextType {
  settings: SiteSettings
  loading: boolean
  refetch: () => Promise<void>
}

const SiteSettingsContext = React.createContext<SiteSettingsContextType>({
  settings: defaultSettings,
  loading: true,
  refetch: async () => {},
})

// Custom event for settings updates
export const SETTINGS_UPDATED_EVENT = 'estar-settings-updated'

export function dispatchSettingsUpdate() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(SETTINGS_UPDATED_EVENT))
    try {
      localStorage.setItem('estar-settings-updated', Date.now().toString())
    } catch (e) {
      console.error('Error setting localStorage:', e)
    }
  }
}

export function SiteSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = React.useState<SiteSettings>(defaultSettings)
  const [loading, setLoading] = React.useState(true)

  const fetchSettings = React.useCallback(async () => {
    try {
      const response = await fetch('/api/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings({ ...defaultSettings, ...data.settings })
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchSettings()

    const handleSettingsUpdate = () => {
      fetchSettings()
    }

    window.addEventListener(SETTINGS_UPDATED_EVENT, handleSettingsUpdate)

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'estar-settings-updated') {
        fetchSettings()
      }
    }
    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener(SETTINGS_UPDATED_EVENT, handleSettingsUpdate)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [fetchSettings])

  return (
    <SiteSettingsContext.Provider value={{ settings, loading, refetch: fetchSettings }}>
      {children}
    </SiteSettingsContext.Provider>
  )
}

export function useSiteSettings() {
  const context = React.useContext(SiteSettingsContext)
  if (!context) {
    throw new Error('useSiteSettings must be used within a SiteSettingsProvider')
  }
  return context
}

export default useSiteSettings
