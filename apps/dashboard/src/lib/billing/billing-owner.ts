/**
 * Billing owner resolution — org or user, whichever owns the subscription.
 *
 * Model:
 * - FREE plan: user-scoped, no Clerk org. Owner = {type:'user', id:userId}
 * - PAID (Pro/Max): on successful payment a Clerk org is lazily created for the
 *   buyer. The org then owns the subscription permanently.
 *   Owner = {type:'org', id:orgId}
 *
 * How orgId is exposed:
 * `auth()` from @clerk/tanstack-react-start/server returns a `SessionAuthObject`
 * (= SignedInAuthObject | SignedOutAuthObject). When signed in,
 * `SignedInAuthObject` extends `SharedSignedInAuthObjectProperties` which
 * carries `orgId: string | undefined` — the user's currently active Clerk org,
 * taken directly from the session JWT claims (no extra API call). If the user
 * has no active org, orgId is undefined or null.
 *
 * The billing owner is that active orgId when present; otherwise the userId.
 * Callers use resolveBillingOwner() for plan lookups and subscription writes.
 * Per-user resources (connections, conversations) always stay keyed by userId.
 */

import { auth } from '@clerk/tanstack-react-start/server'
import { isClerkAuthProvider } from '@/lib/auth/provider'
import { ConversationStoreError } from '@/lib/conversation-store/types'

export interface BillingOwner {
  type: 'org' | 'user'
  id: string
}

const CLERK_SECRET_KEY = 'CLERK_SECRET_KEY'

/**
 * Resolve the billing owner for the current request session.
 *
 * Returns {type:'org', id:orgId} when the session has an active Clerk org;
 * {type:'user', id:userId} otherwise.
 *
 * Throws ConversationStoreError('UNAUTHORIZED') — the same error shape as
 * resolveUserId() — when Clerk is not configured or the session is invalid,
 * so existing mapConnectionApiError() handlers produce correct 401 responses.
 */
export async function resolveBillingOwner(): Promise<BillingOwner> {
  if (!isClerkAuthProvider() || !process.env[CLERK_SECRET_KEY]) {
    throw new ConversationStoreError(
      'Authentication is required for billing.',
      'UNAUTHORIZED'
    )
  }

  try {
    const authResult = await auth()
    const userId = authResult?.userId

    if (!userId) {
      throw new ConversationStoreError(
        'Authentication is required for billing.',
        'UNAUTHORIZED'
      )
    }

    // orgId is set when the user has an active Clerk org in their session JWT.
    const orgId = (authResult as { orgId?: string | null }).orgId
    if (orgId) {
      return { type: 'org', id: orgId }
    }

    return { type: 'user', id: userId }
  } catch (error) {
    if (error instanceof ConversationStoreError) throw error
    throw new ConversationStoreError(
      'Failed to validate authentication for billing.',
      'UNAUTHORIZED',
      error
    )
  }
}

/** Convenience wrapper — returns just the billing owner id string. */
export async function resolveBillingOwnerId(): Promise<string> {
  return (await resolveBillingOwner()).id
}
