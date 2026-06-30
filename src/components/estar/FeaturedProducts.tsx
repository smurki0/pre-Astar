'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ProductCard, ProductCardSkeleton, Product } from './ProductCard';
import type { Product as StoreProduct } from '@/store';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useCartStore, useWishlistStore } from '@/store';
import { csrfFetch } from '@/lib/csrf-fetch'

interface FeaturedProductsProps {
  title?: string;
  titleAr?: string;
  limit?: number;
}

interface ProductResponse {
  id: string;
  nameEn: string;
  nameAr: string;
  price: number;
  comparePrice: number | null;
  images: { url: string; alt: string | null }[];
  category: { nameEn: string; nameAr: string } | null;
  reviews: { rating: number }[];
  quantity: number;
}

export function FeaturedProducts({
  title = 'Featured Products',
  titleAr = 'منتجات مميزة',
  limit = 8,
}: FeaturedProductsProps) {
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { addItem: addToCart } = useCartStore()
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlistStore()

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await csrfFetch(`/api/products?featured=true&limit=${limit}`);
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        const data = await response.json();
        setProducts(data.products || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [limit]);

  const handleAddToCart = (productId: string) => {
    const product = products.find(p => p.id === productId)
    if (product) {
      addToCart(product as unknown as StoreProduct, null, 1)
    }
  };

  const handleToggleWishlist = (productId: string) => {
    const product = products.find(p => p.id === productId)
    if (product) {
      if (isInWishlist(productId)) {
        removeFromWishlist(productId)
      } else {
        addToWishlist(product as unknown as StoreProduct)
      }
    }
  };

  if (error) {
    return (
      <section className="py-12 md:py-16">
        <div className="container px-4 md:px-8">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Unable to load products. Please try again later.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 md:py-16 bg-background">
      <div className="container px-4 md:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 md:mb-12">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              {title}
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground mt-1 font-arabic" dir="rtl">
              {titleAr}
            </p>
          </div>
          <Link href="/?view=shop">
            <Button
              variant="outline"
              className="rounded-full px-6 border-primary/20 hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              View All
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {loading
            ? Array.from({ length: limit }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))
            : products.map((product) => (
                <Link key={product.id} href={`/?view=product&id=${product.id}`}>
                  <ProductCard
                    product={product as unknown as Product}
                    onAddToCart={handleAddToCart}
                    onToggleWishlist={handleToggleWishlist}
                    isInWishlist={isInWishlist(product.id)}
                  />
                </Link>
              ))}
        </div>

        {/* Empty State */}
        {!loading && products.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No featured products available at the moment.</p>
            <Link href="/?view=shop">
              <Button className="mt-4 rounded-full" variant="outline">
                Browse All Products
              </Button>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

// Export a simple skeleton for the entire section
export function FeaturedProductsSkeleton({ count = 8 }: { count?: number }) {
  return (
    <section className="py-12 md:py-16 bg-background">
      <div className="container px-4 md:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 md:mb-12">
          <div>
            <div className="h-8 w-48 bg-muted animate-pulse rounded" />
            <div className="h-6 w-32 bg-muted animate-pulse rounded mt-2" />
          </div>
          <div className="h-10 w-28 bg-muted animate-pulse rounded-full" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {Array.from({ length: count }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
