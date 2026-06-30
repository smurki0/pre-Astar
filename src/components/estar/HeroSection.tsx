'use client';

import * as React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { csrfFetch } from '@/lib/csrf-fetch'

interface Banner {
  id: string;
  titleEn: string | null;
  titleAr: string | null;
  subtitleEn: string | null;
  subtitleAr: string | null;
  image: string | null;  // Allow null for invalid images
  link: string | null;
  buttonTextEn: string | null;
  buttonTextAr: string | null;
  active: boolean;
}

// Validate banner image sources before handing them to the carousel.
// The carousel <Image> renders with `unoptimized`, so we are not limited to the
// Next.js remotePatterns whitelist here. We accept:
//   - relative paths served from /public (e.g. admin uploads at /uploads/...)
//   - absolute http(s) URLs (any host)
// and reject anything else (empty, data:, javascript:, etc.).
const isValidImageUrl = (url: string | null | undefined): boolean => {
  if (!url || typeof url !== 'string') return false;

  const trimmed = url.trim();
  if (!trimmed) return false;

  // Relative paths from the public folder / upload endpoint.
  if (trimmed.startsWith('/')) return true;

  // Absolute URLs must be http(s).
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
};

export function HeroSection() {
  const router = useRouter();
  const { language } = useLanguage();
  const { settings } = useSiteSettings();
  const [banners, setBanners] = React.useState<Banner[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);

  // Fetch banners from API
  React.useEffect(() => {
    const fetchBanners = async () => {
      try {
        const response = await csrfFetch('/api/banners?position=hero');
        if (response.ok) {
          const data = await response.json();
          const activeBanners = (data.banners || []).filter((b: Banner) => b.active);
          
          // Validate and filter banners with valid images
          const validatedBanners = activeBanners.map(banner => ({
            ...banner,
            image: isValidImageUrl(banner.image) ? banner.image : null
          }));
          
          setBanners(validatedBanners);
          
          // Debug invalid images
          activeBanners.forEach(banner => {
            if (!isValidImageUrl(banner.image)) {
              console.warn('❌ Invalid banner image URL:', banner.image, '- Banner ID:', banner.id);
            }
          });
        }
      } catch (error) {
        console.error('Failed to fetch banners:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBanners();
  }, []);

  // Handle button click navigation.
  // The admin can enter the link in several shapes; normalise them all so the
  // CTA always navigates somewhere valid instead of pushing a broken route such
  // as "/?view=/shop" (which was the reason the banner button appeared dead).
  const handleButtonClick = (link: string | null | undefined) => {
    const raw = (link ?? '').trim();

    // No link -> default to the shop view.
    if (!raw) {
      router.push('/?view=shop');
      return;
    }

    // Absolute external URL -> open in a new tab.
    if (/^https?:\/\//i.test(raw)) {
      window.open(raw, '_blank', 'noopener,noreferrer');
      return;
    }

    // Already a query string ("?view=shop" or "/?view=shop").
    if (raw.startsWith('?') || raw.startsWith('/?')) {
      router.push(raw.startsWith('/') ? raw : `/${raw}`);
      return;
    }

    const knownViews = ['shop', 'about', 'contact', 'cart', 'checkout'];

    // Internal absolute path ("/shop", "/products/123", ...).
    if (raw.startsWith('/')) {
      const seg = raw.replace(/^\/+/, '').split(/[/?#]/)[0];
      if (knownViews.includes(seg)) {
        router.push(`/?view=${seg}`);
      } else {
        router.push(raw);
      }
      return;
    }

    // Bare keyword ("shop", "about", ...) -> treat as a SPA view param.
    router.push(`/?view=${encodeURIComponent(raw)}`);
  };

  // Carousel events
  React.useEffect(() => {
    if (!api) return;

    const handleSelect = () => {
      setCurrent(api.selectedScrollSnap());
    };

    api.on('select', handleSelect);
    return () => {
      api.off('select', handleSelect);
    };
  }, [api]);

  // Auto-play
  React.useEffect(() => {
    if (!api || banners.length <= 1) return;
    const interval = setInterval(() => {
      api.scrollNext();
    }, 5000);
    return () => clearInterval(interval);
  }, [api, banners.length]);

  // Loading state
  if (loading) {
    return (
      <section className="relative w-full h-[60vh] md:h-[80vh] bg-gradient-to-br from-primary/20 to-secondary animate-pulse">
        <div className="container h-full flex items-center px-4 md:px-8 lg:px-16">
          <div className="max-w-xl space-y-4 md:space-y-6">
            <div className="h-8 w-32 rounded-full bg-primary/30" />
            <div className="h-12 w-64 rounded-lg bg-primary/30" />
            <div className="h-8 w-48 rounded-lg bg-primary/30" />
            <div className="h-6 w-80 rounded-lg bg-primary/30" />
            <div className="h-14 w-40 rounded-full bg-primary/30" />
          </div>
        </div>
      </section>
    );
  }

  // No banners - show default from settings
  if (banners.length === 0) {
    // Get settings values
    const heroTitle = language === 'ar' ? settings.hero_title_ar : settings.hero_title_en;
    const heroSubtitle = language === 'ar' ? settings.hero_subtitle_ar : settings.hero_subtitle_en;
    const heroButtonText = language === 'ar' ? settings.hero_button_text_ar : settings.hero_button_text_en;
    const heroImage = settings.hero_image;

    return (
      <section className="relative w-full h-[60vh] md:h-[80vh]">
        {/* Background Image from settings or gradient */}
        {heroImage ? (
          <div className="absolute inset-0">
            <Image
              src={heroImage}
              alt={heroTitle}
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-black/40" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/80" />
        )}
        
        {!heroImage && <div className="absolute inset-0 bg-black/30" />}
        <div className="relative h-full flex items-center">
          <div className="container px-4 md:px-8 lg:px-16">
            <div className="max-w-xl space-y-4 md:space-y-6 text-white">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm">
                <Sparkles className="h-4 w-4" />
                <span className="text-sm font-medium">Astaar Hijab</span>
              </div>
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold leading-tight">
                {heroTitle}
              </h1>
              <p className="text-base md:text-lg opacity-90 max-w-md">
                {heroSubtitle}
              </p>
              <Button
                size="lg"
                className="rounded-full px-8 py-6 text-base md:text-lg bg-white text-primary hover:bg-white/90 shadow-lg"
                onClick={() => router.push('/?view=shop')}
              >
                {heroButtonText}
              </Button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative w-full overflow-hidden">
      <Carousel
        setApi={setApi}
        opts={{
          loop: true,
          align: 'start',
        }}
        className="w-full"
      >
        <CarouselContent>
          {banners.map((banner, index) => (
            <CarouselItem key={banner.id}>
              <div className="relative h-[60vh] md:h-[80vh] w-full">
                {/* Background Image */}
                <div className="absolute inset-0">
                  {banner.image && isValidImageUrl(banner.image) ? (
                    <Image
                      src={banner.image}
                      alt={language === 'ar' ? (banner.titleAr || '') : (banner.titleEn || '')}
                      fill
                      className="object-cover"
                      priority={index === 0}
                      sizes="100vw"
                      unoptimized  // Fallback for edge cases
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary to-primary/80" />
                  )}
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                </div>

                {/* Content */}
                <div className="relative h-full flex items-center">
                  <div className="container px-4 md:px-8 lg:px-16">
                    <div className="max-w-xl space-y-4 md:space-y-6">
                      {/* Decorative Badge */}
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/30 text-white backdrop-blur-sm">
                        <Sparkles className="h-4 w-4" />
                        <span className="text-sm font-medium">Astaar Hijab</span>
                      </div>

                      {/* Title */}
                      <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
                        {language === 'ar' ? banner.titleAr : banner.titleEn}
                      </h1>

                      {/* Subtitle */}
                      {(language === 'ar' ? banner.subtitleAr : banner.subtitleEn) && (
                        <p className="text-base md:text-lg text-white/90 max-w-md">
                          {language === 'ar' ? banner.subtitleAr : banner.subtitleEn}
                        </p>
                      )}

                      {/* CTA Button */}
                      <div className="pt-2 md:pt-4">
                        <Button
                          size="lg"
                          className="rounded-full px-8 py-6 text-base md:text-lg bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                          onClick={() => handleButtonClick(banner.link)}
                        >
                          {language === 'ar' 
                            ? (banner.buttonTextAr || 'تسوقي الآن') 
                            : (banner.buttonTextEn || 'Shop Now')
                          }
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* Navigation Arrows - Only show if multiple banners */}
        {banners.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 rounded-full bg-white/80 hover:bg-white backdrop-blur-sm shadow-lg h-12 w-12 opacity-0 hover:opacity-100 transition-opacity"
              onClick={() => api?.scrollPrev()}
            >
              <ChevronLeft className="h-6 w-6 text-gray-800" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 rounded-full bg-white/80 hover:bg-white backdrop-blur-sm shadow-lg h-12 w-12 opacity-0 hover:opacity-100 transition-opacity"
              onClick={() => api?.scrollNext()}
            >
              <ChevronRight className="h-6 w-6 text-gray-800" />
            </Button>
          </>
        )}

        {/* Dots Indicator */}
        {banners.length > 1 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
            {banners.map((_, index) => (
              <button
                key={index}
                className={cn(
                  'w-2.5 h-2.5 rounded-full transition-all duration-300',
                  current === index
                    ? 'bg-primary w-8'
                    : 'bg-white/50 hover:bg-white/80'
                )}
                onClick={() => api?.scrollTo(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </Carousel>
    </section>
  );
}
