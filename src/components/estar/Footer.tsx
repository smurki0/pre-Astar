'use client'

import * as React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Instagram,
  Facebook,
  Twitter,
  Mail,
  Phone,
  MapPin,
  Send,
  MessageCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { useLanguage } from '@/lib/i18n'
import { useSiteSettings } from '@/hooks/useSiteSettings'
import { cn } from '@/lib/utils'
import { csrfFetch } from '@/lib/csrf-fetch'

const quickLinks = [
  { key: 'home', view: 'home', labelAr: 'الرئيسية', labelEn: 'Home' },
  { key: 'shop', view: 'shop', labelAr: 'المتجر', labelEn: 'Shop' },
  { key: 'about', view: 'about', labelAr: 'من نحن', labelEn: 'About' },
  { key: 'contact', view: 'contact', labelAr: 'تواصل معنا', labelEn: 'Contact' },
]

const customerServiceLinks = [
  { view: 'contact', labelAr: 'الأسئلة الشائعة', labelEn: 'FAQ' },
  { view: 'contact', labelAr: 'معلومات الشحن', labelEn: 'Shipping Info' },
  { view: 'contact', labelAr: 'سياسة الإرجاع', labelEn: 'Returns' },
  { view: 'about', labelAr: 'سياسة الخصوصية', labelEn: 'Privacy Policy' },
  { view: 'about', labelAr: 'الشروط والأحكام', labelEn: 'Terms of Service' },
]

export function Footer() {
  const { language, isRTL, dir } = useLanguage()
  const { settings } = useSiteSettings()
  const [email, setEmail] = React.useState('')
  const [subscribed, setSubscribed] = React.useState(false)
  const [subscribing, setSubscribing] = React.useState(false)
  
  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    
    setSubscribing(true)
    try {
      const response = await csrfFetch('/api/admin/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      
      if (response.ok) {
        setSubscribed(true)
        setEmail('')
        setTimeout(() => setSubscribed(false), 3000)
      } else {
        const data = await response.json()
        if (data.error === 'Subscriber already exists') {
          setSubscribed(true)
          setEmail('')
          setTimeout(() => setSubscribed(false), 3000)
        }
      }
    } catch (error) {
      // Handle error silently
    } finally {
      setSubscribing(false)
    }
  }
  
  // Get social links from settings
  const socialLinks = [
    { name: 'Instagram', icon: Instagram, href: settings.social_instagram || 'https://instagram.com' },
    { name: 'Facebook', icon: Facebook, href: settings.social_facebook || 'https://facebook.com' },
    { name: 'Twitter', icon: Twitter, href: settings.social_twitter || 'https://twitter.com' },
    // { name: 'TikTok', icon: MessageCircle, href: settings.social_tiktok || 'https://tiktok.com' },
  ].filter(link => link.href)
  
  return (
    <footer className="bg-secondary/30 border-t border-border" dir={dir}>
      {/* Newsletter Section */}
      <div className="bg-primary/5">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className={cn("text-center md:text-start", isRTL && "md:text-end")}>
              <h3 className="text-xl md:text-2xl font-semibold text-foreground">
                {language === 'ar' ? 'اشتركي في نشرتنا البريدية' : 'Subscribe to Our Newsletter'}
              </h3>
              <p className="text-muted-foreground mt-2 max-w-md">
                {language === 'ar' 
                  ? 'احصلي على عروض حصرية ونصائح جمالية وخصم 10% على طلبك الأول'
                  : 'Get exclusive offers, beauty tips, and 10% off your first order'}
              </p>
            </div>
            
            <form onSubmit={handleSubscribe} className="flex w-full md:w-auto gap-2 max-w-md">
              <Input
                type="email"
                placeholder={language === 'ar' ? 'بريدك الإلكتروني' : 'Your email'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-background"
                required
              />
              <Button type="submit" className="shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground" disabled={subscribing}>
                {subscribed ? (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center gap-1"
                  >
                    <Send className="h-4 w-4" />
                    {language === 'ar' ? 'تم الاشتراك!' : 'Subscribed!'}
                  </motion.span>
                ) : subscribing ? (
                  <span className="flex items-center gap-1">
                    <Send className="h-4 w-4 animate-pulse" />
                    {language === 'ar' ? 'جاري...' : 'Loading...'}
                  </span>
                ) : (
                  <>
                    <Send className="h-4 w-4 me-1" />
                    <span className="hidden sm:inline">
                      {language === 'ar' ? 'اشتراك' : 'Subscribe'}
                    </span>
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
      
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Section */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/?view=home" className="inline-flex items-center gap-2 mb-4">
              <span className="text-2xl text-primary font-semibold">
                {settings.site_name_en || 'Astar'}
              </span>
              <span className="text-lg text-gray-600">
                {settings.site_name_ar || 'استآر'}
              </span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
              {language === 'ar' 
                ? (settings.footer_about_ar || 'متجر استآر للملابس المحتشمة والأنيقة.')
                : (settings.footer_about_en || 'Astar - Your destination for modern modest fashion.')}
            </p>
            
            {/* Contact Info */}
            <div className="space-y-3">
              {settings.site_email && (
                <a
                  href={`mailto:${settings.site_email}`}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <Mail className="h-4 w-4 text-primary" />
                  <span>{settings.site_email}</span>
                </a>
              )}
              {settings.site_phone && (
                <a
                  href={`tel:${settings.site_phone.replace(/\s/g, '')}`}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <Phone className="h-4 w-4 text-primary" />
                  <span dir="ltr">{settings.site_phone}</span>
                </a>
              )}
              {settings.site_whatsapp && (
                <a
                  href={`https://wa.me/${settings.site_whatsapp.replace(/\+/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <MessageCircle className="h-4 w-4 text-primary" />
                  <span>WhatsApp</span>
                </a>
              )}
              {(settings.site_address_ar || settings.site_address_en) && (
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>
                    {language === 'ar' ? settings.site_address_ar : settings.site_address_en}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">
              {language === 'ar' ? 'روابط سريعة' : 'Quick Links'}
            </h4>
            <ul className="space-y-2">
              {quickLinks.map((link, index) => (
                <motion.li
                  key={link.key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    href={`/?view=${link.view}`}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {language === 'ar' ? link.labelAr : link.labelEn}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </div>
          
          {/* Customer Service */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">
              {language === 'ar' ? 'خدمة العملاء' : 'Customer Service'}
            </h4>
            <ul className="space-y-2">
              {customerServiceLinks.map((link, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 + 0.2 }}
                >
                  <Link
                    href={`/?view=${link.view}`}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {language === 'ar' ? link.labelAr : link.labelEn}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </div>
          
          {/* Social & Follow */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">
              {language === 'ar' ? 'تابعينا' : 'Follow Us'}
            </h4>
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <social.icon className="h-5 w-5" />
                  <span className="sr-only">{social.name}</span>
                </motion.a>
              ))}
            </div>
            
            {/* Working Hours */}
            {(settings.working_hours_ar || settings.working_hours_en) && (
              <div className="mt-6">
                <p className="text-sm text-muted-foreground mb-1">
                  {language === 'ar' ? 'ساعات العمل' : 'Working Hours'}
                </p>
                <p className="text-sm text-foreground">
                  {language === 'ar' ? settings.working_hours_ar : settings.working_hours_en}
                </p>
              </div>
            )}
            
            {/* Payment Methods */}
            <div className="mt-6">
              <p className="text-sm text-muted-foreground mb-3">
                {language === 'ar' ? 'طرق الدفع' : 'Payment Methods'}
              </p>
              <div className="flex gap-2">
                <div className="w-12 h-8 rounded bg-background border border-border flex items-center justify-center text-xs font-medium">
                  Visa
                </div>
                <div className="w-12 h-8 rounded bg-background border border-border flex items-center justify-center text-xs font-medium">
                  MC
                </div>
                <div className="w-12 h-8 rounded bg-background border border-border flex items-center justify-center text-xs font-medium">
                 Paymob
                </div>
                <div className="w-12 h-8 rounded bg-background border border-border flex items-center justify-center text-xs font-medium">
                  فودافون
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Copyright */}
      <div className="border-t border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>
              © {new Date().getFullYear()} {settings.site_name_en || 'Astar'}. {language === 'ar' ? 'جميع الحقوق محفوظة' : 'All rights reserved'}
            </p>
            <div className="flex items-center gap-4">
              <Link href="/?view=about" className="hover:text-primary transition-colors">
                {language === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy'}
              </Link>
              <Link href="/?view=about" className="hover:text-primary transition-colors">
                {language === 'ar' ? 'الشروط والأحكام' : 'Terms of Service'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
