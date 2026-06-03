import type { ReactNode } from 'react'

import { SignInButton } from '@clerk/nextjs'

/**
 * Thin wrapper over Clerk's modal `SignInButton`.
 *
 * IMPORTANT: `SignInButton` requires a mounted `<ClerkProvider />`, so this
 * module MUST only be imported/rendered when `isClerkEnabled()` is true. The
 * consumer gates it behind a build-time conditional `require` (see
 * `agent-auth-gate.tsx`), mirroring `components/nav-user.tsx`.
 */
export function ClerkSignInButton({ children }: { children: ReactNode }) {
  return <SignInButton mode="modal">{children}</SignInButton>
}
