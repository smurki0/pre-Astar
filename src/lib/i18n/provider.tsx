'use client'

import * as React from 'react'
import { useUIStore } from '@/store'
import {
  translations,
  type TranslationKeys,
  type SupportedLanguage,
  defaultLanguage,
  supportedLanguages,
  languageDirections,
} from './translations'

// Helper function to get nested value from object using dot notation
function getNestedValue(obj: any, path: string): string | undefined {
  return path.split('.').reduce((acc, part) => acc?.[part], obj)
}

// Helper function to replace variables in translation string
function replaceVariables(str: string, variables?: Record<string, string | number>): string {
  if (!variables) return str
  return Object.entries(variables).reduce(
    (result, [key, value]) => result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value)),
    str
  )
}

interface I18nContextType {
  // Current language
  language: SupportedLanguage
  setLanguage: (lang: SupportedLanguage) => void
  toggleLanguage: () => void
  
  // Translation function
  t: (key: string, variables?: Record<string, string | number>) => string
  
  // RTL support
  isRTL: boolean
  dir: 'rtl' | 'ltr'
  
  // Language info
  languageName: string
  oppositeLanguage: SupportedLanguage
  oppositeLanguageName: string
  
  // Utility
  formatDate: (date: Date | string, options?: Intl.DateTimeFormatOptions) => string
  formatNumber: (number: number, options?: Intl.NumberFormatOptions) => string
  formatCurrency: (amount: number) => string
}

const I18nContext = React.createContext<I18nContextType | undefined>(undefined)

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const { language, setLanguage, toggleLanguage } = useUIStore()
  
  // Ensure language is a supported language
  const currentLanguage = supportedLanguages.includes(language as SupportedLanguage)
    ? (language as SupportedLanguage)
    : defaultLanguage
  
  // Translation function with nested key support and variable replacement
  const t = React.useCallback(
    (key: string, variables?: Record<string, string | number>): string => {
      const translation = getNestedValue(translations[currentLanguage], key)
      
      if (translation === undefined) {
        console.warn(`Translation not found for key: ${key}`)
        return key
      }
      
      return replaceVariables(translation, variables)
    },
    [currentLanguage]
  )
  
  // RTL support
  const isRTL = languageDirections[currentLanguage] === 'rtl'
  const dir = languageDirections[currentLanguage]
  
  // Language names
  const languageName = currentLanguage === 'ar' ? 'العربية' : 'English'
  const oppositeLanguage: SupportedLanguage = currentLanguage === 'ar' ? 'en' : 'ar'
  const oppositeLanguageName = currentLanguage === 'ar' ? 'English' : 'العربية'
  
  // Update document direction and lang attribute
  React.useEffect(() => {
    document.documentElement.dir = dir
    document.documentElement.lang = currentLanguage
    
    // Update body class for RTL styling
    if (isRTL) {
      document.body.classList.add('rtl')
      document.body.classList.remove('ltr')
    } else {
      document.body.classList.add('ltr')
      document.body.classList.remove('rtl')
    }
  }, [dir, currentLanguage, isRTL])
  
  // Date formatter
  const formatDate = React.useCallback(
    (date: Date | string, options?: Intl.DateTimeFormatOptions): string => {
      const d = typeof date === 'string' ? new Date(date) : date
      return new Intl.DateTimeFormat(currentLanguage === 'ar' ? 'ar-EG' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        ...options,
      }).format(d)
    },
    [currentLanguage]
  )
  
  // Number formatter
  const formatNumber = React.useCallback(
    (number: number, options?: Intl.NumberFormatOptions): string => {
      return new Intl.NumberFormat(currentLanguage === 'ar' ? 'ar-EG' : 'en-US', options).format(number)
    },
    [currentLanguage]
  )
  
  // Currency formatter (Egyptian Pound)
  const formatCurrency = React.useCallback(
    (amount: number): string => {
      const formatted = new Intl.NumberFormat(currentLanguage === 'ar' ? 'ar-EG' : 'en-US', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(amount)
      
      return currentLanguage === 'ar' ? `${formatted} ج.م` : `${formatted} EGP`
    },
    [currentLanguage]
  )
  
  const value = React.useMemo(
    () => ({
      language: currentLanguage,
      setLanguage: setLanguage as (lang: SupportedLanguage) => void,
      toggleLanguage,
      t,
      isRTL,
      dir,
      languageName,
      oppositeLanguage,
      oppositeLanguageName,
      formatDate,
      formatNumber,
      formatCurrency,
    }),
    [
      currentLanguage,
      setLanguage,
      toggleLanguage,
      t,
      isRTL,
      dir,
      languageName,
      oppositeLanguage,
      oppositeLanguageName,
      formatDate,
      formatNumber,
      formatCurrency,
    ]
  )
  
  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  )
}

// Custom hook to use i18n
export function useI18n() {
  const context = React.useContext(I18nContext)
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return context
}

// Alias for backward compatibility
export const useLanguage = useI18n

// Re-export translations for direct access
export { translations }
export type { TranslationKeys as Translations }
