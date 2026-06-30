import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || request.headers.get('host') 
      ? `https://${request.headers.get('host')}` 
      : 'http://localhost:3000'

    // Get SEO settings
    const settings = await db.setting.findMany({
      where: {
        key: {
          in: [
            'seo_title', 'seo_description', 'seo_keywords', 'og_image',
            'business_name', 'business_logo', 'schema_org_type',
            'google_site_verification', 'site_email', 'site_phone',
            'site_address_ar', 'social_instagram', 'social_facebook', 'social_twitter'
          ]
        }
      }
    })

    const settingsMap = Object.fromEntries(settings.map(s => [s.key, s.value]))

    // Build Schema.org JSON-LD
    const schemaType = settingsMap.schema_org_type || 'Organization'
    
    const organizationSchema = {
      '@context': 'https://schema.org',
      '@type': schemaType,
      name: settingsMap.business_name || 'Astar - استآر',
      url: baseUrl,
      logo: settingsMap.business_logo || settingsMap.og_image || '',
      description: settingsMap.seo_description || '',
      email: settingsMap.site_email || '',
      telephone: settingsMap.site_phone || '',
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'EG',
        addressLocality: settingsMap.site_address_ar || ''
      },
      sameAs: [
        settingsMap.social_facebook,
        settingsMap.social_instagram,
        settingsMap.social_twitter
      ].filter(Boolean)
    }

    // Build WebSite schema
    const websiteSchema = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: settingsMap.business_name || 'Astar - استآر',
      url: baseUrl,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${baseUrl}/search?q={search_term_string}`,
        'query-input': 'required name=search_term_string'
      }
    }

    // Validation checks
    const issues: string[] = []
    const warnings: string[] = []

    // Check required fields
    if (!settingsMap.seo_title) {
      issues.push('عنوان الموقع (Title) غير محدد')
    } else if (settingsMap.seo_title.length > 60) {
      warnings.push('عنوان الموقع طويل جداً (أكثر من 60 حرف)')
    }

    if (!settingsMap.seo_description) {
      issues.push('وصف الموقع (Description) غير محدد')
    } else if (settingsMap.seo_description.length > 160) {
      warnings.push('وصف الموقع طويل جداً (أكثر من 160 حرف)')
    }

    if (!settingsMap.og_image) {
      warnings.push('صورة Open Graph غير محددة - لن يظهر الموقع بشكل جيد عند المشاركة')
    }

    if (!settingsMap.google_site_verification) {
      warnings.push('الموقع غير موثق في Google Search Console')
    }

    if (!settingsMap.seo_keywords) {
      warnings.push('الكلمات المفتاحية غير محددة')
    }

    // Build result
    const isValid = issues.length === 0
    const message = isValid 
      ? warnings.length > 0 
        ? `Structured Data صالح مع ${warnings.length} تحذيرات` 
        : 'Structured Data صالح ومكتمل'
      : `يوجد ${issues.length} مشاكل يجب إصلاحها`

    return NextResponse.json({
      success: true,
      isValid,
      message,
      issues,
      warnings,
      schemas: {
        organization: organizationSchema,
        website: websiteSchema
      },
      score: calculateSEOScore(settingsMap, issues, warnings)
    })
  } catch (error) {
    console.error('Error validating SEO:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to validate SEO settings',
      message: 'فشل في التحقق من إعدادات SEO'
    }, { status: 500 })
  }
}

function calculateSEOScore(
  settings: Record<string, string>, 
  issues: string[], 
  warnings: string[]
): number {
  let score = 100

  // Deduct for issues
  score -= issues.length * 20

  // Deduct for warnings
  score -= warnings.length * 5

  // Bonus for completeness
  if (settings.seo_title && settings.seo_description && settings.seo_keywords) {
    score += 5
  }
  if (settings.og_image) {
    score += 5
  }
  if (settings.google_site_verification) {
    score += 5
  }
  if (settings.business_logo) {
    score += 3
  }

  return Math.max(0, Math.min(100, score))
}
