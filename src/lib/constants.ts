/**
 * Shared application constants.
 * Keeping limits in one place guarantees the frontend, the admin UI and the
 * API enforce exactly the same rules (no drift between layers).
 */

/** Maximum number of images allowed per product (shared + per-colour combined). */
export const MAX_PRODUCT_IMAGES = 10

/** Maximum upload size for a single image, in bytes (5 MB). */
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024

/** Hex colour validation (#RGB or #RRGGBB). */
export const HEX_COLOR_REGEX = /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/

/** Returns true when the value is a syntactically valid hex colour. */
export function isValidHexColor(value: unknown): value is string {
  return typeof value === 'string' && HEX_COLOR_REGEX.test(value.trim())
}
