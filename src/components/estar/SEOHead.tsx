'use client'

import Script from 'next/script'
import { useSiteSettings } from '@/hooks/useSiteSettings'

/**
 * SEOHead now emits ONLY JSON-LD structured data.
 *
 * All <meta>/<link> SEO tags (title, description, OG, Twitter, verification,
 * canonical, robots) are produced server-side by `generateMetadata` in
 * layout.tsx so crawlers and social scrapers actually receive them. Rendering
 * them again here in the <body> was duplicated and unreliable, so it was
 * removed. Structured data, however, is legitimately injected via <script> and
 * powers Google rich results (sitelinks search box, business knowledge panel).
 */
export function SEOHead() {
  const { settings } = useSiteSettings()

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const name = settings.business_name || settings.site_name_ar || 'Astar - استآر'

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': settings.schema_org_type || 'OnlineStore',
    name,
    url: origin,
    logo: settings.business_logo || settings.site_logo || '',
    image: settings.og_image || settings.business_logo || '',
    description: settings.seo_description || '',
    ...(settings.site_email || settings.site_phone
      ? {
          contactPoint: {
            '@type': 'ContactPoint',
            contactType: 'customer service',
            email: settings.site_email || undefined,
            telephone: settings.site_phone || undefined,
            areaServed: ['EG', 'SA', 'AE'],
            availableLanguage: ['ar', 'en'],
          },
        }
      : {}),
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'EG',
      addressLocality: settings.site_address_ar || '',
    },
    sameAs: [
      settings.social_facebook,
      settings.social_instagram,
      settings.social_twitter,
      settings.social_tiktok,
      settings.social_snapchat,
    ].filter(Boolean),
  }

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name,
    url: origin,
    inLanguage: 'ar',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${origin}/?view=shop&search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <>
      <Script
        id="organization-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <Script
        id="website-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
    </>
  )
}
