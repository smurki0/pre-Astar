'use client'

import * as React from 'react'
import { useSiteSettings } from '@/hooks/useSiteSettings'

// Default favicon shipped with the app. Used when no favicon is set in admin.
const DEFAULT_FAVICON = '/favicon.svg'

function mimeFromUrl(url: string): string {
  const clean = url.split('?')[0].toLowerCase()
  if (clean.endsWith('.svg')) return 'image/svg+xml'
  if (clean.endsWith('.png')) return 'image/png'
  if (clean.endsWith('.ico')) return 'image/x-icon'
  if (clean.endsWith('.jpg') || clean.endsWith('.jpeg')) return 'image/jpeg'
  if (clean.endsWith('.gif')) return 'image/gif'
  if (clean.endsWith('.webp')) return 'image/webp'
  return ''
}

/**
 * Keeps the browser tab favicon in sync with the `site_favicon` value
 * managed from the admin settings page. Falls back to the bundled
 * /favicon.svg when nothing is configured.
 */
export function FaviconManager() {
  const { settings } = useSiteSettings()
  const favicon = settings.site_favicon?.trim() || DEFAULT_FAVICON

  React.useEffect(() => {
    if (typeof document === 'undefined') return

    // Remove any existing icon links so the admin value fully takes over.
    document
      .querySelectorAll('link[rel~="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]')
      .forEach((el) => el.parentNode?.removeChild(el))

    const type = mimeFromUrl(favicon)

    const icon = document.createElement('link')
    icon.rel = 'icon'
    if (type) icon.type = type
    // Cache-bust so a freshly uploaded favicon shows immediately.
    icon.href = favicon.startsWith('/uploads/') ? `${favicon}?v=${Date.now()}` : favicon
    document.head.appendChild(icon)

    const apple = document.createElement('link')
    apple.rel = 'apple-touch-icon'
    apple.href = icon.href
    document.head.appendChild(apple)
  }, [favicon])

  return null
}

export default FaviconManager
