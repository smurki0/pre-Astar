'use client';

import * as React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n';
import { csrfFetch } from '@/lib/csrf-fetch';

interface Banner {
  id: string;
  titleEn: string | null;
  titleAr: string | null;
  subtitleEn: string | null;
  subtitleAr: string | null;
  image: string | null;
  link: string | null;
  buttonTextEn: string | null;
  buttonTextAr: string | null;
  active: boolean;
}

// Accept local /public uploads (relative paths) and any absolute http(s) URL.
// Images render with `unoptimized` so we are not bound to next.config remotePatterns.
const isValidImageUrl = (url: string | null | undefined): boolean => {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('/')) return true;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
};

type Position = 'sidebar' | 'footer';

interface PromoBannersProps {
  position: Position;
  className?: string;
  /** Optional heading shown above footer banners. */
  title?: string;
  titleAr?: string;
}

export function PromoBanners({ position, className, title, titleAr }: PromoBannersProps) {
  const router = useRouter();
  const { language, isRTL } = useLanguage();
  const [banners, setBanners] = React.useState<Banner[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [errored, setErrored] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    const fetchBanners = async () => {
      try {
        setLoading(true);
        setErrored(false);
        const res = await csrfFetch(`/api/banners?position=${position}`);
        if (!res.ok) throw new Error('Failed to load banners');
        const data = await res.json();
        if (cancelled) return;
        const list: Banner[] = (data.banners || [])
          .filter((b: Banner) => b.active && isValidImageUrl(b.image));
        setBanners(list);
      } catch {
        if (!cancelled) setErrored(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchBanners();
    return () => {
      cancelled = true;
    };
  }, [position]);

  // Robust link handling, identical in spirit to the hero CTA: never produce a
  // broken "/?view=/foo" route.
  const handleClick = (link: string | null | undefined) => {
    const raw = (link ?? '').trim();
    if (!raw) {
      router.push('/?view=shop');
      return;
    }
    if (/^https?:\/\//i.test(raw)) {
      window.open(raw, '_blank', 'noopener,noreferrer');
      return;
    }
    if (raw.startsWith('?') || raw.startsWith('/?')) {
      router.push(raw.startsWith('/') ? raw : `/${raw}`);
      return;
    }
    const knownViews = ['shop', 'about', 'contact', 'cart', 'checkout'];
    if (raw.startsWith('/')) {
      const seg = raw.replace(/^\/+/, '').split(/[/?#]/)[0];
      router.push(knownViews.includes(seg) ? `/?view=${seg}` : raw);
      return;
    }
    router.push(`/?view=${encodeURIComponent(raw)}`);
  };

  const t = (en: string | null, ar: string | null) => (language === 'ar' ? ar || en || '' : en || ar || '');

  // ---- Loading state ----
  if (loading) {
    if (position === 'sidebar') {
      return (
        <div className={cn('space-y-4', className)} aria-busy="true">
          {Array.from({ length: 1 }).map((_, i) => (
            <div key={i} className="h-48 w-full rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      );
    }
    return (
      <div className={cn('container mx-auto px-4', className)} aria-busy="true">
        <div className="flex items-center justify-center h-32 rounded-2xl bg-muted animate-pulse">
          <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
        </div>
      </div>
    );
  }

  // ---- Error / empty states: render nothing so the page layout never breaks ----
  if (errored || banners.length === 0) {
    return null;
  }

  // =================== SIDEBAR ===================
  if (position === 'sidebar') {
    return (
      <aside className={cn('space-y-4', className)} aria-label="Promotions">
        {banners.map((banner) => {
          const heading = t(banner.titleEn, banner.titleAr);
          const sub = t(banner.subtitleEn, banner.subtitleAr);
          const btn = t(banner.buttonTextEn, banner.buttonTextAr);
          return (
            <div
              key={banner.id}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow duration-300 hover:shadow-md"
            >
              <div className="relative aspect-[4/5] w-full">
                {banner.image && (
                  <Image
                    src={banner.image}
                    alt={heading || 'Promotion'}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 1024px) 100vw, 256px"
                    unoptimized
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className={cn('absolute inset-x-0 bottom-0 p-4 text-white', isRTL ? 'text-right' : 'text-left')}>
                  {heading && <h3 className="text-lg font-bold leading-tight drop-shadow-sm">{heading}</h3>}
                  {sub && <p className="mt-1 text-xs text-white/85 line-clamp-2">{sub}</p>}
                  <Button
                    size="sm"
                    className="mt-3 rounded-full bg-primary px-4 text-primary-foreground hover:bg-primary/90"
                    onClick={() => handleClick(banner.link)}
                  >
                    {btn || (language === 'ar' ? 'تسوقي الآن' : 'Shop Now')}
                    <ArrowRight className={cn('h-3.5 w-3.5', isRTL ? 'mr-1.5 rotate-180' : 'ml-1.5')} />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </aside>
    );
  }

  // =================== FOOTER (promo strip above the site footer) ===================
  const heading = language === 'ar' ? titleAr : title;
  const gridCols =
    banners.length === 1
      ? 'grid-cols-1'
      : banners.length === 2
        ? 'grid-cols-1 sm:grid-cols-2'
        : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

  return (
    <section className={cn('container mx-auto px-4 py-10', className)} aria-label="Promotions">
      {heading && (
        <h2 className="mb-6 text-center text-2xl font-bold text-foreground md:text-3xl">{heading}</h2>
      )}
      <div className={cn('grid gap-4 md:gap-6', gridCols)}>
        {banners.map((banner) => {
          const h = t(banner.titleEn, banner.titleAr);
          const sub = t(banner.subtitleEn, banner.subtitleAr);
          const btn = t(banner.buttonTextEn, banner.buttonTextAr);
          const wide = banners.length === 1;
          return (
            <button
              key={banner.id}
              type="button"
              onClick={() => handleClick(banner.link)}
              className={cn(
                'group relative block w-full overflow-hidden rounded-2xl border border-border bg-card text-start shadow-sm transition-all duration-300 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                wide ? 'aspect-[21/9]' : 'aspect-[16/10]',
              )}
            >
              {banner.image && (
                <Image
                  src={banner.image}
                  alt={h || 'Promotion'}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes={wide ? '100vw' : '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'}
                  unoptimized
                />
              )}
              <div
                className={cn(
                  'absolute inset-0',
                  isRTL
                    ? 'bg-gradient-to-l from-black/70 via-black/30 to-transparent'
                    : 'bg-gradient-to-r from-black/70 via-black/30 to-transparent',
                )}
              />
              <div className={cn('absolute inset-0 flex flex-col justify-center gap-2 p-6 text-white md:p-8', isRTL ? 'items-end text-right' : 'items-start text-left')}>
                {h && <h3 className="max-w-md text-xl font-bold leading-tight drop-shadow-sm md:text-2xl">{h}</h3>}
                {sub && <p className="max-w-md text-sm text-white/90 md:text-base line-clamp-2">{sub}</p>}
                <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors group-hover:bg-primary/90">
                  {btn || (language === 'ar' ? 'تسوقي الآن' : 'Shop Now')}
                  <ArrowRight className={cn('h-4 w-4', isRTL ? 'rotate-180' : '')} />
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default PromoBanners;
