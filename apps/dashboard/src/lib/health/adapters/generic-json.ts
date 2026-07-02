/**
 * Generic JSON notification adapter (pure formatter).
 *
 * Produces a clean, normalized JSON body for arbitrary webhook receivers that
 * do not follow a vendor-specific schema. This is the fallback shape used when
 * no channel-specific adapter matches the webhook URL.
 */

import type { AlertPayload, NotificationAdapter } from './types'

/** Normalized JSON body for generic webhook receivers. */
export interface GenericJsonBody {
  severity: AlertPayload['severity']
  title: string
  metric: string
  value: number | null
  thresholds: { warning: number | null; critical: number | null }
  host: { id: number; label: string }
  label: string
  runbookUrls: string[]
  timestamp: string
  /** A ready-to-render one-line summary, mirroring the sweep/webhook text. */
  text: string
  snapshot?: unknown
}

/**
 * Build the normalized generic JSON body for a payload.
 */
export function buildGenericJsonBody(payload: AlertPayload): GenericJsonBody {
  const heading =
    payload.severity === 'recovery'
      ? 'RECOVERY'
      : payload.severity.toUpperCase()

  const body: GenericJsonBody = {
    severity: payload.severity,
    title: payload.title,
    metric: payload.metric,
    value: payload.value,
    thresholds: {
      warning: payload.warnThreshold ?? null,
      critical: payload.critThreshold ?? null,
    },
    host: { id: payload.hostId, label: payload.hostLabel },
    label: payload.label,
    runbookUrls: payload.runbookUrls ? [...payload.runbookUrls] : [],
    timestamp: payload.timestamp,
    text: `[${heading}] ${payload.title} — ${payload.label} (host ${payload.hostLabel})`,
  }

  if (payload.snapshot !== undefined) {
    body.snapshot = payload.snapshot
  }

  return body
}

/**
 * Generic JSON adapter. Has no `detect` — it is the catch-all fallback the
 * registry uses when no channel-specific adapter matches.
 */
export const genericJsonAdapter: NotificationAdapter = {
  id: 'generic-json',
  buildBody: (payload: AlertPayload) => buildGenericJsonBody(payload),
}
