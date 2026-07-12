import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSiteOriginFromRequest, buildStoreUrl } from '@/lib/seo'

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const baseUrl = getSiteOriginFromRequest(request)

    // Get all active products
    const products = await db.product.findMany({
      where: { active: true },
      select: { id: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' }
    })

    // Get all categories
    const categories = await db.category.findMany({
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' }
    })

    // Build sitemap URLs
    const urls: { loc: string; lastmod: string; changefreq: string; priority: number }[] = []

    // Homepage
    urls.push({
      loc: baseUrl,
      lastmod: new Date().toISOString(),
      changefreq: 'daily',
      priority: 1.0
    })

    // Shop page
    urls.push({
      loc: buildStoreUrl(baseUrl, 'shop'),
      lastmod: new Date().toISOString(),
      changefreq: 'daily',
      priority: 0.9
    })

    // About page
    urls.push({
      loc: buildStoreUrl(baseUrl, 'about'),
      lastmod: new Date().toISOString(),
      changefreq: 'monthly',
      priority: 0.5
    })

    // Contact page
    urls.push({
      loc: buildStoreUrl(baseUrl, 'contact'),
      lastmod: new Date().toISOString(),
      changefreq: 'monthly',
      priority: 0.5
    })

    // Product pages (query-param SPA URLs the storefront actually serves)
    for (const product of products) {
      urls.push({
        loc: buildStoreUrl(baseUrl, 'product', { id: product.id }),
        lastmod: product.updatedAt.toISOString(),
        changefreq: 'weekly',
        priority: 0.8
      })
    }

    // Category pages
    for (const category of categories) {
      urls.push({
        loc: buildStoreUrl(baseUrl, 'shop', { category: category.slug }),
        lastmod: category.updatedAt.toISOString(),
        changefreq: 'weekly',
        priority: 0.7
      })
    }

    // Generate XML
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`

    // Return JSON for API calls, XML for direct access
    const acceptHeader = request.headers.get('accept') || ''
    if (acceptHeader.includes('application/json')) {
      return NextResponse.json({
        success: true,
        urlCount: urls.length,
        sitemap: urls,
        xml: sitemap
      })
    }

    return new NextResponse(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600'
      }
    })
  } catch (error) {
    console.error('Error generating sitemap:', error)
    return NextResponse.json({ error: 'Failed to generate sitemap' }, { status: 500 })
  }
}
