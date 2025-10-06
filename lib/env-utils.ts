/**
 * Environment detection utilities for conditional behavior based on NODE_ENV
 */

/**
 * Check if running in development environment
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development'
}

/**
 * Check if running in production environment
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

/**
 * Check if running in test environment
 */
export function isTest(): boolean {
  return process.env.NODE_ENV === 'test'
}

/**
 * Determine if detailed error information should be shown
 * Returns true in development, false in production
 */
export function shouldShowDetailedErrors(): boolean {
  return isDevelopment()
}

/**
 * Get current environment name
 */
export function getEnvironment(): string {
  return process.env.NODE_ENV || 'development'
}
