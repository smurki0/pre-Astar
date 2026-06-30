'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import {
  Heart,
  Sparkles,
  Users,
  Target,
  Award,
  Globe,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useLanguage } from '@/lib/i18n'
import { cn } from '@/lib/utils'

const teamMembers = [
  {
    nameEn: 'M/Abdallah Gaber',
    nameAr: 'م/عبدالله جابر',
    roleEn: 'Founder & CEO',
    roleAr: 'المؤسس والرئيس التنفيذي',
    image: 'https://i.postimg.cc/h4bzjMfd/man-in-suit-and-tie.png',
  },
  {
    nameEn: 'Eng/Mohammed Ebrahim',
    nameAr: ' المهندس محمد إبراهيم',
    roleEn: 'Software Engineer',
    roleAr: 'مهندس برمجيات ',
    image: 'https://i.postimg.cc/QdqWymZR/owner-(1).png',
  },
  {
    nameEn: 'Noor Ahmed',
    nameAr: 'نور أحمد',
    roleEn: 'Head of Production',
    roleAr: 'رئيسة الإنتاج',
    image: '/images/team-3.jpg',
  },
  {
    nameEn: 'Fatima Ali',
    nameAr: 'فاطمة علي',
    roleEn: 'Customer Experience',
    roleAr: 'تجربة العملاء',
    image: '/images/team-4.jpg',
  },
]

const values = [
  {
    icon: Heart,
    titleEn: 'Modesty First',
    titleAr: 'الاحتشام أولاً',
    descEn: 'We believe that modesty and style can coexist beautifully.',
    descAr: 'نؤمن بأن الاحتشام والأناقة يمكن أن يتعايشا بجمال.',
  },
  {
    icon: Sparkles,
    titleEn: 'Quality Craftsmanship',
    titleAr: 'حرفية عالية الجودة',
    descEn: 'Every piece is crafted with attention to detail and premium materials.',
    descAr: 'كل قطعة مصممة باهتمام بالتفاصيل ومواد عالية الجودة.',
  },
  {
    icon: Users,
    titleEn: 'Community Focus',
    titleAr: 'التركيز على المجتمع',
    descEn: 'Building a supportive community of confident, stylish women.',
    descAr: 'بناء مجتمع داعم من النساء الواثقات والأنيقات.',
  },
  {
    icon: Globe,
    titleEn: 'Global Reach',
    titleAr: 'انتشار عالمي',
    descEn: 'Bringing elegant modest fashion to women worldwide.',
    descAr: 'جلب الأزياء المحتشمة الأنيقة للنساء حول العالم.',
  },
]

const galleryImages = [
  { src: '/images/gallery-1.jpg', altEn: 'Elegant abaya collection', altAr: 'مجموعة عبايات أنيقة' },
  { src: '/images/gallery-2.jpg', altEn: 'Modern hijab styles', altAr: 'أشكال حجاب عصرية' },
  { src: '/images/gallery-3.jpg', altEn: 'Premium fabric details', altAr: 'تفاصيل الأقمشة الفاخرة' },
  { src: '/images/gallery-4.jpg', altEn: 'Studio photoshoot', altAr: 'تصوير الاستوديو' },
  { src: '/images/gallery-5.jpg', altEn: 'New arrivals showcase', altAr: 'عرض الوصول الجديد' },
  { src: '/images/gallery-6.jpg', altEn: 'Seasonal collection', altAr: 'مجموعة الموسم' },
]

export function AboutPage() {
  const { language, isRTL, dir } = useLanguage()

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      {/* Hero Section */}
      <section className="relative bg-gradient-hero py-20 md:py-32">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-foreground mb-6">
              {language === 'ar' ? 'قصتنا' : 'Our Story'}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              {language === 'ar'
                ? 'استآر - حيث تلتقي الأناقة بالاحتشام. نحن ملتزمون بتقديم أزياء راقية ومحتشمة للمرأة العصرية.'
                : 'Astar – where elegance meets modesty. We are committed to providing elegant, modest fashion for the modern woman.'}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Brand Story Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className={cn(isRTL && "lg:order-2")}
            >
              <div className="relative">
                <div className="aspect-[4/5] rounded-2xl bg-secondary/50 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent" />
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center p-8">
                      <span className="font-serif text-6xl md:text-8xl text-primary">A</span>
                      <p className="mt-4 text-muted-foreground text-lg font-arabic">استآر</p>
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-6 -end-6 w-32 h-32 bg-primary/10 rounded-full -z-10" />
                <div className="absolute -top-6 -start-6 w-24 h-24 bg-accent/30 rounded-full -z-10" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className={cn("space-y-6", isRTL && "lg:order-1 text-end")}
            >
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground">
                {language === 'ar' ? 'بدايتنا' : 'Our Beginning'}
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  {language === 'ar'
                    ? 'تأسست استآر في عام 2020 برؤية واضحة: توفير ملابس محتشمة وأنيقة للمرأة المعاصرة التي تبحث عن التوازن بين الأناقة والحياء.'
                    : 'Astar was founded in 2020 with a clear vision: to provide modest, elegant clothing for the contemporary woman seeking balance between style and modesty.'}
                </p>
                <p>
                  {language === 'ar'
                    ? 'بدأنا كمتجر صغير في الرياض، واليوم نخدم آلاف النساء في جميع أنحاء العالم العربي وخارجه. نفتخر بتصاميمنا الفريدة التي تجمع بين الأصالة والحداثة.'
                    : 'We started as a small shop in Riyadh, and today we serve thousands of women across the Arab world and beyond. We take pride in our unique designs that blend tradition with modernity.'}
                </p>
                <p>
                  {language === 'ar'
                    ? 'كل قطعة في مجموعتنا مصممة بعناية فائقة، مع التركيز على الجودة والراحة والأناقة. نستخدم أجود الأقمشة ونحرص على كل تفصيلة صغيرة.'
                    : 'Every piece in our collection is meticulously designed, focusing on quality, comfort, and elegance. We use the finest fabrics and pay attention to every small detail.'}
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 md:py-24 bg-secondary/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">
              {language === 'ar' ? 'رسالتنا ورؤيتنا' : 'Our Mission & Vision'}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {language === 'ar'
                ? 'نسعى لتمكين المرأة من التعبير عن نفسها بثقة وأناقة من خلال ملابس محتشمة عالية الجودة.'
                : 'We strive to empower women to express themselves with confidence and elegance through high-quality modest clothing.'}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <Card className="h-full border-0 shadow-lg bg-card">
                <CardContent className="p-8">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                    <Target className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-4">
                    {language === 'ar' ? 'رسالتنا' : 'Our Mission'}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {language === 'ar'
                      ? 'توفير أزياء محتشمة راقية تجمع بين الأناقة والجودة والراحة، مع الالتزام بأعلى معايير الخدمة والاهتمام بتفضيلات عملائنا.'
                      : 'To provide elegant modest fashion that combines style, quality, and comfort, while adhering to the highest standards of service and attention to our customers\' preferences.'}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="h-full border-0 shadow-lg bg-card">
                <CardContent className="p-8">
                  <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center mb-6">
                    <Award className="h-7 w-7 text-accent-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-4">
                    {language === 'ar' ? 'رؤيتنا' : 'Our Vision'}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {language === 'ar'
                      ? 'أن نكون الوجهة الأولى للأزياء المحتشمة في العالم العربي، وملهمًا للنساء اللواتي يبحثن عن الأناقة بلا تنازلات.'
                      : 'To be the premier destination for modest fashion in the Arab world, and an inspiration for women seeking elegance without compromise.'}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">
              {language === 'ar' ? 'قيمنا' : 'Our Values'}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {language === 'ar'
                ? 'القيم التي توجه كل ما نقوم به في استآر'
                : 'The values that guide everything we do at Astar'}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="h-full text-center border-0 shadow-md hover:shadow-lg transition-shadow bg-card">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <value.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">
                      {language === 'ar' ? value.titleAr : value.titleEn}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {language === 'ar' ? value.descAr : value.descEn}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 md:py-24 bg-secondary/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">
              {language === 'ar' ? 'فريقنا' : 'Our Team'}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {language === 'ar'
                ? 'تقف وراء استآر فريق من النساء الشغوفات بالأزياء والجودة'
                : 'Behind Astar stands a team of women passionate about fashion and quality'}
            </p>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {teamMembers.map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <Avatar className="w-32 h-32 md:w-40 md:h-40 mx-auto mb-4 border-4 border-background shadow-lg">
                  <AvatarImage src={member.image} alt={language === 'ar' ? member.nameAr : member.nameEn} />
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                    {member.nameEn.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <h3 className="font-semibold text-lg">
                  {language === 'ar' ? member.nameAr : member.nameEn}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? member.roleAr : member.roleEn}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">
              {language === 'ar' ? 'معرض الصور' : 'Our Gallery'}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {language === 'ar'
                ? 'لمحات من عالم استآر'
                : 'Glimpses from the world of Astar'}
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {galleryImages.map((image, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group relative aspect-square rounded-xl overflow-hidden bg-secondary/50"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/20" />
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-muted-foreground text-sm">
                    {language === 'ar' ? image.altAr : image.altEn}
                  </span>
                </div>
                <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 md:py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '10K+', labelEn: 'Happy Customers', labelAr: 'عميلة سعيدة' },
              { value: '500+', labelEn: 'Products', labelAr: 'منتج' },
              { value: '15+', labelEn: 'Countries', labelAr: 'دولة' },
              { value: '4.9', labelEn: 'Average Rating', labelAr: 'تقييم متوسط' },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <div className="text-3xl md:text-4xl font-bold mb-2">{stat.value}</div>
                <div className="text-primary-foreground/80 text-sm">
                  {language === 'ar' ? stat.labelAr : stat.labelEn}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
