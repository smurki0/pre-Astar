'use client'

import Script from 'next/script'
import { useEffect, useState } from 'react'
import { csrfFetch } from '@/lib/csrf-fetch'

interface AnalyticsSettings {
  googleAnalyticsId: string
  facebookPixelId: string
  tiktokPixelId: string
}

// Fetch analytics settings from API
async function getAnalyticsSettings(): Promise<AnalyticsSettings> {
  try {
    const response = await csrfFetch('/api/admin/settings')
    if (response.ok) {
      const data = await response.json()
      const settings = data.settings || {}
      
      // Handle both object format {value: string} and direct string format
      const getValue = (key: string): string => {
        const val = settings[key]
        if (typeof val === 'object' && val !== null && 'value' in val) {
          return val.value || ''
        }
        return typeof val === 'string' ? val : ''
      }
      
      return {
        googleAnalyticsId: getValue('google_analytics_id'),
        facebookPixelId: getValue('facebook_pixel_id'),
        tiktokPixelId: getValue('tiktok_pixel_id'),
      }
    }
  } catch (error) {
    // Handle error silently
  }
  return {
    googleAnalyticsId: '',
    facebookPixelId: '',
    tiktokPixelId: '',
  }
}

// Google Analytics Component
function GoogleAnalytics({ measurementId }: { measurementId: string }) {
  // Safely check if measurementId is a valid string
  const id = typeof measurementId === 'string' ? measurementId : ''
  if (!id || id.trim() === '') return null
  // GA is already loaded once in the root layout via NEXT_PUBLIC_GA_ID; skip the
  // duplicate here so we never fire two page_view events for the same id.
  if (id.trim() === (process.env.NEXT_PUBLIC_GA_ID || '').trim()) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${id}', {
            page_title: document.title,
            page_location: window.location.href,
          });
        `}
      </Script>
    </>
  )
}

// Facebook Pixel Component
function FacebookPixel({ pixelId }: { pixelId: string }) {
  // Safely check if pixelId is a valid string
  const id = typeof pixelId === 'string' ? pixelId : ''
  if (!id || id.trim() === '') return null

  return (
    <>
      <Script id="facebook-pixel" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${id}');
          fbq('track', 'PageView');
        `}
      </Script>
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${id}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  )
}

// TikTok Pixel Component
function TikTokPixel({ pixelId }: { pixelId: string }) {
  // Safely check if pixelId is a valid string
  const id = typeof pixelId === 'string' ? pixelId : ''
  if (!id || id.trim() === '') return null

  return (
    <>
      <Script id="tiktok-pixel" strategy="afterInteractive">
        {`
          !function (w, d, t) {
            w.TiktokAnalyticsObject=t;
            var ttq=w[t]=w[t]||[];
            ttq.methods=["page","track","identify","instances","debug","use","off","on","once","ready","alias","group","enableCookie","disableCookie"];
            ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
            for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
            ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};
            ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";
            ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};
            var o=document.createElement("script");
            o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;
            var a=document.getElementsByTagName("script")[0];
            a.parentNode.insertBefore(o,a)};
            ttq.load('${id}');
            ttq.page();
          }(window, document, 'ttq');
        `}
      </Script>
    </>
  )
}

// Track Events Helper Functions
export const trackEvents = {
  // Track purchase event
  purchase: (data: {
    value: number
    currency: string
    orderId: string
    items: { name: string; price: number; quantity: number }[]
  }) => {
    // Google Analytics
    if (typeof window !== 'undefined' && (window as unknown as { gtag: (...args: unknown[]) => void }).gtag) {
      (window as unknown as { gtag: (...args: unknown[]) => void }).gtag('event', 'purchase', {
        transaction_id: data.orderId,
        value: data.value,
        currency: data.currency,
        items: data.items,
      })
    }

    // Facebook Pixel
    if (typeof window !== 'undefined' && (window as unknown as { fbq: (...args: unknown[]) => void }).fbq) {
      (window as unknown as { fbq: (...args: unknown[]) => void }).fbq('track', 'Purchase', {
        value: data.value,
        currency: data.currency,
        content_ids: [data.orderId],
      })
    }

    // TikTok Pixel
    if (typeof window !== 'undefined' && (window as unknown as { ttq: { track: (...args: unknown[]) => void } }).ttq) {
      (window as unknown as { ttq: { track: (...args: unknown[]) => void } }).ttq.track('CompletePayment', {
        value: data.value,
        currency: data.currency,
        content_id: data.orderId,
      })
    }
  },

  // Track add to cart
  addToCart: (data: {
    value: number
    currency: string
    productName: string
    productId: string
  }) => {
    // Google Analytics
    if (typeof window !== 'undefined' && (window as unknown as { gtag: (...args: unknown[]) => void }).gtag) {
      (window as unknown as { gtag: (...args: unknown[]) => void }).gtag('event', 'add_to_cart', {
        value: data.value,
        currency: data.currency,
        items: [{ name: data.productName, id: data.productId }],
      })
    }

    // Facebook Pixel
    if (typeof window !== 'undefined' && (window as unknown as { fbq: (...args: unknown[]) => void }).fbq) {
      (window as unknown as { fbq: (...args: unknown[]) => void }).fbq('track', 'AddToCart', {
        value: data.value,
        currency: data.currency,
        content_ids: [data.productId],
      })
    }

    // TikTok Pixel
    if (typeof window !== 'undefined' && (window as unknown as { ttq: { track: (...args: unknown[]) => void } }).ttq) {
      (window as unknown as { ttq: { track: (...args: unknown[]) => void } }).ttq.track('AddToCart', {
        value: data.value,
        currency: data.currency,
        content_id: data.productId,
      })
    }
  },

  // Track page view
  pageView: (pageName: string) => {
    // Google Analytics
    if (typeof window !== 'undefined' && (window as unknown as { gtag: (...args: unknown[]) => void }).gtag) {
      (window as unknown as { gtag: (...args: unknown[]) => void }).gtag('event', 'page_view', {
        page_title: pageName,
      })
    }

    // Facebook Pixel
    if (typeof window !== 'undefined' && (window as unknown as { fbq: (...args: unknown[]) => void }).fbq) {
      (window as unknown as { fbq: (...args: unknown[]) => void }).fbq('track', 'PageView')
    }

    // TikTok Pixel
    if (typeof window !== 'undefined' && (window as unknown as { ttq: { page: () => void } }).ttq) {
      (window as unknown as { ttq: { page: () => void } }).ttq.page()
    }
  },

  // Track begin checkout
  beginCheckout: (data: {
    value: number
    currency: string
    items: { name: string; price: number; quantity: number }[]
  }) => {
    // Google Analytics
    if (typeof window !== 'undefined' && (window as unknown as { gtag: (...args: unknown[]) => void }).gtag) {
      (window as unknown as { gtag: (...args: unknown[]) => void }).gtag('event', 'begin_checkout', {
        value: data.value,
        currency: data.currency,
        items: data.items,
      })
    }

    // Facebook Pixel
    if (typeof window !== 'undefined' && (window as unknown as { fbq: (...args: unknown[]) => void }).fbq) {
      (window as unknown as { fbq: (...args: unknown[]) => void }).fbq('track', 'InitiateCheckout', {
        value: data.value,
        currency: data.currency,
      })
    }

    // TikTok Pixel
    if (typeof window !== 'undefined' && (window as unknown as { ttq: { track: (...args: unknown[]) => void } }).ttq) {
      (window as unknown as { ttq: { track: (...args: unknown[]) => void } }).ttq.track('InitiateCheckout', {
        value: data.value,
        currency: data.currency,
      })
    }
  },
}

// Main Analytics Component
export function Analytics() {
  const [settings, setSettings] = useState<AnalyticsSettings>({
    googleAnalyticsId: '',
    facebookPixelId: '',
    tiktokPixelId: '',
  })
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    getAnalyticsSettings().then((data) => {
      setSettings(data)
      setLoaded(true)
    })
  }, [])

  // Don't render anything until settings are loaded
  if (!loaded) return null

  return (
    <>
      <GoogleAnalytics measurementId={settings.googleAnalyticsId} />
      <FacebookPixel pixelId={settings.facebookPixelId} />
      <TikTokPixel pixelId={settings.tiktokPixelId} />
    </>
  )
}

export default Analytics
