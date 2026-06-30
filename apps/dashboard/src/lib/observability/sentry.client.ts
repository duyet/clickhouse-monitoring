// Browser-side Sentry init. Imported ONLY behind a `typeof document` guard +
// dynamic import() in router.tsx, so @sentry/react never lands in the
// size-constrained Cloudflare Worker SSR bundle (#1393).
//
// Disabled (no-op) unless VITE_SENTRY_DSN is set — the OSS default. The DSN is
// inlined at build time from the canonical CHM_SENTRY_DSN (see vite.config.ts).

import { buildSharedSentryOptions } from './sentry-options'
import * as Sentry from '@sentry/react'

let initialized = false

/** Initialize the browser SDK once. Safe to call repeatedly. */
export function initSentryClient(): void {
  if (initialized) return
  // Never run on the server — the worker uses @sentry/cloudflare instead.
  if (typeof document === 'undefined') return

  const options = buildSharedSentryOptions({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT,
    release: import.meta.env.VITE_GIT_SHA,
    tracesSampleRate: import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE,
  })
  if (!options) return // no DSN → Sentry disabled

  initialized = true
  Sentry.init({
    ...options,
    integrations: [Sentry.browserTracingIntegration()],
  })
}

/**
 * Report an error to Sentry from a React error boundary. A no-op when Sentry is
 * disabled, so call sites need no guard of their own.
 */
export function captureClientException(
  error: unknown,
  context?: Record<string, unknown>
): void {
  if (!initialized) return
  Sentry.captureException(error, context ? { extra: context } : undefined)
}
