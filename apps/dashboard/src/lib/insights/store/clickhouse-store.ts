/**
 * ClickHouse insights backend — the default.
 *
 * A thin adapter over the existing `lib/findings/findings-store.ts`, which owns
 * an app-created table on the monitored cluster. This preserves the original
 * behavior exactly (lazy CREATE TABLE, 30-day TTL, best-effort writes) while
 * fitting the pluggable `InsightsStore` interface. When `INSIGHTS_STORE_BACKEND`
 * is unset (`auto`), this is what `resolveInsightsStore` returns.
 */

import type {
  Finding,
  FindingRow,
  InsightsStore,
  ListFindingsOptions,
} from './types'

import {
  listRecentFindings,
  recordFinding,
} from '@/lib/findings/findings-store'

export class ClickHouseInsightsStore implements InsightsStore {
  readonly backend = 'clickhouse' as const

  async record(hostId: number, findings: Finding[]): Promise<boolean> {
    if (findings.length === 0) return true
    // recordFinding is itself best-effort (returns false on read-only clusters).
    const results = await Promise.all(
      findings.map((f) => recordFinding(hostId, f))
    )
    return results.every(Boolean)
  }

  list(hostId: number, opts?: ListFindingsOptions): Promise<FindingRow[]> {
    return listRecentFindings(hostId, opts)
  }
}
