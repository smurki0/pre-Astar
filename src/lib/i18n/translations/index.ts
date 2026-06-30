import { en, type TranslationKeys } from './en'
import { ar } from './ar'

export const translations = {
  en,
  ar,
} as const

export type { TranslationKeys }
export { en, ar }

// Helper type for nested keys
type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & string]: ObjectType[Key] extends object
    ? `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : Key
}[keyof ObjectType & string]

export type TranslationKey = NestedKeyOf<TranslationKeys>

// Default language
export const defaultLanguage = 'ar' as const

// Supported languages
export const supportedLanguages = ['ar', 'en'] as const
export type SupportedLanguage = (typeof supportedLanguages)[number]

// Language names
export const languageNames: Record<SupportedLanguage, { native: string; english: string }> = {
  ar: { native: 'العربية', english: 'Arabic' },
  en: { native: 'English', english: 'English' },
}

// Language directions
export const languageDirections: Record<SupportedLanguage, 'rtl' | 'ltr'> = {
  ar: 'rtl',
  en: 'ltr',
}
