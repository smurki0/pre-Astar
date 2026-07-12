'use client'

import * as React from 'react'
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * CardZoom
 * ---------
 * Wraps the ENTIRE product card and lets the user scale it DOWN (or up) so
 * content/buttons that were cut off by the card edges become fully visible.
 *
 *  - Two-finger pinch to zoom in/out (mobile) — single-finger vertical scroll
 *    and normal button taps keep working (only multi-touch is intercepted).
 *  - Visible +/−/reset toolbar (always discoverable, works without gestures).
 *  - Ctrl/⌘ + wheel to zoom (desktop).
 *  - The outer box height tracks the scaled height, so there is no large gap
 *    when zooming out and no overlap with the content below.
 */
interface CardZoomProps {
  children: React.ReactNode
  className?: string
  min?: number
  max?: number
  step?: number
}

export function CardZoom({
  children,
  className,
  min = 0.5,
  max = 1.5,
  step = 0.1,
}: CardZoomProps) {
  const wrapperRef = React.useRef<HTMLDivElement>(null)
  const innerRef = React.useRef<HTMLDivElement>(null)
  const [scale, setScale] = React.useState(1)
  const [naturalHeight, setNaturalHeight] = React.useState<number | null>(null)

  const clamp = React.useCallback(
    (v: number) => Math.max(min, Math.min(max, Math.round(v * 100) / 100)),
    [min, max]
  )

  // Track the un-scaled height so the box can shrink/grow with the scale.
  React.useEffect(() => {
    const el = innerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setNaturalHeight(el.offsetHeight))
    ro.observe(el)
    setNaturalHeight(el.offsetHeight)
    return () => ro.disconnect()
  }, [])

  // Pinch handling via non-passive touch listeners so we can preventDefault the
  // browser's own page-zoom ONLY during a two-finger gesture.
  React.useEffect(() => {
    const el = wrapperRef.current
    if (!el) return
    let startDist = 0
    let startScale = 1

    const dist = (t: TouchList) =>
      Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY)

    const onStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        startDist = dist(e.touches)
        startScale = scale
      }
    }
    const onMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && startDist > 0) {
        e.preventDefault() // stop the browser pinch-zooming the whole page
        setScale(clamp(startScale * (dist(e.touches) / startDist)))
      }
    }
    const onEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) startDist = 0
    }

    el.addEventListener('touchstart', onStart, { passive: true })
    el.addEventListener('touchmove', onMove, { passive: false })
    el.addEventListener('touchend', onEnd, { passive: true })
    el.addEventListener('touchcancel', onEnd, { passive: true })
    return () => {
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchmove', onMove)
      el.removeEventListener('touchend', onEnd)
      el.removeEventListener('touchcancel', onEnd)
    }
  }, [scale, clamp])

  const onWheel = (e: React.WheelEvent) => {
    if (!(e.ctrlKey || e.metaKey)) return
    e.preventDefault()
    setScale((s) => clamp(s - e.deltaY * 0.01))
  }

  const boxHeight = naturalHeight ? naturalHeight * scale : undefined

  return (
    <div ref={wrapperRef} onWheel={onWheel} className={cn('relative', className)}>
      {/* Zoom toolbar — stays fixed (not scaled). */}
      <div className="absolute left-3 top-3 z-20 flex items-center gap-1 rounded-full bg-black/60 px-1.5 py-1 text-white shadow-md backdrop-blur-sm">
        <button
          type="button"
          onClick={() => setScale((s) => clamp(s - step))}
          disabled={scale <= min}
          aria-label="تصغير"
          className="flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-white/20 disabled:opacity-40"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <span className="min-w-[40px] text-center text-[11px] font-semibold tabular-nums">
          {Math.round(scale * 100)}%
        </span>
        <button
          type="button"
          onClick={() => setScale((s) => clamp(s + step))}
          disabled={scale >= max}
          aria-label="تكبير"
          className="flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-white/20 disabled:opacity-40"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        {scale !== 1 && (
          <button
            type="button"
            onClick={() => setScale(1)}
            aria-label="إعادة الحجم الأصلي"
            className="flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-white/20"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Height-synced viewport so the layout stays tidy at any scale. */}
      <div style={{ height: boxHeight }} className="overflow-hidden">
        <div
          ref={innerRef}
          className="origin-top will-change-transform"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'top center',
            transition: 'transform 0.18s ease-out',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

export default CardZoom
