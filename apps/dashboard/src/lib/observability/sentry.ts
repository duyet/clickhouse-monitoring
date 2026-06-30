// Isomorphic entry points for browser-side Sentry. The real implementation lives
// in `sentry.client.ts` (the `.client` suffix marks it browser-only). Importing
// a `.client` module directly from server-reachable code (router.tsx, error
// boundaries) trips TanStack Start's import-protection, so every caller goes
// through these `createIsomorphicFn().client()` wrappers instead: the client
// body — including the dynamic import of @sentry/react — is stripped from the
// SERVER build, keeping it out of the size-constrained Worker SSR bundle (#1393).

import { createIsomorphicFn } from '@tanstack/react-start'

/** Initialize the browser SDK as early as possible. No-op on the server. */
export const initSentryClient = createIsomorphicFn().client(() => {
  void import('./sentry.client').then((m) => m.initSentryClient())
})

/** Report an error to Sentry from a React error boundary. No-op on the server. */
export const reportClientError = createIsomorphicFn().client(
  (error: unknown, context?: Record<string, unknown>) => {
    void import('./sentry.client').then((m) =>
      m.captureClientException(error, context)
    )
  }
)
