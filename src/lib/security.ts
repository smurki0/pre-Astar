/**
 * Security Utilities for Estar E-Commerce Platform
 * Provides comprehensive protection against common web vulnerabilities
 */

import { NextRequest, NextResponse } from 'next/server'

// Rate limiting store (in-memory for development, use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number; blocked: boolean }>()

// Security configuration
export const SECURITY_CONFIG = {
  // Rate limiting
  rateLimit: {
    windowMs: 60 * 1000, // 1 minute rolling window (fast recovery, no 15-min lockouts)
    maxRequests: 200, // generous per-IP+path budget for dashboards/navigation
    authMaxRequests: 5, // stricter limit for credential endpoints (brute-force protection)
    authWindowMs: 15 * 60 * 1000, // 15 minutes
  },
  // CSRF
  csrf: {
    tokenLength: 32,
    headerName: 'x-csrf-token',
    cookieName: 'csrf-token',
  },
  // Password
  password: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumber: true,
    requireSpecial: true,
  },
  // Session
  session: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    cookieName: 'session-token',
  },
  // Blocked IPs (can be loaded from database in production)
  blockedIPs: new Set<string>(),
}

/**
 * Generate a secure random token (using Web Crypto API for Edge Runtime compatibility)
 */
export function generateSecureToken(length: number = 32): string {
  const array = new Uint8Array(length)
  // Use crypto.getRandomValues which works in Edge Runtime
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array)
  }
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Hash a value using SHA-256 (using Web Crypto API)
 */
export async function hashValue(value: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(value)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Generate a random salt
 */
function generateSalt(length: number = 16): string {
  return generateSecureToken(length)
}

/**
 * Simple hash function for password (using SHA-256)
 * Note: For production, use bcrypt or argon2 on the server side
 */
export async function hashPasswordAsync(password: string, salt?: string): Promise<{ hash: string; salt: string }> {
  const useSalt = salt || generateSalt()
  const combined = password + useSalt
  const hash = await hashValue(combined)
  return { hash, salt: useSalt }
}

/**
 * Verify password against hash
 */
export async function verifyPasswordAsync(password: string, hash: string, salt: string): Promise<boolean> {
  const { hash: newHash } = await hashPasswordAsync(password, salt)
  // Use constant-time comparison to prevent timing attacks
  if (hash.length !== newHash.length) return false
  let result = 0
  for (let i = 0; i < hash.length; i++) {
    result |= hash.charCodeAt(i) ^ newHash.charCodeAt(i)
  }
  return result === 0
}

// Synchronous versions for compatibility (simplified)
export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const useSalt = salt || generateSalt()
  // Simple hash - in production use bcrypt
  let hash = ''
  for (let i = 0; i < password.length; i++) {
    hash += String.fromCharCode(
      ((password.charCodeAt(i) + useSalt.charCodeAt(i % useSalt.length)) % 94) + 33
    )
  }
  // Add more entropy
  hash = btoa(hash + useSalt).slice(0, 64)
  return { hash, salt: useSalt }
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const { hash: newHash } = hashPassword(password, salt)
  if (hash.length !== newHash.length) return false
  let result = 0
  for (let i = 0; i < hash.length; i++) {
    result |= hash.charCodeAt(i) ^ newHash.charCodeAt(i)
  }
  return result === 0
}

/**
 * Get client IP address
 */
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cloudflareIP = request.headers.get('cf-connecting-ip')
  
  if (cloudflareIP) return cloudflareIP
  if (realIP) return realIP
  if (forwarded) return forwarded.split(',')[0].trim()
  
  return 'unknown'
}

/**
 * Rate limiting check
 */
export function checkRateLimit(
  identifier: string,
  maxRequests: number = SECURITY_CONFIG.rateLimit.maxRequests,
  windowMs: number = SECURITY_CONFIG.rateLimit.windowMs
): { allowed: boolean; remaining: number; resetTime: number; blocked: boolean } {
  const now = Date.now()
  const record = rateLimitStore.get(identifier)

  if (!record || now > record.resetTime) {
    // Create new record
    const newRecord = {
      count: 1,
      resetTime: now + windowMs,
      blocked: false,
    }
    rateLimitStore.set(identifier, newRecord)
    return { allowed: true, remaining: maxRequests - 1, resetTime: newRecord.resetTime, blocked: false }
  }

  if (record.blocked) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime, blocked: true }
  }

  if (record.count >= maxRequests) {
    // Block the IP
    record.blocked = true
    rateLimitStore.set(identifier, record)
    return { allowed: false, remaining: 0, resetTime: record.resetTime, blocked: true }
  }

  // Increment count
  record.count++
  rateLimitStore.set(identifier, record)
  return { allowed: true, remaining: maxRequests - record.count, resetTime: record.resetTime, blocked: false }
}

/**
 * Check if IP is blocked
 */
export function isIPBlocked(ip: string): boolean {
  return SECURITY_CONFIG.blockedIPs.has(ip)
}

/**
 * Block an IP address
 */
export function blockIP(ip: string): void {
  SECURITY_CONFIG.blockedIPs.add(ip)
  // Log security event
  logSecurityEvent('ip_blocked', { ip, timestamp: new Date().toISOString() })
}

/**
 * Unblock an IP address
 */
export function unblockIP(ip: string): void {
  SECURITY_CONFIG.blockedIPs.delete(ip)
}

/**
 * Validate email format
 */
export function validateEmail(email: string): { valid: boolean; error?: string } {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!email) return { valid: false, error: 'Email is required' }
  if (!emailRegex.test(email)) return { valid: false, error: 'Invalid email format' }
  if (email.length > 254) return { valid: false, error: 'Email is too long' }
  return { valid: true }
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  const config = SECURITY_CONFIG.password

  if (!password) {
    return { valid: false, errors: ['Password is required'] }
  }

  if (password.length < config.minLength) {
    errors.push(`Password must be at least ${config.minLength} characters`)
  }

  if (config.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  if (config.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  if (config.requireNumber && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  if (config.requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }

  // Check for common passwords
  const commonPasswords = ['password', '123456', 'qwerty', 'admin', 'letmein', 'welcome']
  if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
    errors.push('Password is too common')
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Sanitize string input
 */
export function sanitizeInput(input: string): string {
  if (!input) return ''
  
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .replace(/data:/gi, '') // Remove data: protocol
    .trim()
}

/**
 * Validate SQL injection patterns (additional layer, Prisma handles this)
 */
export function detectSQLInjection(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE)\b)/i,
    /(--|\#|\/\*|\*\/)/,
    /(\bOR\b|\bAND\b).*?=/i,
    /(\bunion\b.*?\bselect\b)/i,
    /('|")/,
    /(;|\|)/,
  ]
  
  return sqlPatterns.some(pattern => pattern.test(input))
}

/**
 * Validate XSS patterns
 */
export function detectXSS(input: string): boolean {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
    /<form/gi,
    /expression\s*\(/gi,
    /vbscript:/gi,
  ]
  
  return xssPatterns.some(pattern => pattern.test(input))
}

/**
 * Security event logger
 */
interface SecurityEvent {
  type: string
  data: Record<string, unknown>
  timestamp?: string
}

const securityLog: SecurityEvent[] = []

export function logSecurityEvent(type: string, data: Record<string, unknown>): void {
  const event: SecurityEvent = {
    type,
    data: {
      ...data,
      // Sanitize sensitive data
      password: data.password ? '[REDACTED]' : undefined,
      token: data.token ? '[REDACTED]' : undefined,
    },
    timestamp: new Date().toISOString(),
  }
  
  securityLog.push(event)
  
  // Keep only last 1000 events in memory
  if (securityLog.length > 1000) {
    securityLog.shift()
  }
  
  // In production, send to logging service
  if (process.env.NODE_ENV === 'production') {
    console.error('[SECURITY]', JSON.stringify(event))
  }
}

export function getSecurityLog(): SecurityEvent[] {
  return securityLog
}

/**
 * Generate CSRF token
 */
export function generateCSRFToken(): string {
  return generateSecureToken(SECURITY_CONFIG.csrf.tokenLength)
}

/**
 * Verify CSRF token (constant-time comparison)
 */
export function verifyCSRFToken(token: string, storedToken: string): boolean {
  if (!token || !storedToken) return false
  if (token.length !== storedToken.length) return false
  
  // Constant-time comparison to prevent timing attacks
  let result = 0
  for (let i = 0; i < token.length; i++) {
    result |= token.charCodeAt(i) ^ storedToken.charCodeAt(i)
  }
  return result === 0
}

/**
 * Content Security Policy headers
 */
export function getCSPHeaders(): Record<string, string> {
  const isDev = process.env.NODE_ENV === 'development'
  
  return {
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://connect.facebook.net https://analytics.tiktok.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https: http:",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://www.google-analytics.com https://graph.facebook.com https://business-api.tiktok.com",
      // Allow iframes from any origin in development, restrict in production
      isDev ? "frame-ancestors *" : "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      isDev ? '' : "upgrade-insecure-requests",
    ].filter(Boolean).join('; '),
    'X-Content-Type-Options': 'nosniff',
    // Allow iframes in development for Z.ai preview
    'X-Frame-Options': isDev ? 'ALLOWALL' : 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  }
}

/**
 * Add security headers to response
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  const headers = getCSPHeaders()
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  return response
}

/**
 * Validate file upload
 */
export function validateFileUpload(file: {
  name: string
  type: string
  size: number
}): { valid: boolean; error?: string } {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
  ]
  
  const maxFileSize = 5 * 1024 * 1024 // 5MB
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Only images are allowed.' }
  }
  
  if (file.size > maxFileSize) {
    return { valid: false, error: 'File size exceeds 5MB limit.' }
  }
  
  // Check for suspicious file extensions
  const suspiciousExtensions = ['.php', '.exe', '.sh', '.bat', '.cmd', '.js', '.html']
  const fileExt = file.name.toLowerCase().slice(file.name.lastIndexOf('.'))
  if (suspiciousExtensions.includes(fileExt)) {
    return { valid: false, error: 'Suspicious file extension detected.' }
  }
  
  return { valid: true }
}

/**
 * Encrypt sensitive data (using Web Crypto API)
 * Note: This is a simplified version. For production, use proper key management
 */
export async function encrypt(text: string, key?: string): Promise<string> {
  const encryptionKey = (key || process.env.ENCRYPTION_KEY || 'default-encryption-key-32-characters!!').padEnd(32, '0').slice(0, 32)
  
  // Generate IV
  const iv = new Uint8Array(16)
  crypto.getRandomValues(iv)
  
  // Import key
  const keyData = new TextEncoder().encode(encryptionKey)
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  )
  
  // Encrypt
  const encodedText = new TextEncoder().encode(text)
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    encodedText
  )
  
  // Combine IV and encrypted data
  const combined = new Uint8Array(iv.length + encrypted.byteLength)
  combined.set(iv)
  combined.set(new Uint8Array(encrypted), iv.length)
  
  // Return as base64
  return btoa(String.fromCharCode(...combined))
}

/**
 * Decrypt sensitive data (using Web Crypto API)
 */
export async function decrypt(encryptedText: string, key?: string): Promise<string> {
  const encryptionKey = (key || process.env.ENCRYPTION_KEY || 'default-encryption-key-32-characters!!').padEnd(32, '0').slice(0, 32)
  
  // Decode from base64
  const combined = new Uint8Array(atob(encryptedText).split('').map(c => c.charCodeAt(0)))
  
  // Extract IV and encrypted data
  const iv = combined.slice(0, 16)
  const encrypted = combined.slice(16)
  
  // Import key
  const keyData = new TextEncoder().encode(encryptionKey)
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  )
  
  // Decrypt
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    encrypted
  )
  
  return new TextDecoder().decode(decrypted)
}

/**
 * Clean up expired rate limit records (run periodically)
 */
export function cleanupRateLimits(): void {
  const now = Date.now()
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}

// Run cleanup every 15 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimits, 15 * 60 * 1000)
}
