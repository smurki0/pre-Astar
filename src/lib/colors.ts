/**
 * Shared color utilities for the application
 * Centralized color hex mapping to avoid duplication
 */

// Predefined colors mapping for display
export const colorHexMap: Record<string, string> = {
  // Arabic colors
  'أسود': '#000000',
  'أبيض': '#FFFFFF',
  'بيج': '#F5F5DC',
  'كحلي': '#191970',
  'رمادي': '#808080',
  'بني': '#8B4513',
  'عنابي': '#722F37',
  'زيتي': '#556B2F',
  'كريمي': '#FFFDD0',
  'وردي': '#FFC0CB',
  'فستقي': '#93C572',
  'خمري': '#4A0E0E',
  
  // English colors
  'Black': '#000000',
  'White': '#FFFFFF',
  'Beige': '#F5F5DC',
  'Navy': '#191970',
  'Gray': '#808080',
  'Brown': '#8B4513',
  'Burgundy': '#722F37',
  'Olive': '#556B2F',
  'Cream': '#FFFDD0',
  'Pink': '#FFC0CB',
  'Pistachio': '#93C572',
  'Wine': '#4A0E0E',
  
  // Additional common colors
  'أخضر': '#228B22',
  'أزرق': '#0000FF',
  'أحمر': '#FF0000',
  'أصفر': '#FFD700',
  'بنفسجي': '#8B00FF',
  'برتقالي': '#FFA500',
  'Green': '#228B22',
  'Blue': '#0000FF',
  'Red': '#FF0000',
  'Yellow': '#FFD700',
  'Purple': '#8B00FF',
  'Orange': '#FFA500',
}

/**
 * Neutral last-resort swatch color. Only used when there is genuinely no
 * stored hex AND the name is unknown. Valid custom colors always carry a
 * stored `colorHex`, so they never reach this fallback.
 */
export const DEFAULT_SWATCH_HEX = '#808080';

// Accepts #RGB or #RRGGBB (case-insensitive).
const HEX_REGEX = /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/;

/**
 * True when `value` is a valid CSS hex color string.
 */
export function isHexColor(value: unknown): value is string {
  return typeof value === 'string' && HEX_REGEX.test(value.trim());
}

/**
 * Resolve a single string into a hex value.
 * - Valid hex → returned as-is (trimmed).
 * - Known color name (Arabic/English) → mapped hex.
 * - Otherwise → neutral default.
 */
function resolveHexOrName(input: string): string {
  const trimmed = input.trim();
  if (isHexColor(trimmed)) return trimmed;
  return colorHexMap[trimmed] || DEFAULT_SWATCH_HEX;
}

/**
 * Shape of any color-bearing object used anywhere in the app.
 * Different layers historically used different field names; this type lets
 * the single resolver accept all of them.
 */
export interface ColorLike {
  colorHex?: string | null;
  hex?: string | null;
  value?: string | null;
  code?: string | null;
  backgroundColor?: string | null;
  color?: string | null;
  name?: string | null;
  label?: string | null;
}

/**
 * SINGLE SOURCE OF TRUTH for rendering a product color swatch.
 *
 * Accepts either a plain string (hex or color name) or any color-like object
 * (variant, admin color, cart item, ...). Always prefers a STORED hex value,
 * so a custom color added via the Color Picker / manual HEX renders exactly.
 * Falls back to the name map only when no valid hex is present, and to a
 * neutral default only as a last resort.
 *
 * Every component that renders a color swatch MUST use this helper instead of
 * implementing its own resolution logic.
 */
export function getProductColorHex(
  color: string | null | undefined | ColorLike
): string {
  if (color == null) return DEFAULT_SWATCH_HEX;

  if (typeof color === 'string') {
    return resolveHexOrName(color);
  }

  // 1) Prefer any field that already holds a valid stored hex.
  const hexFields = [
    color.colorHex,
    color.hex,
    color.value,
    color.code,
    color.backgroundColor,
  ];
  for (const candidate of hexFields) {
    if (isHexColor(candidate)) return (candidate as string).trim();
  }

  // 2) Otherwise fall back to a name-like field (which may itself be a hex).
  const nameFields = [color.color, color.name, color.label];
  for (const candidate of nameFields) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return resolveHexOrName(candidate);
    }
  }

  return DEFAULT_SWATCH_HEX;
}

/**
 * Backward-compatible wrappers. Both now delegate to the single resolver so
 * the whole app shares one normalized color source.
 */
export function getColorHexSafe(colorInput: string | null | undefined): string {
  return getProductColorHex(colorInput ?? null);
}

export function getColorHex(colorName: string | null | undefined): string {
  return getProductColorHex(colorName ?? null);
}

/**
 * Check if a color name exists in the map
 */
export function isColorNameValid(colorName: string): boolean {
  return colorName in colorHexMap
}

/**
 * Get all color names (for dropdowns, etc.)
 */
export function getAllColorNames(): string[] {
  return Object.keys(colorHexMap)
}

/**
 * Predefined colors for admin forms
 */
export const predefinedColors = [
  // Basic Colors
  { nameAr: 'أسود', nameEn: 'Black', hex: '#000000' },
  { nameAr: 'أبيض', nameEn: 'White', hex: '#FFFFFF' },
  { nameAr: 'رمادي', nameEn: 'Gray', hex: '#808080' },
  { nameAr: 'رمادي فاتح', nameEn: 'Light Gray', hex: '#D3D3D3' },
  
  // Reds
  { nameAr: 'أحمر', nameEn: 'Red', hex: '#FF0000' },
  { nameAr: 'أحمر غامق', nameEn: 'Dark Red', hex: '#8B0000' },
  { nameAr: 'عنابي', nameEn: 'Burgundy', hex: '#800020' },
  { nameAr: 'وردي', nameEn: 'Pink', hex: '#FFC0CB' },
  { nameAr: 'وردي فاتح', nameEn: 'Light Pink', hex: '#FFB6C1' },
  
  // Blues
  { nameAr: 'أزرق', nameEn: 'Blue', hex: '#0000FF' },
  { nameAr: 'كحلي', nameEn: 'Navy', hex: '#000080' },
  { nameAr: 'أزرق فاتح', nameEn: 'Light Blue', hex: '#ADD8E6' },
  { nameAr: 'فيروزي', nameEn: 'Turquoise', hex: '#40E0D0' },
  
  // Greens
  { nameAr: 'أخضر', nameEn: 'Green', hex: '#008000' },
  { nameAr: 'زيتي', nameEn: 'Olive', hex: '#808000' },
  { nameAr: 'فستقي', nameEn: 'Pistachio', hex: '#93C572' },
  { nameAr: 'أخضر فاتح', nameEn: 'Light Green', hex: '#90EE90' },
  
  // Browns/Beiges
  { nameAr: 'بني', nameEn: 'Brown', hex: '#A52A2A' },
  { nameAr: 'بيج', nameEn: 'Beige', hex: '#F5F5DC' },
  { nameAr: 'كريمي', nameEn: 'Cream', hex: '#FFFDD0' },
  { nameAr: 'شوكولاته', nameEn: 'Chocolate', hex: '#D2691E' },
  
  // Purples
  { nameAr: 'بنفسجي', nameEn: 'Purple', hex: '#800080' },
  { nameAr: 'لافندر', nameEn: 'Lavender', hex: '#E6E6FA' },
  
  // Yellows/Oranges
  { nameAr: 'أصفر', nameEn: 'Yellow', hex: '#FFFF00' },
  { nameAr: 'برتقالي', nameEn: 'Orange', hex: '#FFA500' },
  { nameAr: 'ذهبي', nameEn: 'Golden', hex: '#FFD700' },
  
  // Neutrals
  { nameAr: 'خمري', nameEn: 'Wine', hex: '#722F37' },
  { nameAr: 'كستنائي', nameEn: 'Chestnut', hex: '#954535' },
  { nameAr: 'سمكي', nameEn: 'Smoky', hex: '#738276' },
  
  // 70+ Colors Total
  { nameAr: 'فضي', nameEn: 'Silver', hex: '#C0C0C0' },
  { nameAr: 'نحاسي', nameEn: 'Copper', hex: '#B87333' },
  { nameAr: 'برونزي', nameEn: 'Bronze', hex: '#CD7F32' },
  { nameAr: 'زمردي', nameEn: 'Emerald', hex: '#50C878' },
  { nameAr: 'ياقوتي', nameEn: 'Ruby', hex: '#E0115F' },
  { nameAr: 'سماوي', nameEn: 'Sky Blue', hex: '#87CEEB' },
  { nameAr: 'نيلي', nameEn: 'Indigo', hex: '#4B0082' },
  { nameAr: 'جملي', nameEn: 'Camel', hex: '#C19A6B' },
  { nameAr: 'عاجي', nameEn: 'Ivory', hex: '#FFFFF0' },
  { nameAr: 'ليموني', nameEn: 'Lemon', hex: '#FFF44F' },
  
  // Add 50+ more as needed...
];

/**
 * Predefined sizes for admin forms
 */
export const predefinedSizes = [
  'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL',
  '36', '38', '40', '42', '44', '46', '48', '50', '52', '54', '56',
  'One Size', 'فري سايز'
]
