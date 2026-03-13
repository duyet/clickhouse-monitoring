/**
 * Clerk client utilities for optional authentication support.
 *
 * Clerk authentication is opt-in - the application functions fully without it.
 * These utilities allow components to safely check if Clerk is enabled.
 */

/**
 * Check if Clerk authentication is enabled.
 *
 * @returns true if NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is set and valid
 */
export function isClerkEnabled(): boolean {
  if (typeof window === 'undefined') return false
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  return Boolean(key?.startsWith('pk_'))
}

/**
 * Get the Clerk publishable key from environment variables.
 *
 * @returns The publishable key or undefined if not set
 */
export function getClerkPublishableKey(): string | undefined {
  return process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
}
