'use client';

import { useEffect, useState, useRef } from 'react';
import { Star, Quote, ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { csrfFetch } from '@/lib/csrf-fetch'

interface Testimonial {
  id: string;
  name: string;
  initials?: string;
  avatar?: string;
  rating: number;
  comment: string;
  commentAr?: string;
  product?: string;
  date?: string;
  verified?: boolean;
}

interface TestimonialsSectionProps {
  title?: string;
  titleAr?: string;
}

export function TestimonialsSection({
  title = 'What Our Customers Say',
  titleAr = 'ماذا يقول عملاؤنا',
}: TestimonialsSectionProps) {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const initialized = useRef(false);

  // Fetch real reviews from database
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        const response = await csrfFetch('/api/reviews?featured=true&limit=10');
        if (response.ok) {
          const data = await response.json();
          
          // Transform reviews to testimonials format
          const transformedTestimonials: Testimonial[] = data.reviews.map((review: {
            id: string;
            rating: number;
            title?: string;
            comment: string;
            verified: boolean;
            createdAt: string;
            user: {
              id: string;
              name: string;
              avatar?: string;
            };
            product?: {
              nameAr: string;
              nameEn: string;
            };
          }) => ({
            id: review.id,
            name: review.user.name || 'عميل',
            avatar: review.user.avatar,
            initials: review.user.name ? review.user.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2) : 'عم',
            rating: review.rating,
            comment: review.comment,
            product: review.product?.nameAr || review.product?.nameEn,
            date: formatDate(review.createdAt),
            verified: review.verified,
          }));
          
          setTestimonials(transformedTestimonials);
        }
      } catch (error) {
        // Handle error silently
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'اليوم';
    if (diffDays === 1) return 'أمس';
    if (diffDays < 7) return `منذ ${diffDays} أيام`;
    if (diffDays < 14) return 'منذ أسبوع';
    if (diffDays < 30) return `منذ ${Math.floor(diffDays / 7)} أسابيع`;
    if (diffDays < 60) return 'منذ شهر';
    return `منذ ${Math.floor(diffDays / 30)} أشهر`;
  };

  useEffect(() => {
    if (!api) return;

    const handleSelect = () => {
      setCurrent(api.selectedScrollSnap());
    };

    if (!initialized.current) {
      initialized.current = true;
      queueMicrotask(handleSelect);
    }

    api.on('select', handleSelect);
    return () => {
      api.off('select', handleSelect);
      initialized.current = false;
    };
  }, [api]);

  // Auto-play
  useEffect(() => {
    if (!api || testimonials.length === 0) return;
    const interval = setInterval(() => {
      api.scrollNext();
    }, 6000);
    return () => clearInterval(interval);
  }, [api, testimonials.length]);

  // Empty state - no reviews yet
  if (!loading && testimonials.length === 0) {
    return (
      <section className="py-12 md:py-16 bg-gradient-to-b from-background to-muted/30">
        <div className="container px-4 md:px-8">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              {title}
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground mt-1 font-arabic" dir="rtl">
              {titleAr}
            </p>
          </div>
          
          <div className="max-w-md mx-auto text-center py-12">
            <MessageSquare className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">لا توجد تقييمات بعد</h3>
            <p className="text-muted-foreground text-sm">
              كن أول من يشارك تجربته مع منتجاتنا!
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 md:py-16 bg-gradient-to-b from-background to-muted/30 overflow-hidden">
      <div className="container px-4 md:px-8">
        {/* Section Header */}
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            {title}
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground mt-1 font-arabic" dir="rtl">
            {titleAr}
          </p>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="h-8 w-8 bg-muted animate-pulse rounded mb-4" />
                  <div className="flex gap-0.5 mb-4">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <div key={j} className="h-4 w-4 bg-muted animate-pulse rounded" />
                    ))}
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="h-4 w-full bg-muted animate-pulse rounded" />
                    <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-muted animate-pulse rounded-full" />
                    <div className="space-y-1">
                      <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                      <div className="h-3 w-16 bg-muted animate-pulse rounded" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* Testimonials Carousel */
          <div className="relative max-w-5xl mx-auto">
            <Carousel
              setApi={setApi}
              opts={{
                loop: true,
                align: 'center',
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-2 md:-ml-4">
                {testimonials.map((testimonial) => (
                  <CarouselItem
                    key={testimonial.id}
                    className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3"
                  >
                    <TestimonialCard testimonial={testimonial} />
                  </CarouselItem>
                ))}
              </CarouselContent>

              {/* Navigation Buttons */}
              <Button
                variant="outline"
                size="icon"
                className="absolute -left-4 md:-left-12 top-1/2 -translate-y-1/2 rounded-full bg-white shadow-lg h-10 w-10 hidden md:flex"
                onClick={() => api?.scrollPrev()}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="absolute -right-4 md:-right-12 top-1/2 -translate-y-1/2 rounded-full bg-white shadow-lg h-10 w-10 hidden md:flex"
                onClick={() => api?.scrollNext()}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </Carousel>

            {/* Dots Indicator */}
            <div className="flex justify-center gap-2 mt-6">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  className={cn(
                    'w-2 h-2 rounded-full transition-all duration-300',
                    current === index
                      ? 'bg-primary w-6'
                      : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                  )}
                  onClick={() => api?.scrollTo(index)}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

interface TestimonialCardProps {
  testimonial: Testimonial;
}

function TestimonialCard({ testimonial }: TestimonialCardProps) {
  return (
    <Card className="h-full border-0 shadow-sm hover:shadow-md transition-shadow duration-300 bg-card">
      <CardContent className="p-6 flex flex-col h-full">
        {/* Quote Icon */}
        <Quote className="h-8 w-8 text-primary/30 mb-4" />

        {/* Rating */}
        <div className="flex gap-0.5 mb-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={cn(
                'h-4 w-4',
                i < testimonial.rating
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-muted stroke-muted-foreground'
              )}
            />
          ))}
        </div>

        {/* Comment */}
        <p className="text-foreground text-sm md:text-base leading-relaxed mb-4 flex-grow">
          &ldquo;{testimonial.comment}&rdquo;
        </p>

        {/* Product Badge */}
        {testimonial.product && (
          <div className="mb-4">
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
              {testimonial.product}
            </span>
          </div>
        )}

        {/* Customer Info */}
        <div className="flex items-center gap-3 mt-auto pt-4 border-t border-border/50">
          <Avatar className="h-10 w-10 border-2 border-primary/20">
            <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
            <AvatarFallback className="bg-primary/20 text-primary text-sm font-medium">
              {testimonial.initials || testimonial.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-medium text-foreground text-sm">{testimonial.name}</p>
            {testimonial.date && (
              <p className="text-xs text-muted-foreground">{testimonial.date}</p>
            )}
          </div>
          {testimonial.verified && (
            <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              موثق
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Skeleton for loading state
export function TestimonialsSectionSkeleton() {
  return (
    <section className="py-12 md:py-16 bg-gradient-to-b from-background to-muted/30">
      <div className="container px-4 md:px-8">
        <div className="text-center mb-8 md:mb-12">
          <div className="h-8 w-64 bg-muted animate-pulse rounded mx-auto" />
          <div className="h-6 w-48 bg-muted animate-pulse rounded mx-auto mt-2" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="h-8 w-8 bg-muted animate-pulse rounded mb-4" />
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <div key={j} className="h-4 w-4 bg-muted animate-pulse rounded" />
                  ))}
                </div>
                <div className="space-y-2 mb-4">
                  <div className="h-4 w-full bg-muted animate-pulse rounded" />
                  <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-muted animate-pulse rounded-full" />
                  <div className="space-y-1">
                    <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                    <div className="h-3 w-16 bg-muted animate-pulse rounded" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
