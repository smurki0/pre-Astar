'use client'

import * as React from 'react'
import { useSearchParams } from 'next/navigation'
import { useWhatsAppSettings } from '@/hooks/useWhatsAppSettings'
import { useI18n } from '@/lib/i18n'
import { useIsMobile } from '@/hooks/use-mobile'
import { buildWhatsAppUrl, isVisibleOnPage, resolvePageKind } from '@/lib/whatsapp'
import { WhatsAppButtonView } from './WhatsAppButtonView'

function WhatsAppButtonInner() {
  const { settings, loading } = useWhatsAppSettings()
  const { language } = useI18n()
  const isMobile = useIsMobile()
  const searchParams = useSearchParams()
  const view = searchParams.get('view')

  const [mounted, setMounted] = React.useState(false)
  const [scrolledEnough, setScrolledEnough] = React.useState(false)
  const [delayPassed, setDelayPassed] = React.useState(false)

  // Avoid SSR/CSR mismatch: this is a client-only overlay.
  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Delay-before-showing.
  React.useEffect(() => {
    if (settings.delaySeconds <= 0) {
      setDelayPassed(true)
      return
    }
    setDelayPassed(false)
    const t = setTimeout(() => setDelayPassed(true), settings.delaySeconds * 1000)
    return () => clearTimeout(t)
  }, [settings.delaySeconds])

  // Show-after-scroll threshold.
  React.useEffect(() => {
    if (settings.showAfterScroll <= 0) {
      setScrolledEnough(true)
      return
    }
    const check = () => setScrolledEnough(window.scrollY >= settings.showAfterScroll)
    check()
    window.addEventListener('scroll', check, { passive: true })
    return () => window.removeEventListener('scroll', check)
  }, [settings.showAfterScroll])

  const device: 'mobile' | 'desktop' = isMobile ? 'mobile' : 'desktop'

  const recordClick = React.useCallback(() => {
    try {
      const { view: pageView } = resolvePageKind(view)
      const payload = JSON.stringify({ device, page: pageView })
      // Prefer sendBeacon so the write survives the tab losing focus; fall back
      // to keepalive fetch. Fire-and-forget: never blocks opening WhatsApp.
      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        navigator.sendBeacon('/api/whatsapp/click', new Blob([payload], { type: 'application/json' }))
      } else {
        fetch('/api/whatsapp/click', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true,
        }).catch(() => {})
      }
    } catch {
      // Analytics must never break the click.
    }
  }, [device, view])

  // ---- Visibility gating ----
  if (!mounted || loading) return null
  if (!settings.enabled) return null

  const href = buildWhatsAppUrl(
    settings.phoneNumber,
    language === 'ar' ? settings.messageAr : settings.messageEn,
  )
  if (!href) return null // no phone number configured -> nothing to link to

  if (!isVisibleOnPage(settings, view)) return null
  if (device === 'mobile' && settings.hideOnMobile) return null
  if (device === 'desktop' && settings.hideOnDesktop) return null
  if (!scrolledEnough || !delayPassed) return null

  // ---- Positioning (physical corners; explicit left/right is RTL-safe) ----
  const isBottom = settings.position === 'bottom-right' || settings.position === 'bottom-left'
  const isRight = settings.position === 'bottom-right' || settings.position === 'top-right'

  const deviceOverride = device === 'mobile' ? settings.mobileSpacing : settings.desktopSpacing
  const vertical = deviceOverride > 0 ? deviceOverride : settings.bottomSpacing
  const horizontal = deviceOverride > 0 ? deviceOverride : settings.sideSpacing

  const wrapperStyle: React.CSSProperties = { '--wa-z': settings.zIndex } as React.CSSProperties
  if (isBottom) wrapperStyle.bottom = `${vertical}px`
  else wrapperStyle.top = `${vertical}px`
  if (isRight) wrapperStyle.right = `${horizontal}px`
  else wrapperStyle.left = `${horizontal}px`

  return (
    <div className="wa-fab-wrapper" style={wrapperStyle} data-whatsapp-button>
      <WhatsAppButtonView
        settings={settings}
        lang={language === 'ar' ? 'ar' : 'en'}
        device={device}
        href={href}
        onClick={recordClick}
      />
    </div>
  )
}

/**
 * Floating WhatsApp chat button, mounted once in the root layout. Fully
 * configured from the Admin Dashboard (Admin > WhatsApp) and refreshed live via
 * the settings-updated event. Wrapped in Suspense because it reads
 * useSearchParams.
 */
export function WhatsAppButton() {
  return (
    <React.Suspense fallback={null}>
      <WhatsAppButtonInner />
    </React.Suspense>
  )
}

export default WhatsAppButton
