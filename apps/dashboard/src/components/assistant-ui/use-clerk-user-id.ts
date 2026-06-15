'use client'

import { useUser } from '@clerk/tanstack-react-start'

/**
 * Returns the signed-in Clerk user id, or null when signed out.
 *
 * IMPORTANT: calls Clerk's `useUser()`, which throws unless a
 * `<ClerkProvider />` is mounted. Only invoke when `isClerkEnabled()` is true.
 */
export function useClerkUserId(): string | null {
  const { isSignedIn, user } = useUser()
  return isSignedIn && user?.id ? user.id : null
}
