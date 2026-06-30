'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  Instagram,
  Facebook,
  Twitter,
  MessageCircle,
  ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { useLanguage } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { csrfFetch } from '@/lib/csrf-fetch'

const contactInfo = [
  {
    icon: Mail,
    labelEn: 'Email',
    labelAr: 'البريد الإلكتروني',
    value: 'astaar.hijab@gmail.com',
    href: 'mailto:astaar.hijab@gmail.com',
  },
  {
    icon: Phone,
    labelEn: 'Phone',
    labelAr: 'الهاتف',
    value: '+20 122 361 8815',
    href: 'tel:+201223618815',
  },
  {
    icon: MapPin,
    labelEn: 'Address',
    labelAr: 'العنوان',
    valueEn: 'Alexandria, Egypt',
    valueAr: 'الإسكندرية، مصر',
  },
  {
    icon: Clock,
    labelEn: 'Working Hours',
    labelAr: 'ساعات العمل',
    valueEn: 'Sun - Thu: 11AM - 2PM',
    valueAr: 'الأحد - الخميس: 11ص - 2م',
  },
]

const socialLinks = [
  { name: 'Instagram', icon: Instagram, href: 'https://www.instagram.com/astar.hijab' },
  { name: 'Facebook', icon: Facebook, href: 'https://facebook.com/estar' },
  { name: 'Twitter', icon: Twitter, href: 'https://twitter.com/estar' },
  { name: 'WhatsApp', icon: MessageCircle, href: 'https://wa.me/201223618815' },
]

const faqItems = [
  {
    questionEn: 'What are your shipping options?',
    questionAr: 'ما هي خيارات الشحن المتاحة؟',
    answerEn: 'We offer standard shipping (3-5 business days) and express shipping (1-2 business days) across Arab Republic of Egypt. Free shipping is available for orders over 2000 EGP.',
    answerAr: 'نوفر شحن عادي (3-5 أيام عمل) وشحن سريع (1-2 يوم عمل) في جميع أنحاء حمهوريه مصر العربيه. الشحن مجاني للطلبات فوق 2000 جنيه.',
  },
  {
    questionEn: 'What is your return policy?',
    questionAr: 'ما هي سياسة الإرجاع؟',
    answerEn: 'We accept returns within 7 days of delivery. Items must be unworn, unwashed, and with original tags attached. Sale items are final sale and cannot be returned.',
    answerAr: 'نقبل الإرجاع خلال 14 يوم من الاستلام. يجب أن تكون المنتجات غير مستخدمة وبالعلامات الأصلية. المنتجات المخفضة لا يمكن إرجاعها.',
  },
  {
    questionEn: 'How do I track my order?',
    questionAr: 'كيف أتتبع طلبي؟',
    answerEn: 'Once your order ships, you will receive an email with a tracking number. You can also track your order in the "My Orders" section of your account.',
    answerAr: 'عند شحن طلبك، ستصلك رسالة بريد إلكتروني تحتوي على رقم التتبع. يمكنك أيضاً تتبع طلبك من قسم "طلباتي" في حسابك.',
  },
  {
    questionEn: 'Do you ship internationally?',
    questionAr: 'هل تشحنون دولياً؟',
    answerEn: 'Yes, we ship to most countries in the GCC and select international destinations. Shipping rates and delivery times vary by location.',
    answerAr: 'نعم، نشحن لمعظم دول الخليج ووجهات دولية مختارة. تختلف أسعار وأوقات الشحن حسب الموقع.',
  },
  {
    questionEn: 'How can I change or cancel my order?',
    questionAr: 'كيف يمكنني تعديل أو إلغاء طلبي؟',
    answerEn: 'Orders can be modified or cancelled within 2 hours of placement. Please contact our customer service immediately if you need to make changes.',
    answerAr: 'يمكن تعديل أو إلغاء الطلبات خلال ساعتين من الطلب. يرجى التواصل مع خدمة العملاء فوراً إذا كنت بحاجة لإجراء تغييرات.',
  },
  {
    questionEn: 'What payment methods do you accept?',
    questionAr: 'ما هي طرق الدفع المقبولة؟',
    answerEn: 'We accept all major credit cards (Visa, Mastercard), Mada, Apple Pay, and bank transfers. All payments are processed securely.',
    answerAr: 'نقبل جميع البطاقات الائتمانية الرئيسية (فيزا، ماستركارد)، مدى، Apple Pay، والتحويل البنكي. جميع المدفوعات تتم بشكل آمن.',
  },
]

const subjects = [
  { valueEn: 'General Inquiry', valueAr: 'استفسار عام' },
  { valueEn: 'Order Support', valueAr: 'دعم الطلبات' },
  { valueEn: 'Product Question', valueAr: 'استفسار عن منتج' },
  { valueEn: 'Returns & Exchanges', valueAr: 'الإرجاع والاستبدال' },
  { valueEn: 'Partnership', valueAr: 'الشراكات' },
  { valueEn: 'Other', valueAr: 'أخرى' },
]

export function ContactPage() {
  const { language, isRTL, dir } = useLanguage()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isSubmitted, setIsSubmitted] = React.useState(false)
  const [errorMsg, setErrorMsg] = React.useState('')
  
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMsg('')

    try {
      const response = await csrfFetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setIsSubmitted(true)
        setFormData({ name: '', email: '', phone: '', subject: '', message: '' })
        // Reset success message after 5 seconds
        setTimeout(() => setIsSubmitted(false), 5000)
      } else {
        setErrorMsg(
          data.error ||
            (language === 'ar' ? 'تعذّر إرسال الرسالة' : 'Failed to send message')
        )
      }
    } catch {
      setErrorMsg(
        language === 'ar'
          ? 'تعذّر إرسال الرسالة. حاول مرة أخرى.'
          : 'Failed to send message. Please try again.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      {/* Hero Section */}
      <section className="relative bg-gradient-hero py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">
              {language === 'ar' ? 'اتصل بنا' : 'Contact Us'}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {language === 'ar'
                ? 'نحن هنا لمساعدتك. تواصل معنا وسنرد عليك في أقرب وقت ممكن.'
                : "We're here to help. Get in touch and we'll respond as soon as possible."}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Form & Info Section */}
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-2"
            >
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6 md:p-8">
                  <h2 className="text-2xl font-serif font-semibold mb-6">
                    {language === 'ar' ? 'أرسل لنا رسالة' : 'Send us a message'}
                  </h2>
                  
                  {isSubmitted ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-12"
                    >
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <Send className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">
                        {language === 'ar' ? 'تم إرسال رسالتك!' : 'Message Sent!'}
                      </h3>
                      <p className="text-muted-foreground">
                        {language === 'ar'
                          ? 'شكراً لتواصلك معنا. سنرد عليك قريباً.'
                          : 'Thank you for contacting us. We\'ll get back to you soon.'}
                      </p>
                    </motion.div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">
                            {language === 'ar' ? 'الاسم' : 'Name'} *
                          </Label>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder={language === 'ar' ? 'أدخل اسمك' : 'Enter your name'}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">
                            {language === 'ar' ? 'البريد الإلكتروني' : 'Email'} *
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder={language === 'ar' ? 'أدخل بريدك الإلكتروني' : 'Enter your email'}
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="phone">
                            {language === 'ar' ? 'رقم الهاتف' : 'Phone'}
                          </Label>
                          <Input
                            id="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder={language === 'ar' ? 'أدخل رقم هاتفك' : 'Enter your phone number'}
                            dir="ltr"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="subject">
                            {language === 'ar' ? 'الموضوع' : 'Subject'} *
                          </Label>
                          <div className="relative">
                            <select
                              id="subject"
                              value={formData.subject}
                              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                              required
                              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 appearance-none"
                            >
                              <option value="">
                                {language === 'ar' ? 'اختر الموضوع' : 'Select subject'}
                              </option>
                              {subjects.map((subject, index) => (
                                <option key={index} value={language === 'ar' ? subject.valueAr : subject.valueEn}>
                                  {language === 'ar' ? subject.valueAr : subject.valueEn}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="message">
                          {language === 'ar' ? 'الرسالة' : 'Message'} *
                        </Label>
                        <Textarea
                          id="message"
                          value={formData.message}
                          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                          placeholder={language === 'ar' ? 'اكتب رسالتك هنا...' : 'Write your message here...'}
                          rows={5}
                          required
                        />
                      </div>

                      {errorMsg && (
                        <p
                          role="alert"
                          className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3"
                        >
                          {errorMsg}
                        </p>
                      )}

                      <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                              className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full me-2"
                            />
                            {language === 'ar' ? 'جاري الإرسال...' : 'Sending...'}
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 me-2" />
                            {language === 'ar' ? 'إرسال الرسالة' : 'Send Message'}
                          </>
                        )}
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Contact Info Sidebar */}
            <motion.div
              initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-6"
            >
              {/* Contact Details */}
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">
                    {language === 'ar' ? 'معلومات التواصل' : 'Contact Information'}
                  </h3>
                  <div className="space-y-4">
                    {contactInfo.map((info, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <info.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className={cn(isRTL && "text-end")}>
                          <p className="text-sm text-muted-foreground">
                            {language === 'ar' ? info.labelAr : info.labelEn}
                          </p>
                          {'href' in info ? (
                            <a
                              href={info.href}
                              className="font-medium hover:text-primary transition-colors"
                              dir={info.icon === Phone ? 'ltr' : undefined}
                            >
                              {info.value}
                            </a>
                          ) : (
                            <p className="font-medium">
                              {language === 'ar' ? info.valueAr : info.valueEn}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Social Links */}
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">
                    {language === 'ar' ? 'تابعنا' : 'Follow Us'}
                  </h3>
                  <div className="flex gap-3">
                    {socialLinks.map((social) => (
                      <motion.a
                        key={social.name}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                      >
                        <social.icon className="h-5 w-5" />
                        <span className="sr-only">{social.name}</span>
                      </motion.a>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-12 bg-secondary/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl font-serif font-semibold text-center mb-6">
              {language === 'ar' ? 'موقعنا' : 'Our Location'}
            </h2>
            <div className="aspect-[16/6] md:aspect-[21/9] rounded-2xl overflow-hidden bg-secondary border border-border">
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/10">
                <div className="text-center">
                  <MapPin className="h-12 w-12 text-primary mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {language === 'ar'
                      ? 'الجمهورية العربية المصرية'
                      : 'Arab Republic of Egypt'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {language === 'ar'
                      ? 'سيتم إضافة خريطة تفاعلية قريباً'
                      : 'Interactive map coming soon'}
                      
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <h2 className="text-2xl md:text-3xl font-serif font-semibold mb-4">
              {language === 'ar' ? 'الأسئلة الشائعة' : 'Frequently Asked Questions'}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {language === 'ar'
                ? 'ابحث عن إجابات للأسئلة الشائعة أو تواصل معنا لمزيد من المساعدة'
                : 'Find answers to common questions or contact us for more help'}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-3xl mx-auto"
          >
            <Accordion type="single" collapsible className="w-full space-y-3">
              {faqItems.map((item, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="bg-card border rounded-lg px-6 data-[state=open]:shadow-md"
                >
                  <AccordionTrigger className="text-start hover:no-underline py-4">
                    <span className="font-medium">
                      {language === 'ar' ? item.questionAr : item.questionEn}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-4">
                    {language === 'ar' ? item.answerAr : item.answerEn}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
