import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';

// Default settings with all fields
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
  timezone: { value: 'Asia/Riyadh', type: 'text' },
  
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
  
  // Store
  products_per_page: { value: '12', type: 'number' },
  enable_wishlist: { value: 'true', type: 'boolean' },
  enable_compare: { value: 'false', type: 'boolean' },
  enable_reviews: { value: 'true', type: 'boolean' },
  enable_related_products: { value: 'true', type: 'boolean' },
  
  // Payment
  payment_stripe_enabled: { value: 'false', type: 'boolean' },
  payment_stripe_key: { value: '', type: 'text' },
  payment_stripe_secret: { value: '', type: 'text' },
  payment_paymob_enabled: { value: 'false', type: 'boolean' },
  payment_paymob_key: { value: '', type: 'text' },
  payment_paymob_secret: { value: '', type: 'text' },
  payment_paymob_integration_id: { value: '', type: 'text' },
  payment_paymob_iframe_id: { value: '', type: 'text' },
  payment_paymob_merchant_profile_id: { value: '', type: 'text' },
  payment_paymob_webhook_secret: { value: '', type: 'password' },
  payment_paymob_allowed_ips: { value: '[]', type: 'textarea' },
  payment_paymob_delivery_needed: { value: 'false', type: 'boolean' },
  payment_paypal_enabled: { value: 'false', type: 'boolean' },
  payment_paypal_client: { value: '', type: 'text' },
  payment_paypal_secret: { value: '', type: 'text' },
  payment_vodafonecash_enabled: { value: 'false', type: 'boolean' },
  payment_vodafonecash_number: { value: '', type: 'text' },
  payment_cod_enabled: { value: 'true', type: 'boolean' },
  payment_cod_fee: { value: '0', type: 'number' },
  
  // Shipping
  free_shipping_threshold: { value: '2000', type: 'number' },
  default_shipping_cost: { value: '50', type: 'number' },
  
  // Tax
  tax_enabled: { value: 'false', type: 'boolean' },
  tax_rate: { value: '15', type: 'number' },
  tax_countries: { value: 'SA,AE,KW', type: 'text' },
  
  // Email
  smtp_host: { value: '', type: 'text' },
  smtp_port: { value: '587', type: 'text' },
  smtp_user: { value: '', type: 'text' },
  smtp_password: { value: '', type: 'text' },
  smtp_from_email: { value: '', type: 'text' },
  smtp_from_name: { value: 'Astar', type: 'text' },
  
  // Notifications
  notify_new_order: { value: 'true', type: 'boolean' },
  notify_new_user: { value: 'true', type: 'boolean' },
  notify_low_stock: { value: 'true', type: 'boolean' },
  notify_order_confirmed: { value: 'true', type: 'boolean' },
  notify_order_shipped: { value: 'true', type: 'boolean' },
  notify_order_delivered: { value: 'true', type: 'boolean' },
  
  // SEO
  seo_title: { value: 'Astar - استآر | أزياء محتشمة عصرية', type: 'text' },
  seo_description: { value: 'اكتشفي أحدث تشكيلة من الملابس المحتشمة والحجابات العصرية.', type: 'text' },
  seo_keywords: { value: 'عبايات، حجاب، ملابس محتشمة', type: 'text' },
  og_image: { value: '', type: 'text' },
  
  // Security
  two_factor_enabled: { value: 'false', type: 'boolean' },
  login_attempts: { value: '5', type: 'number' },
  log_all_actions: { value: 'true', type: 'boolean' },
  
  // Performance
  cache_enabled: { value: 'true', type: 'boolean' },
  lazy_load_images: { value: 'true', type: 'boolean' },
  auto_compress_images: { value: 'true', type: 'boolean' },
  max_upload_size: { value: '5', type: 'number' },
  
  // Backup
  auto_backup: { value: 'true', type: 'boolean' },
  backup_time: { value: '02:00', type: 'text' },
  
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
  site_phone: { value: '+966 50 000 0000', type: 'text' },
  site_whatsapp: { value: '+966500000000', type: 'text' },
  site_address_ar: { value: 'الرياض، المملكة العربية السعودية', type: 'text' },
  site_address_en: { value: 'Riyadh, Saudi Arabia', type: 'text' },
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

// GET /api/admin/settings - Get all settings
export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const settings = await db.setting.findMany();
    
    // Create a map of existing settings
    const settingsMap: Record<string, string> = {};
    settings.forEach(s => {
      settingsMap[s.key] = s.value;
    });
    
    // Merge with defaults
    const result: Record<string, { value: string; type: string }> = {};
    Object.entries(defaultSettings).forEach(([key, config]) => {
      result[key] = {
        value: settingsMap[key] ?? config.value,
        type: config.type,
      };
    });
    
    return NextResponse.json({ settings: result });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/settings - Update settings
export async function PUT(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const { settings } = body;
    
    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { error: 'Invalid settings data' },
        { status: 400 }
      );
    }
    
    // Update each setting
    for (const [key, value] of Object.entries(settings)) {
      const type = defaultSettings[key]?.type || 'text';
      
      await db.setting.upsert({
        where: { key },
        create: { key, value: String(value), type },
        update: { value: String(value) },
      });
    }
    
    return NextResponse.json({ success: true, message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
