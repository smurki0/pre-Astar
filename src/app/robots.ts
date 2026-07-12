import type { MetadataRoute } from 'next'
import { getSiteOrigin, getSeoSettings } from '@/lib/seo'

export const dynamic = 'force-dynamic'
export const revalidate = 3600

/**
 * Native App Router robots -> served at /robots.txt.
 * Honours the admin's `robots_index` and `sitemap_enabled` settings and always
 * advertises the canonical /sitemap.xml so crawlers can discover every page.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const [origin, settings] = await Promise.all([getSiteOrigin(), getSeoSettings()])

  const indexSetting = settings.robots_index || 'index, follow'
  const sitemapEnabled = settings.sitemap_enabled !== 'false'
  const noIndex = indexSetting.includes('noindex')

  const rules: MetadataRoute.Robots['rules'] = noIndex
    ? { userAgent: '*', disallow: '/' }
    : {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api', '/auth', '/checkout', '/cart', '/account', '/_next/'],
      }

  return {
    rules,
    ...(sitemapEnabled ? { sitemap: `${origin}/sitemap.xml`, host: origin } : {}),
  }
}
