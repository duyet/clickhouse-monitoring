/**
 * @fileoverview Cookie utilities for safely handling cookie operations
 * Provides functions to prevent cookie injection and XSS attacks
 */

import { ErrorLogger } from '@/lib/logger'

/**
 * Sanitizes a cookie value by encoding special characters
 * This prevents cookie injection and XSS attacks
 *
 * @param value - The value to sanitize
 * @returns The sanitized value safe for use in cookies
 */
export function sanitizeCookieValue(value: string | number): string {
  const stringValue = String(value)

  // Encode the value to prevent special characters from breaking cookie syntax
  // This handles semicolons, quotes, equals signs, and other special characters
  return encodeURIComponent(stringValue)
}

/**
 * Sets a cookie safely with proper sanitization
 * Use this function instead of direct document.cookie assignment
 *
 * @param name - The cookie name
 * @param value - The cookie value (will be sanitized)
 * @param options - Optional cookie attributes
 */
export function setSecureCookie(
  name: string,
  value: string | number,
  options?: {
    path?: string
    maxAge?: number
    domain?: string
    secure?: boolean
    sameSite?: 'Strict' | 'Lax' | 'None'
  }
): void {
  if (typeof document === 'undefined') {
    ErrorLogger.logWarning(
      'setSecureCookie can only be called in browser context',
      {
        component: 'cookie-utils',
        action: 'setSecureCookie',
      }
    )
    return
  }

  const sanitizedValue = sanitizeCookieValue(value)
  let cookieString = `${name}=${sanitizedValue}`

  if (options?.path) {
    cookieString += `; path=${options.path}`
  }

  if (options?.maxAge !== undefined) {
    cookieString += `; max-age=${options.maxAge}`
  }

  if (options?.domain) {
    cookieString += `; domain=${options.domain}`
  }

  if (options?.secure) {
    cookieString += '; secure'
  }

  if (options?.sameSite) {
    cookieString += `; samesite=${options.sameSite}`
  }

  document.cookie = cookieString
}

/**
 * Generates a safe cookie assignment script for use in Next.js Script component
 * This is needed for server components that need to set cookies on the client side
 *
 * @param name - The cookie name
 * @param value - The cookie value (must be a safe number or validated string)
 * @param path - The cookie path (default: '/')
 * @returns Safe JavaScript code for cookie assignment
 */
export function generateSafeCookieScript(
  name: string,
  value: number,
  path: string = '/'
): string {
  // For numeric values, we can safely convert them to string without encoding
  // since they won't contain special characters
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(
      `Invalid cookie value: ${value}. Must be a non-negative integer.`
    )
  }

  // Using JSON.stringify ensures proper escaping of any special characters
  const safeName = JSON.stringify(name)
  const safeValue = value.toString()
  const safePath = JSON.stringify(path)

  return `document.cookie = ${safeName} + "=" + ${safeValue} + "; path=" + ${safePath};`
}
