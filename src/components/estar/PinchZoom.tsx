'use client'

import * as React from 'react'
import { ZoomIn, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * PinchZoom
 * ----------
 * Wraps any content (typically a product image) and adds:
 *  - Two-finger pinch to zoom  (mobile/tablet)
 *  - One-finger drag to pan while zoomed
 *  - Ctrl/⌘ + wheel to zoom, wheel/drag to pan (desktop)
 *  - Double tap / double click to toggle zoom
 *  - A reset button that appears once zoomed
 *
 * Fully self-contained (no extra deps). Zoom/pan never leave the box because
 * the container is `overflow-hidden` and the translation is clamped.
 */
interface PinchZoomProps {
  children: React.ReactNode
  className?: string
  minScale?: number
  maxScale?: number
  doubleTapScale?: number
}

export function PinchZoom({
  children,
  className,
  minScale = 1,
  maxScale = 4,
  doubleTapScale = 2.5,
}: PinchZoomProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [scale, setScale] = React.useState(1)
  const [tx, setTx] = React.useState(0)
  const [ty, setTy] = React.useState(0)

  // Active pointers (pointerId -> {x,y}) for pinch + pan gesture tracking.
  const pointers = React.useRef<Map<number, { x: number; y: number }>>(new Map())
  const pinchStart = React.useRef<{ dist: number; scale: number } | null>(null)
  const panStart = React.useRef<{ x: number; y: number; tx: number; ty: number } | null>(null)
  const lastTap = React.useRef(0)

  const clampTranslate = React.useCallback(
    (nextScale: number, x: number, y: number) => {
      const el = containerRef.current
      if (!el) return { x, y }
      const rect = el.getBoundingClientRect()
      // Max we can shift so an edge never enters the frame.
      const maxX = ((nextScale - 1) * rect.width) / 2
      const maxY = ((nextScale - 1) * rect.height) / 2
      return {
        x: Math.max(-maxX, Math.min(maxX, x)),
        y: Math.max(-maxY, Math.min(maxY, y)),
      }
    },
    []
  )

  const applyScale = React.useCallback(
    (nextScale: number, focalX?: number, focalY?: number) => {
      const s = Math.max(minScale, Math.min(maxScale, nextScale))
      if (s === 1) {
        setScale(1)
        setTx(0)
        setTy(0)
        return
      }
      // Keep current translation but re-clamp for the new scale.
      const { x, y } = clampTranslate(s, tx, ty)
      setScale(s)
      setTx(x)
      setTy(y)
    },
    [clampTranslate, tx, ty, minScale, maxScale]
  )

  const reset = React.useCallback(() => {
    setScale(1)
    setTx(0)
    setTy(0)
  }, [])

  const distance = (a: { x: number; y: number }, b: { x: number; y: number }) =>
    Math.hypot(a.x - b.x, a.y - b.y)

  const onPointerDown = (e: React.PointerEvent) => {
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (pointers.current.size === 2) {
      const [p1, p2] = [...pointers.current.values()]
      pinchStart.current = { dist: distance(p1, p2), scale }
      panStart.current = null
    } else if (pointers.current.size === 1) {
      // Double-tap detection
      const now = Date.now()
      if (now - lastTap.current < 300) {
        applyScale(scale > 1 ? 1 : doubleTapScale)
        lastTap.current = 0
      } else {
        lastTap.current = now
      }
      if (scale > 1) {
        panStart.current = { x: e.clientX, y: e.clientY, tx, ty }
      }
    }
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (pointers.current.size === 2 && pinchStart.current) {
      const [p1, p2] = [...pointers.current.values()]
      const ratio = distance(p1, p2) / pinchStart.current.dist
      applyScale(pinchStart.current.scale * ratio)
    } else if (pointers.current.size === 1 && panStart.current && scale > 1) {
      const dx = e.clientX - panStart.current.x
      const dy = e.clientY - panStart.current.y
      const { x, y } = clampTranslate(scale, panStart.current.tx + dx, panStart.current.ty + dy)
      setTx(x)
      setTy(y)
    }
  }

  const endPointer = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId)
    if (pointers.current.size < 2) pinchStart.current = null
    if (pointers.current.size === 0) panStart.current = null
  }

  const onWheel = (e: React.WheelEvent) => {
    if (!(e.ctrlKey || e.metaKey)) return
    e.preventDefault()
    applyScale(scale - e.deltaY * 0.01)
  }

  const zoomed = scale > 1

  return (
    <div
      ref={containerRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endPointer}
      onPointerCancel={endPointer}
      onPointerLeave={endPointer}
      onWheel={onWheel}
      className={cn(
        'relative touch-none select-none overflow-hidden',
        zoomed ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in',
        className
      )}
      role="group"
      aria-label="اسحب بإصبعين للتكبير والتصغير"
    >
      <div
        className="h-full w-full will-change-transform"
        style={{
          transform: `translate3d(${tx}px, ${ty}px, 0) scale(${scale})`,
          transition: pointers.current.size ? 'none' : 'transform 0.18s ease-out',
        }}
      >
        {children}
      </div>

      {/* Hint (shown only at rest) */}
      {!zoomed && (
        <div className="pointer-events-none absolute bottom-3 right-3 z-10 flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
          <ZoomIn className="h-3.5 w-3.5" />
          <span>قرّب بإصبعين</span>
        </div>
      )}

      {/* Reset button (shown when zoomed) */}
      {zoomed && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            reset()
          }}
          className="absolute bottom-3 right-3 z-10 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/80"
          aria-label="إعادة الحجم الأصلي"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>{Math.round(scale * 100)}%</span>
        </button>
      )}
    </div>
  )
}

export default PinchZoom
