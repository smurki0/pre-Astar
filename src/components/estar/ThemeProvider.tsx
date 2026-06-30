'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes'
import { SETTINGS_UPDATED_EVENT } from '@/hooks/useSiteSettings'
import { csrfFetch } from '@/lib/csrf-fetch'

interface ThemeProviderProps {
  children: React.ReactNode
  attribute?: 'class' | 'data-theme'
  defaultTheme?: string
  enableSystem?: boolean
  disableTransitionOnChange?: boolean
}

// Default colors from globals.css - Light theme
const defaultLightColors = {
  primary: '#C4A4A4',
  secondary: '#F5EDE6',
  background: '#FFFBF9',
  accent: '#FDE8E8',
  ring: '#C4A4A4',
}

// Default colors from globals.css - Dark theme
const defaultDarkColors = {
  primary: '#B8968A',
  secondary: '#2E2A28',
  background: '#1A1817',
  accent: '#3A3330',
  ring: '#B8968A',
}

// Function to apply custom colors to CSS variables
// ONLY applies custom colors in light mode - dark mode uses globals.css .dark class
function applyCustomColors(settings: {
  primary_color?: string
  secondary_color?: string
  button_color?: string
  background_color?: string
  font_family?: string
  font_size?: string
}, isDark: boolean = false) {
  if (typeof window === 'undefined') return

  const root = document.documentElement

  // In dark mode, remove inline styles to let .dark class CSS variables work
  if (isDark) {
    // Remove inline color styles so .dark class in globals.css takes effect
    root.style.removeProperty('--primary')
    root.style.removeProperty('--ring')
    root.style.removeProperty('--sidebar-primary')
    root.style.removeProperty('--sidebar-ring')
    root.style.removeProperty('--chart-1')
    root.style.removeProperty('--secondary')
    root.style.removeProperty('--chart-2')
    root.style.removeProperty('--accent')
    root.style.removeProperty('--background')
    
    // Still apply font settings in dark mode
    if (settings.font_family) {
      root.style.setProperty('--font-sans', `'${settings.font_family}', sans-serif`)
      document.body.style.fontFamily = `'${settings.font_family}', sans-serif`
    }
    if (settings.font_size) {
      root.style.setProperty('--font-size-base', `${settings.font_size}px`)
      document.body.style.fontSize = `${settings.font_size}px`
    }
    return
  }

  // Light mode: Apply custom colors from settings
  const defaults = defaultLightColors
  
  const primaryColor = settings.primary_color || defaults.primary
  const secondaryColor = settings.secondary_color || defaults.secondary
  const backgroundColor = settings.background_color || defaults.background
  const buttonColor = settings.button_color || primaryColor

  // Apply primary color
  root.style.setProperty('--primary', primaryColor)
  root.style.setProperty('--ring', primaryColor)
  root.style.setProperty('--sidebar-primary', primaryColor)
  root.style.setProperty('--sidebar-ring', primaryColor)
  root.style.setProperty('--chart-1', primaryColor)

  // Apply secondary color
  root.style.setProperty('--secondary', secondaryColor)
  root.style.setProperty('--chart-2', secondaryColor)

  // Apply button/accent color
  root.style.setProperty('--accent', buttonColor)

  // Apply background color
  root.style.setProperty('--background', backgroundColor)

  // Apply font family
  if (settings.font_family) {
    root.style.setProperty('--font-sans', `'${settings.font_family}', sans-serif`)
    document.body.style.fontFamily = `'${settings.font_family}', sans-serif`
  }

  // Apply font size
  if (settings.font_size) {
    root.style.setProperty('--font-size-base', `${settings.font_size}px`)
    document.body.style.fontSize = `${settings.font_size}px`
  }
}

// Inner component that has access to theme
function ThemeColorApplier({ children }: { children: React.ReactNode }) {
  const { theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Apply colors on mount and when theme/settings change
  const applyColorsFromSettings = React.useCallback(() => {
    csrfFetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.settings) {
          const isDark = resolvedTheme === 'dark' || theme === 'dark'
          applyCustomColors({
            primary_color: data.settings.primary_color,
            secondary_color: data.settings.secondary_color,
            button_color: data.settings.button_color,
            background_color: data.settings.background_color,
            font_family: data.settings.font_family,
            font_size: data.settings.font_size,
          }, isDark)
        }
      })
      .catch(console.error)
  }, [theme, resolvedTheme])

  React.useEffect(() => {
    if (mounted) {
      applyColorsFromSettings()
    }

    // Listen for settings updates
    const handleSettingsUpdate = () => {
      applyColorsFromSettings()
    }

    window.addEventListener(SETTINGS_UPDATED_EVENT, handleSettingsUpdate)

    // Listen for storage changes (cross-tab sync)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'estar-settings-updated') {
        applyColorsFromSettings()
      }
    }
    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener(SETTINGS_UPDATED_EVENT, handleSettingsUpdate)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [mounted, applyColorsFromSettings])

  // Re-apply colors when theme changes
  React.useEffect(() => {
    if (mounted) {
      applyColorsFromSettings()
    }
  }, [theme, resolvedTheme, mounted, applyColorsFromSettings])

  return <>{children}</>
}

export function ThemeProvider({
  children,
  attribute = 'class',
  defaultTheme = 'light',
  enableSystem = true,
  disableTransitionOnChange = false,
  ...props
}: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute={attribute}
      defaultTheme={defaultTheme}
      enableSystem={enableSystem}
      disableTransitionOnChange={disableTransitionOnChange}
      {...props}
    >
      <ThemeColorApplier>{children}</ThemeColorApplier>
    </NextThemesProvider>
  )
}
