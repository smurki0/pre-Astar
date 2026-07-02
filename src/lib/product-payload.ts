/**
 * Shared helpers for validating and normalising the product create/update
 * payload. Used by both POST /api/admin/products and PUT /api/admin/products/[id]
 * so the two endpoints can never diverge.
 */
import { MAX_PRODUCT_IMAGES, isValidHexColor } from '@/lib/constants'

export type IncomingImage = { url: string; alt?: string; color?: string | null }
export type IncomingVariant = {
  name: string
  sku: string
  price?: number
  quantity: number
  color?: string | null
  size?: string | null
  colorHex?: string | null
  available?: boolean
}

export type NormalizedImage = { url: string; alt: string; color: string | null; position: number }
export type NormalizedVariant = {
  name: string
  sku: string
  price: number | null
  quantity: number
  color: string | null
  size: string | null
  colorHex: string | null
  available: boolean
}

/**
 * Validates and normalises the images payload.
 * Returns an `error` string when invalid, otherwise the cleaned image rows.
 * NULL `color` = shared image (shown for every colour / legacy products).
 */
export function normalizeImages(
  images: unknown
): { error: string } | { rows: NormalizedImage[] } {
  if (images === undefined || images === null) return { rows: [] }
  if (!Array.isArray(images)) return { error: 'images must be an array' }
  const rows = (images as IncomingImage[])
    .filter((img) => img && typeof img.url === 'string' && img.url.trim().length > 0)
    .map((img, index) => ({
      url: img.url,
      alt: img.alt || '',
      color: typeof img.color === 'string' && img.color.trim() ? img.color.trim() : null,
      position: index,
    }))

  // Enforce the image limit PER colour group (shared/untagged images form their
  // own group). Each colour has its own independent allowance — there is no
  // combined total cap across colours.
  const countByGroup = new Map<string, number>()
  for (const row of rows) {
    const key = row.color ?? '__shared__'
    const next = (countByGroup.get(key) ?? 0) + 1
    if (next > MAX_PRODUCT_IMAGES) {
      const label = row.color ? `colour "${row.color}"` : 'shared images'
      return { error: `Maximum ${MAX_PRODUCT_IMAGES} images allowed for ${label}` }
    }
    countByGroup.set(key, next)
  }

  return { rows }
}

/**
 * Normalises variants, persisting a *validated* hex colour.
 * Invalid/missing hex becomes NULL (never a silent grey fallback in storage).
 */
export function normalizeVariants(variants: unknown): NormalizedVariant[] {
  if (!Array.isArray(variants)) return []
  return (variants as IncomingVariant[]).map((v) => ({
    name: v.name,
    sku: v.sku,
    price: v.price ?? null,
    quantity: v.quantity || 0,
    color: v.color || null,
    size: v.size || null,
    colorHex: isValidHexColor(v.colorHex) ? (v.colorHex as string) : null,
    // Defaults to available unless the admin explicitly marked it unavailable.
    available: v.available !== false,
  }))
}
