'use client'

import * as React from 'react'
import {
  defaultWhatsAppSettings,
  parseWhatsAppSettings,
  type WhatsAppSettings,
} from '@/lib/whatsapp'
import { SETTINGS_UPDATED_EVENT } from '@/hooks/useSiteSettings'

interface WhatsAppSettingsContextType {
  settings: WhatsAppSettings
  loading: boolean
  refetch: () => Promise<void>
}

const WhatsAppSettingsContext = React.createContext<WhatsAppSettingsContextType>({
  settings: defaultWhatsAppSettings,
  loading: true,
  refetch: async () => {},
})

export function WhatsAppSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = React.useState<WhatsAppSettings>(defaultWhatsAppSettings)
  const [loading, setLoading] = React.useState(true)

  const fetchSettings = React.useCallback(async () => {
    try {
      // `no-store` so a save is reflected immediately (bypasses the CDN s-maxage).
      const response = await fetch('/api/whatsapp', { cache: 'no-store' })
      if (response.ok) {
        const data = await response.json()
        setSettings(parseWhatsAppSettings(data.settings))
      }
    } catch (error) {
      console.error('Error fetching WhatsApp settings:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchSettings()

    // Reuse the storefront's existing "settings updated" signal so an admin
    // save (which calls dispatchSettingsUpdate) refreshes the live button
    // instantly, including across tabs via the storage event.
    const handleUpdate = () => {
      fetchSettings()
    }
    window.addEventListener(SETTINGS_UPDATED_EVENT, handleUpdate)

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'estar-settings-updated') fetchSettings()
    }
    window.addEventListener('storage', handleStorage)

    return () => {
      window.removeEventListener(SETTINGS_UPDATED_EVENT, handleUpdate)
      window.removeEventListener('storage', handleStorage)
    }
  }, [fetchSettings])

  const value = React.useMemo(
    () => ({ settings, loading, refetch: fetchSettings }),
    [settings, loading, fetchSettings],
  )

  return (
    <WhatsAppSettingsContext.Provider value={value}>
      {children}
    </WhatsAppSettingsContext.Provider>
  )
}

export function useWhatsAppSettings() {
  return React.useContext(WhatsAppSettingsContext)
}

export default useWhatsAppSettings
