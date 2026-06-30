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
 * Get hex color from color name or hex string
 * If input is valid hex → returns it
 * Else looks up predefined map → gray fallback
 */
export function getColorHexSafe(colorInput: string): string {
  // Check if valid hex
  const hexRegex = /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/;
  if (hexRegex.test(colorInput)) {
    return colorInput;
  }
  // Lookup predefined
  return colorHexMap[colorInput] || '#808080';
}

/**
 * Legacy: Get hex color from color name (for backward compat)
 * Returns a default gray color if the color name is not found
 */
export function getColorHex(colorName: string): string {
  return getColorHexSafe(colorName);
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
