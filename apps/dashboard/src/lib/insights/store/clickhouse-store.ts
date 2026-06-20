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

import { ErrorLogger } from '@chm/logger'
import {
  listRecentFindings,
  recordFinding,
} from '@/lib/findings/findings-store'

export class ClickHouseInsightsStore implements InsightsStore {
  readonly backend = 'clickhouse' as const

  async record(hostId: number, findings: Finding[]): Promise<boolean> {
    if (findings.length === 0) return true
    try {
      // recordFinding is itself best-effort (returns false on read-only
      // clusters). Guard Promise.all anyway: a single unexpected rejection must
      // not propagate — the InsightsStore contract is no-throw.
      const results = await Promise.all(
        findings.map((f) => recordFinding(hostId, f))
      )
      return results.every(Boolean)
    } catch (err) {
      ErrorLogger.logWarning(
        `[insights-clickhouse-store] failed to record findings on host ${hostId}: ${err}`,
        { component: 'insights-clickhouse-store' }
      )
      return false
    }
  }

  async list(
    hostId: number,
    opts?: ListFindingsOptions
  ): Promise<FindingRow[]> {
    // listRecentFindings is best-effort (returns [] on error), but guard against
    // an unexpected throw to keep the no-throw contract.
    try {
      return await listRecentFindings(hostId, opts)
    } catch (err) {
      ErrorLogger.logWarning(
        `[insights-clickhouse-store] failed to list findings on host ${hostId}: ${err}`,
        { component: 'insights-clickhouse-store' }
      )
      return []
    }
  }
}
