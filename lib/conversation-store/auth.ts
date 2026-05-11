/**
 * Authentication utilities for conversation store.
 */

import { ConversationStoreError } from './types'
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
 * Conversation DB endpoints must be authenticated to guarantee user isolation.
 * This function fails closed when Clerk is unavailable, missing a session,
 * or returns an auth error.
 */
export async function resolveUserId(): Promise<string> {
  if (!process.env[CLERK_SECRET_KEY]) {
    throw new ConversationStoreError(
      'Authentication is required for conversation storage.',
      'UNAUTHORIZED'
    )
  }

  try {
    const authResult = await auth()
    const userId = authResult?.userId

    if (!userId) {
      throw new ConversationStoreError(
        'Authentication is required for conversation storage.',
        'UNAUTHORIZED'
      )
    }

    return userId
  } catch (error) {
    if (error instanceof ConversationStoreError) {
      throw error
    }

    if (process.env.NODE_ENV === 'development') {
      console.error('Auth resolution failed:', error)
    }

    throw new ConversationStoreError(
      'Failed to validate authentication for conversation storage.',
      'UNAUTHORIZED',
      error
    )
  }
}
