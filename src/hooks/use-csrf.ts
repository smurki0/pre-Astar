'use client'

import { useCallback } from 'react'

/**
 * Hook to get CSRF token from cookies
 * Use this in components that make authenticated API requests
 */
export function useCsrfToken() {
  const getCsrfToken = useCallback((): string | null => {
    if (typeof document === 'undefined') return null
    
    const cookies = document.cookie.split(';')
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=')
      if (name === 'csrf-token') {
        return value
      }
    }
    return null
  }, [])

  return { getCsrfToken }
}

/**
 * Helper function to get CSRF token directly
 * Can be used anywhere in client-side code
 */
export function getCsrfTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null
  
  const cookies = document.cookie.split(';')
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=')
    if (name === 'csrf-token') {
      return decodeURIComponent(value)
    }
  }
  return null
}

/**
 * Fetch wrapper that automatically includes CSRF token
 * Use this instead of fetch for admin API calls
 */
export async function csrfFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const csrfToken = getCsrfTokenFromCookie()
  
  const headers = new Headers(options.headers)
  if (csrfToken) {
    headers.set('x-csrf-token', csrfToken)
  }
  
  return fetch(url, {
    ...options,
    headers,
  })
}