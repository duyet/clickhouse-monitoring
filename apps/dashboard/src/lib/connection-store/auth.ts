/**
 * Authentication for user connection storage.
 * Connections are scoped to the signed-in Clerk user — never shared org-wide.
 */

import { ConnectionStoreError } from './types'
import { resolveUserId } from '@/lib/conversation-store/auth'
import { ConversationStoreError } from '@/lib/conversation-store/types'

/**
 * Resolves the current Clerk user id for connection store operations.
 * Fails closed when auth is missing or invalid.
 */
export async function resolveConnectionUserId(
  request?: Request
): Promise<string> {
  try {
    return await resolveUserId(request)
  } catch (error) {
    if (
      error instanceof ConversationStoreError &&
      error.code === 'UNAUTHORIZED'
    ) {
      throw new ConnectionStoreError(
        'Authentication is required for user connections.',
        'UNAUTHORIZED',
        error
      )
    }
    throw error
  }
}
