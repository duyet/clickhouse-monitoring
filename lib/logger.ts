/**
 * Production-safe logger utility
 * - debug() and log() only output in development or DEBUG=true
 * - error() always outputs
 */

const isDevelopment = process.env.NODE_ENV === 'development'
const debugEnabled = process.env.DEBUG === 'true'

/**
 * Debug logging - only in development or DEBUG=true
 */
export const debug = (...args: unknown[]): void => {
  if (isDevelopment || debugEnabled) {
    console.debug(...args)
  }
}

/**
 * Info logging - only in development or DEBUG=true
 */
export const log = (...args: unknown[]): void => {
  if (isDevelopment || debugEnabled) {
    console.log(...args)
  }
}

/**
 * Error logging - always outputs
 */
export const error = (...args: unknown[]): void => {
  console.error(...args)
}

/**
 * Warn logging - always outputs
 */
export const warn = (...args: unknown[]): void => {
  console.warn(...args)
}
