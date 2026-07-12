import { db } from '@/lib/db'
import { headers } from 'next/headers'

/**
 * Resolve the canonical site origin (e.g. https://astar.com) used across all
 * SEO surfaces (metadata, sitemap, robots, JSON-LD).
 *
 * Priority:
 *   1. NEXT_PUBLIC_APP_URL / NEXT_PUBLIC_SITE_URL env (explicit, most reliable)
 *   2. canonical_url setting saved by the admin in Settings -> SEO
 *   3. The incoming request Host header (works on Vercel/preview/prod)
 *   4. http://localhost:3000 (local dev fallback)
 *
 * NOTE: the previous code used the buggy expression
 *   `env || host ? https://host : localhost`
 * which (due to `?:` precedence) ALWAYS ignored the env var. This helper fixes
 * that and centralises the logic so every route agrees on one origin.
 */
export async function getSiteOrigin(explicitCanonical?: string): Promise<string> {
  const fromEnv =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (fromEnv) return stripTrailingSlash(fromEnv)

  if (explicitCanonical?.trim()) return stripTrailingSlash(explicitCanonical.trim())

  try {
    const h = await headers()
    const host = h.get('host')
    if (host) {
      const proto = h.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https')
      return stripTrailingSlash(`${proto}://${host}`)
    }
  } catch {
    // headers() unavailable (e.g. build) -> fall through
  }
  return 'http://localhost:3000'
}

/** Same resolution but from a plain Request (for route handlers). */
export function getSiteOriginFromRequest(request: Request, canonicalUrl?: string): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (fromEnv) return stripTrailingSlash(fromEnv)
  if (canonicalUrl?.trim()) return stripTrailingSlash(canonicalUrl.trim())

  const host = request.headers.get('host')
  if (host) {
    const proto =
      request.headers.get('x-forwarded-proto') ||
      (host.includes('localhost') ? 'http' : 'https')
    return stripTrailingSlash(`${proto}://${host}`)
  }
  return 'http://localhost:3000'
}

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '')
}

/** Load all settings whose key starts with an SEO-related prefix, as a map. */
export async function getSeoSettings(): Promise<Record<string, string>> {
  try {
    const rows = await db.setting.findMany({
      where: {
        OR: [
          { key: { startsWith: 'seo_' } },
          { key: { startsWith: 'og_' } },
          { key: { startsWith: 'twitter_' } },
          { key: { startsWith: 'robots_' } },
          { key: { startsWith: 'sitemap_' } },
          { key: { startsWith: 'social_' } },
          { key: { startsWith: 'site_' } },
          { key: { in: ['business_name', 'business_logo', 'schema_org_type', 'canonical_url', 'google_site_verification', 'bing_webmaster_verification', 'yandex_verification'] } },
        ],
      },
    })
    return Object.fromEntries(rows.map((r) => [r.key, r.value]))
  } catch {
    return {}
  }
}

/**
 * This storefront is a single-page app that swaps content via `?view=` query
 * params (there are no /product/[slug] routes). Build the REAL crawlable URLs
 * so the sitemap does not point at 404s.
 */
export function buildStoreUrl(origin: string, view?: string, params?: Record<string, string>): string {
  if (!view || view === 'home') return origin + '/'
  const qs = new URLSearchParams({ view, ...(params || {}) })
  return `${origin}/?${qs.toString()}`
}
