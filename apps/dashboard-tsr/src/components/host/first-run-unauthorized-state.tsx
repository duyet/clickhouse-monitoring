import { LockKeyhole } from 'lucide-react'

import type { ReactNode } from 'react'

import { ClerkSignInButton as ClerkSignInButtonImpl } from '@/components/clerk/clerk-sign-in-button'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { isClerkEnabled } from '@/lib/clerk/clerk-client'

/**
 * Clerk's `SignInButton` requires a mounted `<ClerkProvider />`. Gate it behind
 * the build-time `isClerkEnabled()` constant so the button is only rendered when
 * Clerk is active; with a non-Clerk provider (`proxy` / `none`) it stays null.
 * The import is inert (the Clerk hook only runs on render), and a static ESM
 * import replaces `require()`, which is undefined in the Vite/ESM runtime.
 */
const ClerkSignInButton:
  | ((props: { children: ReactNode }) => ReactNode)
  | null = isClerkEnabled() ? ClerkSignInButtonImpl : null

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
