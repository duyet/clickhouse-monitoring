/**
 * Clerk client utilities for optional authentication support.
 *
 * Clerk authentication is opt-in - the application functions fully without it.
 * These utilities allow components to safely check if Clerk is enabled.
 */

import { getAuthProvider } from '@/lib/auth/provider'
import { error } from '@/lib/logger'

/**
 * Check if Clerk authentication is enabled.
 *
 * @returns true if auth provider is clerk and the publishable key is valid
 */
export function isClerkEnabled(): boolean {
  try {
    if (getAuthProvider() !== 'clerk') return false
  } catch (err) {
    error('[clerk] Auth provider check failed', err)
    return false
  }

  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  return Boolean(key?.startsWith('pk_'))
}
