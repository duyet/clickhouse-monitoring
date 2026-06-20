/**
 * In-memory insights backend — ephemeral, last-resort fallback.
 *
 * Holds findings in a per-host array inside the module. Data is lost on worker
 * restart / cold start, so this is never a deliberate production target; it
 * exists so `resolveInsightsStore` always returns a working store and so tests
 * have a dependency-free backend. Mirrors `conversation-store/memory-store.ts`.
 */

import type {
  Finding,
  FindingRow,
  InsightsStore,
  ListFindingsOptions,
} from './types'

import { intervalToMs } from './interval'
import { clampLimit, toFindingRow } from './types'

/** Bound the per-host buffer so a long-lived worker cannot grow unbounded. */
const MAX_ROWS_PER_HOST = 1000

export class MemoryInsightsStore implements InsightsStore {
  readonly backend = 'memory' as const

  // host id → findings, newest last.
  private readonly rows = new Map<number, FindingRow[]>()

  async record(hostId: number, findings: Finding[]): Promise<boolean> {
    if (findings.length === 0) return true
    const now = new Date().toISOString()
    const bucket = this.rows.get(hostId) ?? []
    for (const f of findings) bucket.push(toFindingRow(hostId, f, now))
    // Keep only the most recent rows.
    this.rows.set(hostId, bucket.slice(-MAX_ROWS_PER_HOST))
    return true
  }

  async list(
    hostId: number,
    opts: ListFindingsOptions = {}
  ): Promise<FindingRow[]> {
    const { severity, since } = opts
    let rows = [...(this.rows.get(hostId) ?? [])].reverse() // newest first

    if (severity) rows = rows.filter((r) => r.severity === severity)

    if (since) {
      const ms = intervalToMs(since)
      if (ms !== null) {
        const cutoff = Date.now() - ms
        rows = rows.filter((r) => Date.parse(r.event_time) >= cutoff)
      }
    }

    return rows.slice(0, clampLimit(opts.limit))
  }
}
