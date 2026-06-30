'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { ArrowRight, Package } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { csrfFetch } from '@/lib/csrf-fetch'

interface Category {
  id: string;
  nameEn: string;
  nameAr: string;
  slug: string;
  image: string | null;
  descriptionEn: string | null;
  descriptionAr: string | null;
  _count?: {
    products: number;
  };
}

interface CategoriesSectionProps {
  title?: string;
  titleAr?: string;
  limit?: number;
}

export function CategoriesSection({
  title = 'Shop by Category',
  titleAr = 'تسوقي حسب الفئة',
  limit = 6,
}: CategoriesSectionProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await csrfFetch('/api/categories');
        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }
        const data = await response.json();
        setCategories(data.slice(0, limit));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [limit]);

  if (error) {
    return null;
  }

  return (
    <section className="py-12 md:py-16 bg-muted/30">
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

        {/* Categories Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
          {loading
            ? Array.from({ length: limit }).map((_, i) => (
                <CategoryCardSkeleton key={i} />
              ))
            : categories.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
        </div>
      </div>
    </section>
  );
}

interface CategoryCardProps {
  category: Category;
}

function CategoryCard({ category }: CategoryCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const imageUrl = category.image || '/placeholder-category.png';

  return (
    <a
      href={`/?view=shop&category=${category.slug}`}
      className="group block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Card className="relative overflow-hidden border-0 shadow-sm hover:shadow-lg transition-all duration-300 bg-card">
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden">
          {category.image ? (
            <Image
              src={imageUrl}
              alt={category.nameEn}
              fill
              className={cn(
                'object-cover transition-transform duration-500',
                isHovered && 'scale-110'
              )}
              sizes="(max-width: 768px) 50vw, 16vw"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent flex items-center justify-center">
              <Package className="h-12 w-12 text-primary/50" />
            </div>
          )}

          {/* Overlay */}
          <div
            className={cn(
              'absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity duration-300',
              isHovered ? 'opacity-100' : 'opacity-80'
            )}
          />
        </div>

        {/* Content */}
        <CardContent className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <h3 className="font-semibold text-sm md:text-base line-clamp-1">
            {category.nameEn}
          </h3>
          <p className="text-xs text-white/80 font-arabic line-clamp-1" dir="rtl">
            {category.nameAr}
          </p>
          {category._count && (
            <p className="text-xs text-white/60 mt-1">
              {category._count.products} products
            </p>
          )}

          {/* Arrow indicator */}
          <div
            className={cn(
              'absolute right-4 top-1/2 -translate-y-1/2 transition-all duration-300',
              isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'
            )}
          >
            <ArrowRight className="h-5 w-5 text-white" />
          </div>
        </CardContent>
      </Card>
    </a>
  );
}

function CategoryCardSkeleton() {
  return (
    <Card className="overflow-hidden border-0 shadow-sm">
      <div className="relative aspect-square">
        <Skeleton className="w-full h-full" />
      </div>
      <CardContent className="p-4">
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-3 w-20" />
      </CardContent>
    </Card>
  );
}

// Export skeleton for the entire section
export function CategoriesSectionSkeleton({ count = 6 }: { count?: number }) {
  return (
    <section className="py-12 md:py-16 bg-muted/30">
      <div className="container px-4 md:px-8">
        <div className="text-center mb-8 md:mb-12">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-6 w-32 mx-auto mt-2" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
          {Array.from({ length: count }).map((_, i) => (
            <CategoryCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
