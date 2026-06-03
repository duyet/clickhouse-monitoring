// Isomorphic env bridge for the TanStack Start app.
//
// Next.js inlined `NEXT_PUBLIC_*` at build time and read server vars from
// `process.env`. The Vite/Workers equivalent:
//   - Client-exposed vars are VITE_-prefixed and read from import.meta.env
//     (typed in src/vite-env.d.ts).
//   - Server vars are read from the runtime env: process.env on node, or the
//     Cloudflare Worker binding passed in on the edge.
//
// Mirrors the Next app's lib/auth/provider.ts so auth gating semantics survive
// the migration unchanged.

export type AuthProvider = 'none' | 'clerk'

export class AuthProviderConfigError extends Error {
  constructor(value: string) {
    super(`Invalid auth provider "${value}". Expected one of: none, clerk.`)
    this.name = 'AuthProviderConfigError'
  }
}

export function parseAuthProvider(
  value: string | null | undefined
): AuthProvider {
  const normalized = value?.trim().toLowerCase()
  if (!normalized || normalized === 'none') return 'none'
  if (normalized === 'clerk') return 'clerk'
  throw new AuthProviderConfigError(value ?? '')
}

// Client-safe: resolved at build time from VITE_AUTH_PROVIDER
// (the NEXT_PUBLIC_AUTH_PROVIDER inlining equivalent).
export function getClientAuthProvider(): AuthProvider {
  return parseAuthProvider(import.meta.env.VITE_AUTH_PROVIDER)
}

// Server-side: runtime CHM_AUTH_PROVIDER wins, falling back to the build-time
// VITE_AUTH_PROVIDER. Pass the Cloudflare `env` binding on the edge; defaults
// to process.env on node.
export function getServerAuthProvider(
  runtimeEnv?: Record<string, string | undefined>
): AuthProvider {
  const source =
    runtimeEnv ?? (typeof process !== 'undefined' ? process.env : {})
  return parseAuthProvider(
    source.CHM_AUTH_PROVIDER ?? import.meta.env.VITE_AUTH_PROVIDER
  )
}

export function isClerkEnabled(
  runtimeEnv?: Record<string, string | undefined>
): boolean {
  return getServerAuthProvider(runtimeEnv) === 'clerk'
}
