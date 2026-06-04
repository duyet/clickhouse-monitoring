import { LockKeyhole } from 'lucide-react'

import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { isClerkEnabled } from '@/lib/clerk/clerk-client'

/**
 * Clerk's `SignInButton` requires a mounted `<ClerkProvider />`. Gate it behind
 * the build-time `isClerkEnabled()` constant (same lazy-require pattern as
 * `components/assistant-ui/agent-auth-gate.tsx`) so this never loads Clerk when
 * auth is disabled or driven by a non-Clerk provider (`proxy` / `none`).
 */
const ClerkSignInButton:
  | ((props: { children: ReactNode }) => ReactNode)
  | null = isClerkEnabled()
  ? require('@/components/clerk/clerk-sign-in-button').ClerkSignInButton
  : null

/**
 * Unauthorized first-run surface.
 *
 * Rendered when the hosts fetch comes back 401/403 — the dashboard requires
 * sign-in. With the Clerk provider we offer a sign-in button; with proxy/none
 * there is no in-app sign-in (the identity provider sits in front of the app),
 * so we show a generic instruction instead.
 *
 * @see components/host/first-run-gate.tsx
 */
export function FirstRunUnauthorizedState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-16">
      <EmptyState
        variant="no-data"
        icon={
          <LockKeyhole
            className="h-10 w-10 text-muted-foreground/60"
            strokeWidth={1.5}
          />
        }
        title="Sign in to view the dashboard"
        description={
          ClerkSignInButton ? (
            <span className="block">
              This dashboard requires authentication. Sign in to load your
              ClickHouse hosts.
            </span>
          ) : (
            <span className="block">
              Authentication required — sign in through your identity provider
              to load your ClickHouse hosts.
            </span>
          )
        }
        className="max-w-lg"
      />

      {ClerkSignInButton ? (
        <ClerkSignInButton>
          <Button size="sm">Sign in</Button>
        </ClerkSignInButton>
      ) : null}
    </div>
  )
}
