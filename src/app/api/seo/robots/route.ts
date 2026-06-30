import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || request.headers.get('host') 
      ? `https://${request.headers.get('host')}` 
      : 'http://localhost:3000'

    // Get custom robots.txt settings
    const settings = await db.setting.findMany({
      where: {
        key: {
          in: ['robots_txt_custom', 'robots_index', 'sitemap_enabled']
        }
      }
    })

    const settingsMap = Object.fromEntries(settings.map(s => [s.key, s.value]))
    const customRules = settingsMap.robots_txt_custom || ''
    const sitemapEnabled = settingsMap.sitemap_enabled !== 'false'

    // Build robots.txt content
    let robotsTxt = `# Robots.txt for ${baseUrl}
# Generated automatically by Astar E-Commerce Platform

User-agent: *
`

    // Add index settings
    const indexSetting = settingsMap.robots_index || 'index, follow'
    if (indexSetting === 'noindex, nofollow') {
      robotsTxt += `Disallow: /
`
    } else if (indexSetting === 'noindex, follow') {
      robotsTxt += `Disallow: /
Allow: /products
Allow: /product/
Allow: /category/
`
    } else {
      robotsTxt += `Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /auth/
Disallow: /checkout
Disallow: /cart
Disallow: /account
Disallow: /_next/
Disallow: /static/
`
    }

    // Add custom rules if provided
    if (customRules) {
      robotsTxt += `
# Custom Rules
${customRules}
`
    }

    // Add sitemap reference
    if (sitemapEnabled) {
      robotsTxt += `
# Sitemap
Sitemap: ${baseUrl}/sitemap.xml
`
    }

    // Add crawl delay for polite crawling
    robotsTxt += `
# Crawl delay
Crawl-delay: 1
`

    // Return JSON for API calls, text for direct access
    const acceptHeader = request.headers.get('accept') || ''
    if (acceptHeader.includes('application/json')) {
      return NextResponse.json({
        success: true,
        robotsTxt,
        message: 'Robots.txt updated successfully'
      })
    }

    return new NextResponse(robotsTxt, {
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600'
      }
    })
  } catch (error) {
    console.error('Error generating robots.txt:', error)
    return NextResponse.json({ error: 'Failed to generate robots.txt' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customRules } = body

    // Save custom robots.txt rules
    if (customRules) {
      await db.setting.upsert({
        where: { key: 'robots_txt_custom' },
        create: { key: 'robots_txt_custom', value: customRules, type: 'text' },
        update: { value: customRules }
      })
    }

    return NextResponse.json({ success: true, message: 'Robots.txt settings saved' })
  } catch (error) {
    console.error('Error saving robots.txt settings:', error)
    return NextResponse.json({ error: 'Failed to save robots.txt settings' }, { status: 500 })
  }
}
