import type { AuthProvider } from '@/lib/auth/provider'
import type { ServerAuthProvider } from './types'

import { ClerkAuthProvider } from './clerk'
import { NoneAuthProvider } from './none'
import { ProxyAuthProvider } from './proxy'
import { TrustedAuthProvider } from './trusted'

export type { AuthPrincipal, AuthResult, ServerAuthProvider } from './types'

// Provider implementations are stateless (config is read per request from
// process.env / import.meta.env), so a single instance per kind is reused.
const noneProvider = new NoneAuthProvider()
const clerkProvider = new ClerkAuthProvider()
const proxyProvider = new ProxyAuthProvider()
const trustedProvider = new TrustedAuthProvider()

/**
 * Resolve the server-side auth provider for the active `AuthProvider`.
 *
 * Named `resolveServerAuthProvider` (not `getServerAuthProvider`) to avoid the
 * existing `getServerAuthProvider` export in `@/lib/env`. Unknown values fall
 * back to the public `none` provider.
 */
export function resolveServerAuthProvider(
  provider: AuthProvider
): ServerAuthProvider {
  switch (provider) {
    case 'clerk':
      return clerkProvider
    case 'proxy':
      return proxyProvider
    case 'trusted':
      return trustedProvider
    default:
      return noneProvider
  }
}
