'use client'

import { LockKeyholeIcon } from 'lucide-react'

import {
  createContext,
  type ReactNode,
  use,
  useCallback,
  useMemo,
  useState,
} from 'react'
import { ClerkSignInButton as ClerkSignInButtonImpl } from '@/components/clerk/clerk-sign-in-button'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { isClerkEnabled } from '@/lib/clerk/clerk-client'
import { useFeaturePermissions } from '@/lib/feature-permissions/context'
import { AGENT_FEATURE_PERMISSION } from '@/lib/feature-permissions/permissions'

/**
 * Clerk's `SignInButton` requires a mounted `<ClerkProvider />`. Gate it behind
 * the build-time `isClerkEnabled()` constant so it is only rendered when Clerk is
 * active; when Clerk is off the value is null and the dialog renders without a
 * sign-in action. The import is inert (the Clerk hook only runs on render), and a
 * static ESM import replaces `require()`, undefined in the Vite/ESM runtime.
 */
const ClerkSignInButton:
  | ((props: { children: ReactNode }) => ReactNode)
  | null = isClerkEnabled() ? ClerkSignInButtonImpl : null

interface AgentAuthGateValue {
  /**
   * Call before an auth-requiring interaction (e.g. sending a message).
   * Returns true if the user may proceed; otherwise opens the sign-in dialog
   * and returns false so the caller can abort.
   */
  ensureAuthed: () => boolean
}

const AgentAuthGateContext = createContext<AgentAuthGateValue | null>(null)

/**
 * Renders the agent chat UI for everyone (the route is interaction-gated, see
 * `feature-route-gate.tsx`) and prompts for sign-in only when an
 * auth-requiring action is attempted.
 */
export function AgentAuthGate({ children }: { children: ReactNode }) {
  const { isAllowed, isLoading } = useFeaturePermissions()
  const [open, setOpen] = useState(false)

  const ensureAuthed = useCallback(() => {
    // Optimistic while the permission config loads — the server still enforces
    // auth on /api/v1/agent. Once loaded, gate strictly on the agent feature.
    if (isLoading) return true
    if (isAllowed(AGENT_FEATURE_PERMISSION)) return true
    setOpen(true)
    return false
  }, [isAllowed, isLoading])

  const value = useMemo<AgentAuthGateValue>(
    () => ({ ensureAuthed }),
    [ensureAuthed]
  )

  return (
    <AgentAuthGateContext.Provider value={value}>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="bg-muted mb-2 flex size-12 items-center justify-center rounded-full">
              <LockKeyholeIcon className="text-muted-foreground size-5" />
            </div>
            <DialogTitle>Authentication required</DialogTitle>
            <DialogDescription>
              Sign in to chat with the AI agent. You can keep exploring the
              interface without an account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Keep exploring
            </Button>
            {ClerkSignInButton ? (
              <ClerkSignInButton>
                <Button>Sign in</Button>
              </ClerkSignInButton>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AgentAuthGateContext.Provider>
  )
}

/**
 * Access the agent auth gate. Falls back to an always-allow gate when used
 * outside an `AgentAuthGate` (e.g. in isolated tests), so callers never crash.
 */
export function useAgentAuthGate(): AgentAuthGateValue {
  return use(AgentAuthGateContext) ?? { ensureAuthed: () => true }
}
