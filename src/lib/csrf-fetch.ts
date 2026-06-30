/**
 * CSRF-aware fetch utility
 * Use this instead of regular fetch for admin API calls
 */

import { getCsrfTokenFromCookie } from '@/hooks/use-csrf'

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

/**
 * Helper to add CSRF token to any fetch options
 */
export function addCsrfHeader(headers: HeadersInit = {}): Headers {
  const csrfToken = getCsrfTokenFromCookie()
  const result = new Headers(headers)
  
  if (csrfToken) {
    result.set('x-csrf-token', csrfToken)
  }
  
  return result
}