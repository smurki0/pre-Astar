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

    const type = mimeFromUrl(favicon)
    // Cache-bust so a freshly uploaded favicon shows immediately.
    const href = favicon.startsWith('/uploads/') ? `${favicon}?v=${Date.now()}` : favicon

    // IMPORTANT: never removeChild() the <link> nodes that Next.js metadata and
    // React 19 metadata hoisting inject into <head>. Doing so detaches nodes
    // React still owns, and React's next <head> reconciliation then calls
    // removeChild on a node whose parent is already null ->
    // "Cannot read properties of null (reading 'removeChild')". That thrown
    // error aborts React's commit/cleanup phase, which in turn leaves Radix's
    // scroll-lock (pointer-events:none on <body>) stuck -> the whole UI needs a
    // second click / refresh. Instead we own exactly two <link> nodes (by id)
    // and only update those, leaving React-managed head nodes untouched.
    const upsert = (id: string, rel: string) => {
      let el = document.getElementById(id) as HTMLLinkElement | null
      if (!el) {
        el = document.createElement('link')
        el.id = id
        el.rel = rel
        document.head.appendChild(el)
      }
      if (type) el.type = type
      el.href = href
    }

    upsert('astar-managed-favicon', 'icon')
    upsert('astar-managed-apple-icon', 'apple-touch-icon')
  }, [favicon])

  return null
}

export default FaviconManager
