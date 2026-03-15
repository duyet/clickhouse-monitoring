/**
 * Authentication utilities for conversation store.
 *
 * Handles user ID resolution with graceful fallback to guest mode.
 */

import { auth } from '@clerk/nextjs/server'

/**
 * Guest user ID constant for unauthenticated users.
 */
export const GUEST_USER_ID = 'guest'

/**
 * Clerk secret key environment variable name.
 */
const CLERK_SECRET_KEY = 'CLERK_SECRET_KEY'

/**
 * Resolves the current user ID from Clerk authentication.
 *
 * Falls back to guest mode if:
 * - Clerk is not configured (missing CLERK_SECRET_KEY)
 * - No authenticated user session
 * - Authentication service throws an error
 *
 * @returns Promise resolving to userId string or GUEST_USER_ID
 *
 * @example
 * ```ts
 * const userId = await resolveUserId()
 * if (userId === GUEST_USER_ID) {
 *   // Handle guest user
 * }
 * ```
 */
export async function resolveUserId(): Promise<string> {
  // Check if Clerk is configured
  if (!process.env[CLERK_SECRET_KEY]) {
    return GUEST_USER_ID
  }

  try {
    const authResult = await auth()
    const userId = authResult?.userId

    return userId || GUEST_USER_ID
  } catch (error) {
    // Log error in development, but fail silently in production
    if (process.env.NODE_ENV === 'development') {
      console.error('Auth resolution failed:', error)
    }

    // Fallback to guest mode on any auth error
    return GUEST_USER_ID
  }
}
