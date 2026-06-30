import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// Default settings
const defaultSettings: Record<string, { value: string; type: string }> = {
  // General
  site_name_ar: { value: 'استآر', type: 'text' },
  site_name_en: { value: 'Astar', type: 'text' },
  site_tagline_ar: { value: 'أناقة محتشمة بلمسة عصرية', type: 'text' },
  site_tagline_en: { value: 'Elegant Modest Fashion', type: 'text' },
  site_description_ar: { value: '', type: 'text' },
  site_description_en: { value: '', type: 'text' },
  site_logo: { value: '', type: 'text' },
  site_favicon: { value: '/favicon.svg', type: 'text' },
  default_language: { value: 'ar', type: 'text' },
  default_currency: { value: 'EGP', type: 'text' },
  currency_symbol: { value: 'ج.م', type: 'text' },
  currency: { value: 'ج.م', type: 'text' },
  currency_en: { value: 'EGP', type: 'text' },
  price_format: { value: '#,###.## ج.م', type: 'text' },
  
  // Visual Identity
  primary_color: { value: '#C4A4A4', type: 'text' },
  secondary_color: { value: '#9B6B6B', type: 'text' },
  button_color: { value: '#C4A4A4', type: 'text' },
  background_color: { value: '#FFFBF9', type: 'text' },
  font_family: { value: 'Cairo', type: 'text' },
  font_size: { value: '16', type: 'number' },
  
  // Homepage
  hero_title_ar: { value: 'اكتشفي أناقتكِ المحتشمة', type: 'text' },
  hero_title_en: { value: 'Discover Your Modest Elegance', type: 'text' },
  hero_subtitle_ar: { value: 'تشكيلة مميزة من الملابس المحتشمة والحجابات العصرية', type: 'text' },
  hero_subtitle_en: { value: 'Curated collection of modest fashion and modern hijabs', type: 'text' },
  hero_image: { value: '', type: 'text' },
  hero_image_mobile: { value: '', type: 'text' },
  hero_button_text_ar: { value: 'تسوقي الآن', type: 'text' },
  hero_button_text_en: { value: 'Shop Now', type: 'text' },
  featured_products_count: { value: '8', type: 'number' },
  show_testimonials: { value: 'true', type: 'boolean' },
  show_newsletter: { value: 'true', type: 'boolean' },
  hero_subtitle_ar_2: { value: '', type: 'text' },
  hero_subtitle_en_2: { value: '', type: 'text' },
  
  // Store
  products_per_page: { value: '12', type: 'number' },
  enable_wishlist: { value: 'true', type: 'boolean' },
  enable_compare: { value: 'false', type: 'boolean' },
  enable_reviews: { value: 'true', type: 'boolean' },
  enable_related_products: { value: 'true', type: 'boolean' },
  
  // Payment Methods
  payment_cod_enabled: { value: 'true', type: 'boolean' },
  payment_cod_fee: { value: '0', type: 'number' },
  payment_fawry_enabled: { value: 'false', type: 'boolean' },
  payment_fawry_merchant_code: { value: '', type: 'text' },
  payment_fawry_security_key: { value: '', type: 'text' },
  payment_vodafonecash_enabled: { value: 'false', type: 'boolean' },
  payment_vodafonecash_number: { value: '', type: 'text' },
  payment_paymob_enabled: { value: 'false', type: 'boolean' },
  payment_paymob_key: { value: '', type: 'text' },
  payment_stripe_enabled: { value: 'false', type: 'boolean' },
  payment_stripe_key: { value: '', type: 'text' },
  
  // Shipping
  free_shipping_threshold: { value: '2000', type: 'number' },
  default_shipping_cost: { value: '50', type: 'number' },
  
  // Tax
  tax_enabled: { value: 'false', type: 'boolean' },
  tax_rate: { value: '15', type: 'number' },
  
  // SEO
  seo_title: { value: 'Astar - استآر | أزياء محتشمة عصرية', type: 'text' },
  seo_description: { value: 'اكتشفي أحدث تشكيلة من الملابس المحتشمة والحجابات العصرية.', type: 'text' },
  seo_keywords: { value: 'عبايات، حجاب، ملابس محتشمة', type: 'text' },
  og_image: { value: '', type: 'text' },
  
  // Performance
  cache_enabled: { value: 'true', type: 'boolean' },
  lazy_load_images: { value: 'true', type: 'boolean' },
  
  // Maintenance
  maintenance_mode: { value: 'false', type: 'boolean' },
  maintenance_message_ar: { value: 'الموقع تحت الصيانة، يرجى المحاولة لاحقاً', type: 'text' },
  maintenance_message_en: { value: 'Site is under maintenance, please try again later', type: 'text' },
  
  // Analytics
  google_analytics_id: { value: '', type: 'text' },
  facebook_pixel_id: { value: '', type: 'text' },
  tiktok_pixel_id: { value: '', type: 'text' },
  
  // Contact
  site_email: { value: 'info@estar.com', type: 'text' },
  site_phone: { value: '+20 100 000 0000', type: 'text' },
  site_whatsapp: { value: '+201000000000', type: 'text' },
  site_address_ar: { value: 'القاهرة، مصر', type: 'text' },
  site_address_en: { value: 'Cairo, Egypt', type: 'text' },
  working_hours_ar: { value: 'السبت - الخميس: 9 صباحاً - 10 مساءً', type: 'text' },
  working_hours_en: { value: 'Sat - Thu: 9 AM - 10 PM', type: 'text' },
  
  // Social
  social_instagram: { value: '', type: 'text' },
  social_twitter: { value: '', type: 'text' },
  social_facebook: { value: '', type: 'text' },
  social_tiktok: { value: '', type: 'text' },
  social_snapchat: { value: '', type: 'text' },
  
  // Footer
  footer_about_ar: { value: 'استآر - وجهتك الأولى للأزياء المحتشمة العصرية.', type: 'text' },
  footer_about_en: { value: 'Astar - Your destination for modern modest fashion.', type: 'text' },
  footer_logo: { value: '', type: 'text' },
  
  // Announcement
  announcement_text_ar: { value: 'شحن مجاني للطلبات أكثر من 2000 جنيه', type: 'text' },
  announcement_text_en: { value: 'Free shipping on orders over 2000 EGP', type: 'text' },
  announcement_enabled: { value: 'true', type: 'boolean' },
};

// GET /api/settings - Get public settings
export async function GET() {
  try {
    const settings = await db.setting.findMany();
    
    // Create a map of existing settings
    const settingsMap: Record<string, string> = {};
    settings.forEach(s => {
      settingsMap[s.key] = s.value;
    });
    
    // Merge with defaults and return only values
    const result: Record<string, string> = {};
    Object.entries(defaultSettings).forEach(([key, config]) => {
      result[key] = settingsMap[key] ?? config.value;
    });
    
    return NextResponse.json({ settings: result });
  } catch (error) {
    console.error('Error fetching settings:', error);
    // Return defaults on error
    const result: Record<string, string> = {};
    Object.entries(defaultSettings).forEach(([key, config]) => {
      result[key] = config.value;
    });
    return NextResponse.json({ settings: result });
  }
}
