'use client'

import Script from 'next/script'
import { useSiteSettings } from '@/hooks/useSiteSettings'

export function SEOHead() {
  const { settings } = useSiteSettings()

  // Build Organization Schema
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': settings.schema_org_type || 'Organization',
    name: settings.business_name || settings.site_name_ar || 'Astar - استآر',
    url: typeof window !== 'undefined' ? window.location.origin : '',
    logo: settings.business_logo || settings.site_logo || '',
    description: settings.seo_description || '',
    email: settings.site_email || '',
    telephone: settings.site_phone || '',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'EG',
      addressLocality: settings.site_address_ar || ''
    },
    sameAs: [
      settings.social_facebook,
      settings.social_instagram,
      settings.social_twitter,
      settings.social_tiktok,
      settings.social_snapchat
    ].filter(Boolean)
  }

  // Build WebSite Schema
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: settings.business_name || settings.site_name_ar || 'Astar - استآر',
    url: typeof window !== 'undefined' ? window.location.origin : '',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${typeof window !== 'undefined' ? window.location.origin : ''}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string'
    }
  }

  return (
    <>
      {/* Google Site Verification */}
      {settings.google_site_verification && (
        <meta name="google-site-verification" content={settings.google_site_verification} />
      )}
      
      {/* Bing Webmaster Verification */}
      {settings.bing_webmaster_verification && (
        <meta name="msvalidate.01" content={settings.bing_webmaster_verification} />
      )}
      
      {/* Yandex Verification */}
      {settings.yandex_verification && (
        <meta name="yandex-verification" content={settings.yandex_verification} />
      )}

      {/* Additional Meta Tags */}
      <meta name="author" content={settings.seo_author || settings.site_name_ar || 'Astar'} />
      <meta name="robots" content={settings.seo_robots || 'index, follow'} />
      <meta name="revisit-after" content={settings.seo_revisit_after || '7 days'} />
      
      {/* Open Graph Tags */}
      <meta property="og:title" content={settings.og_title || settings.seo_title || 'Astar - استآر'} />
      <meta property="og:description" content={settings.og_description || settings.seo_description || ''} />
      <meta property="og:type" content={settings.og_type || 'website'} />
      {settings.og_image && (
        <meta property="og:image" content={settings.og_image} />
      )}
      
      {/* Twitter Card Tags */}
      <meta name="twitter:card" content={settings.twitter_card || 'summary_large_image'} />
      {settings.twitter_site && (
        <meta name="twitter:site" content={settings.twitter_site} />
      )}
      <meta name="twitter:title" content={settings.twitter_title || settings.seo_title || 'Astar - استآر'} />
      <meta name="twitter:description" content={settings.twitter_description || settings.seo_description || ''} />
      {settings.twitter_image && (
        <meta name="twitter:image" content={settings.twitter_image} />
      )}
      {settings.og_image && !settings.twitter_image && (
        <meta name="twitter:image" content={settings.og_image} />
      )}

      {/* Canonical URL */}
      {settings.canonical_url && (
        <link rel="canonical" href={settings.canonical_url} />
      )}

      {/* JSON-LD Structured Data */}
      <Script
        id="organization-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema)
        }}
      />
      <Script
        id="website-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteSchema)
        }}
      />
    </>
  )
}
