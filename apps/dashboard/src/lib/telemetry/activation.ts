// Activation metric definition (STRATEGY Phase 0 funnel).
//
// A first session is "activated" when the user connected a cluster AND looked
// at either health or queries in that session:
//
//   activation = cluster_connected AND (health_viewed OR queries_viewed)
//
// Kept as one tested, executable definition so the client, an analytics query
// over the telemetry store, and the docs all reference the same rule.

import type { TelemetryEvent } from './events'

export const ACTIVATION_REQUIRED: TelemetryEvent = 'cluster_connected'
export const ACTIVATION_ANY_OF: readonly TelemetryEvent[] = [
  'health_viewed',
  'queries_viewed',
]

export function isActivated(seen: Iterable<TelemetryEvent>): boolean {
  const set = seen instanceof Set ? seen : new Set(seen)
  return (
    set.has(ACTIVATION_REQUIRED) &&
    ACTIVATION_ANY_OF.some((event) => set.has(event))
  )
}
