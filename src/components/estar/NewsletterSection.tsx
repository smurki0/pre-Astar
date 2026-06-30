'use client';

import { useState } from 'react';
import { Mail, Gift, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { csrfFetch } from '@/lib/csrf-fetch'

interface NewsletterSectionProps {
  title?: string;
  titleAr?: string;
  subtitle?: string;
  subtitleAr?: string;
}

export function NewsletterSection({
  title = 'Subscribe to Our Newsletter',
  titleAr = 'اشتركي في نشرتنا البريدية',
  subtitle = 'Get exclusive offers, beauty tips, and 10% off your first order',
  subtitleAr = 'احصلي على عروض حصرية ونصائح جمالية وخصم 10% على طلبك الأول',
}: NewsletterSectionProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      const response = await csrfFetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStatus('success');
        setEmail('');
      } else {
        setStatus('error');
        setErrorMessage(data.errorAr || data.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setStatus('error');
      setErrorMessage('Something went wrong. Please try again.');
    }
  };

  return (
    <section className="py-12 md:py-16 bg-gradient-to-r from-primary/10 via-accent/30 to-primary/10 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

      <div className="container px-4 md:px-8 relative">
        <div className="max-w-2xl mx-auto text-center">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 mb-6">
            <Gift className="h-8 w-8 text-primary" />
          </div>

          {/* Title */}
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            {title}
          </h2>
          <p className="text-xl text-muted-foreground font-arabic mb-2" dir="rtl">
            {titleAr}
          </p>

          {/* Subtitle */}
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            {subtitle}
          </p>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto font-arabic" dir="rtl">
            {subtitleAr}
          </p>

          {/* Form */}
          {status === 'success' ? (
            <div className="flex flex-col items-center gap-4 py-4 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Thank you for subscribing!</p>
                <p className="text-muted-foreground text-sm">Check your email for your 10% discount code.</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <div className="relative flex-grow">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 rounded-full border-primary/20 focus:border-primary"
                  disabled={status === 'loading'}
                />
              </div>
              <Button
                type="submit"
                className="h-12 px-8 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all"
                disabled={status === 'loading'}
              >
                {status === 'loading' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Subscribing...
                  </>
                ) : (
                  'Subscribe'
                )}
              </Button>
            </form>
          )}

          {/* Error Message */}
          {status === 'error' && (
            <p className="text-destructive text-sm mt-3 animate-fade-in">{errorMessage}</p>
          )}

          {/* Privacy Note */}
          <p className="text-xs text-muted-foreground mt-6 max-w-sm mx-auto">
            By subscribing, you agree to our Privacy Policy. We respect your privacy and will never share your information.
          </p>
        </div>
      </div>
    </section>
  );
}

// Skeleton for loading state
export function NewsletterSectionSkeleton() {
  return (
    <section className="py-12 md:py-16 bg-gradient-to-r from-primary/10 via-accent/30 to-primary/10">
      <div className="container px-4 md:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 rounded-full bg-muted animate-pulse mx-auto mb-6" />
          <div className="h-8 w-64 bg-muted animate-pulse rounded mx-auto mb-2" />
          <div className="h-6 w-48 bg-muted animate-pulse rounded mx-auto mb-4" />
          <div className="h-4 w-80 bg-muted animate-pulse rounded mx-auto mb-8" />
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <div className="flex-grow h-12 bg-muted animate-pulse rounded-full" />
            <div className="h-12 w-28 bg-muted animate-pulse rounded-full" />
          </div>
        </div>
      </div>
    </section>
  );
}
