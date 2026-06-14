/**
 * Clerk client utilities for optional authentication support (TanStack Start).
 *
 * Port of apps/dashboard/lib/clerk/clerk-client.ts. Clerk is opt-in - the app
 * functions fully without it. These utilities let components safely check if
 * Clerk is enabled BEFORE touching any Clerk hook/component.
 *
 * Gating contract (identical to the Next app):
 *   isClerkEnabled() === true  <=>  auth provider is 'clerk' AND a valid
 *   publishable key (pk_...) is present.
 *
 * Both inputs come from import.meta.env, so Vite inlines them at build time -
 * isClerkEnabled() is a per-build compile-time constant (the same property the
 * Next app got from NEXT_PUBLIC_* inlining). This is what makes the
 * lazy-require gating pattern in nav-user.tsx etc. safe.
 */

import { error } from '@chm/logger'
import { getClientAuthProvider } from '@/lib/env'

/**
 * Client-safe publishable key, resolved at build time from
 * VITE_CLERK_PUBLISHABLE_KEY (the NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY equivalent).
 *
 * Clerk's <ClerkProvider> auto-reads this same env var, so the value the gate
 * checks and the value Clerk initializes from are guaranteed to match.
 */
export const CLERK_PUBLISHABLE_KEY: string | undefined = import.meta.env
  .VITE_CLERK_PUBLISHABLE_KEY

/**
 * Check if Clerk authentication is enabled.
 *
 * @returns true if auth provider is clerk and the publishable key is valid
 */
export function isClerkClientEnabled(): boolean {
  try {
    if (getClientAuthProvider() !== 'clerk') return false
  } catch (err) {
    error('[clerk] Auth provider check failed', err)
    return false
  }

  return Boolean(CLERK_PUBLISHABLE_KEY?.startsWith('pk_'))
}

/** Alias used by ported components. */
export const isClerkEnabled = isClerkClientEnabled
