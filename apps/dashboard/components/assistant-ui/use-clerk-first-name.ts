'use client'

import { useUser } from '@clerk/nextjs'

/**
 * Returns the signed-in user's first name (or null) for the agent welcome
 * greeting.
 *
 * IMPORTANT: This calls Clerk's `useUser()`, which throws when no
 * `<ClerkProvider />` is mounted. It MUST only be imported/invoked when
 * `isClerkEnabled()` is true. The consumer gates this behind a build-time
 * conditional `require` (see `agent-thread-page.tsx`), mirroring
 * `components/nav-user.tsx`.
 */
export function useClerkFirstName(): string | null {
  const { user } = useUser()
  return (
    user?.firstName ??
    (user?.fullName ? user.fullName.split(' ')[0] : null) ??
    null
  )
}
