import type { MetadataRoute } from 'next'
import { db } from '@/lib/db'
import { getSiteOrigin, buildStoreUrl } from '@/lib/seo'

// Always render fresh so newly added products/categories appear.
export const dynamic = 'force-dynamic'
export const revalidate = 3600

/**
 * Native App Router sitemap -> served at /sitemap.xml.
 *
 * Previously the only sitemap lived at /api/seo/sitemap and pointed at
 * /product/{slug}, /about, /contact ... routes that DO NOT EXIST in this
 * query-param SPA, so every entry 404'd. This generates the REAL crawlable
 * `?view=` URLs the storefront actually serves.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = await getSiteOrigin()
  const now = new Date()

  const entries: MetadataRoute.Sitemap = [
    { url: buildStoreUrl(origin), lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: buildStoreUrl(origin, 'shop'), lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: buildStoreUrl(origin, 'about'), lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: buildStoreUrl(origin, 'contact'), lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
  ]

  try {
    const [products, categories] = await Promise.all([
      db.product.findMany({
        where: { active: true },
        select: { id: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
        take: 5000,
      }),
      db.category.findMany({
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
        take: 1000,
      }),
    ])

    for (const p of products) {
      entries.push({
        url: buildStoreUrl(origin, 'product', { id: p.id }),
        lastModified: p.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.8,
      })
    }
    for (const c of categories) {
      entries.push({
        url: buildStoreUrl(origin, 'shop', { category: c.slug }),
        lastModified: c.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.7,
      })
    }
  } catch {
    // DB unavailable at build -> return static entries only.
  }

  return entries
}
