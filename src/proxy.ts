/**
 * Production-ready Security Proxy for Astar E-Commerce Platform
 * Handles:
 *  - Rate Limiting
 *  - CSRF Protection
 *  - Security Headers
 *  - Logging of sensitive access
 *
 * Next.js 16 proxy: file MUST be named proxy.ts and export `proxy`.
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getClientIP,
  checkRateLimit,
  isIPBlocked,
  addSecurityHeaders,
  logSecurityEvent,
  generateCSRFToken,
  SECURITY_CONFIG,
} from '@/lib/security'

// Paths that are public (no auth or CSRF)
const publicPaths = [
  '/',
  '/api/settings',
  '/api/categories',
  '/api/products',
  '/api/contact',
  '/api/newsletter/subscribe',
]

// Auth endpoints with stricter rate limits
// Auth endpoints with stricter (anti-brute-force) rate limits.
// NOTE: /api/admin is intentionally NOT here — admin dashboards make many
// legitimate requests, so they use the normal limit. Only credential endpoints
// need the very strict 5-attempt limit.
const authPaths = [
  '/api/auth/login',
  '/api/auth/register',
]

// CSRF protected paths
const csrfProtectedPaths = [
  '/api/admin',
  '/api/orders',
  '/api/upload',
]

export async function proxy(request: NextRequest) {
const ip = getClientIP(request)
  const path = request.nextUrl.pathname
  const method = request.method

  // --- Block malicious IPs ---
  if (isIPBlocked(ip)) {
    logSecurityEvent('blocked_ip_access', { ip, path, method })
    return new NextResponse('Access Denied', { status: 403 })
  }

  // --- Rate Limiting ---
  const isAuthPath = authPaths.some(p => path.startsWith(p))
  const rateLimitResult = checkRateLimit(
    `${ip}:${path}`,
    isAuthPath ? SECURITY_CONFIG.rateLimit.authMaxRequests : SECURITY_CONFIG.rateLimit.maxRequests,
    isAuthPath ? SECURITY_CONFIG.rateLimit.authWindowMs : SECURITY_CONFIG.rateLimit.windowMs
  )

  if (!rateLimitResult.allowed) {
    logSecurityEvent('rate_limit_exceeded', { ip, path, method })
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)),
          'X-RateLimit-Limit': String(isAuthPath ? SECURITY_CONFIG.rateLimit.authMaxRequests : SECURITY_CONFIG.rateLimit.maxRequests),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(rateLimitResult.resetTime),
        }
      }
    )
  }

  // --- CSRF Protection ---
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    const requiresCSRF = csrfProtectedPaths.some(p => path.startsWith(p))
    if (requiresCSRF) {
      const csrfToken = request.headers.get('x-csrf-token')
      const cookieToken = request.cookies.get('csrf-token')?.value
      const origin = request.headers.get('origin')
      const host = request.headers.get('host')

      if (!csrfToken || csrfToken !== cookieToken || (origin && host && !origin.includes(host))) {
        logSecurityEvent('csrf_violation', { ip, path, method, origin, host })
        return NextResponse.json({ error: 'CSRF token invalid or missing' }, { status: 403 })
      }
    }
  }

  // --- Process Request ---
  const response = NextResponse.next()

  // Add Security Headers
  addSecurityHeaders(response)

  // Add Rate Limit Headers
  response.headers.set('X-RateLimit-Limit', String(isAuthPath ? SECURITY_CONFIG.rateLimit.authMaxRequests : SECURITY_CONFIG.rateLimit.maxRequests))
  response.headers.set('X-RateLimit-Remaining', String(rateLimitResult.remaining))
  response.headers.set('X-RateLimit-Reset', String(rateLimitResult.resetTime))

  // --- CSRF Token Generation (double-submit cookie) ---
  // Issue a CSRF token to every visitor on safe GET navigations (when one is not
  // already present) so any subsequent state-changing request can echo it back.
  // The cookie MUST be readable by client JS for the double-submit pattern, so it
  // is intentionally not httpOnly. Protection comes from the attacker being unable
  // to read/set the matching custom header cross-origin (+ SameSite + origin check).
  if (method === 'GET' && !request.cookies.get('csrf-token')) {
    const csrfToken = generateCSRFToken()
    response.cookies.set('csrf-token', csrfToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    })
    response.headers.set('X-CSRF-Token', csrfToken)
  }

  // --- Log Admin Access ---
  if (path.startsWith('/api/admin')) {
    logSecurityEvent('admin_access', {
      ip,
      path,
      method,
      userAgent: request.headers.get('user-agent'),
    })
  }

  return response
}

// --- Proxy Matcher for Next.js ---
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}