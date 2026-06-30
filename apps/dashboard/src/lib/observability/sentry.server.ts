// Server-side Sentry for the Cloudflare Worker (and Node/Docker) runtime.
//
// Cloudflare Workers have no long-lived process, so there is no global init():
// @sentry/cloudflare binds a fresh client PER REQUEST via wrapRequestHandler.
// This module only resolves the options; start.ts does the wrapping.
//
// Disabled (returns null) unless CHM_SENTRY_DSN is set — the OSS default. The
// DSN is a Worker [var] injected from .env.production (patch-wrangler-env.ts);
// on Node it comes from process.env.

import type { CloudflareOptions } from '@sentry/cloudflare'

import { buildSharedSentryOptions } from './sentry-options'

/**
 * Resolve the Worker Sentry options from runtime env, or `null` when no DSN is
 * configured (Sentry disabled). `env` is the `cloudflare:workers` binding map on
 * the Worker; falls back to process.env on Node/Docker.
 */
export function resolveServerSentryOptions(
  env?: Record<string, string | undefined>
): CloudflareOptions | null {
  const read = (key: string): string | undefined =>
    env?.[key] ?? process.env[key]

  return buildSharedSentryOptions({
    dsn: read('CHM_SENTRY_DSN'),
    environment: read('CHM_SENTRY_ENVIRONMENT'),
    // Build-time git SHA, inlined into the server bundle too (VITE_* is inlined
    // into both bundles). Keeps client + server releases identical.
    release: import.meta.env.VITE_GIT_SHA,
    tracesSampleRate: read('CHM_SENTRY_TRACES_SAMPLE_RATE'),
  })
}
