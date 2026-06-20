/**
 * PostgreSQL insights backend.
 *
 * Persists findings in an `insights_findings` table, auto-migrated on first use.
 * Reuses the same `DATABASE_URL` as the agent's Postgres conversation store, so
 * a single Postgres instance can back both subsystems.
 *
 * IMPORTANT: like the conversation Postgres store, this module is only ever
 * loaded via dynamic import from the resolver on the Node path — the `postgres`
 * package is Node-only and must never be bundled into the Cloudflare Workers
 * build (the CF path resolves D1 first and never reaches here).
 *
 * Best-effort: any failure logs and degrades to no-op / empty rather than
 * throwing, matching the contract of the other backends.
 */

import type {
  Finding,
  FindingRow,
  InsightsStore,
  ListFindingsOptions,
} from './types'

import { intervalToMs } from './interval'
import { clampLimit, rowFromStored } from './types'
import { ErrorLogger } from '@chm/logger'
import postgres from 'postgres'

const COMPONENT = 'insights-postgres-store'
const warn = (msg: string) =>
  ErrorLogger.logWarning(`[insights-postgres-store] ${msg}`, {
    component: COMPONENT,
  })

const MIGRATION_SQL = `
  CREATE TABLE IF NOT EXISTS insights_findings (
    event_time BIGINT NOT NULL,
    host_id TEXT NOT NULL,
    severity TEXT NOT NULL,
    category TEXT NOT NULL,
    source TEXT NOT NULL,
    title TEXT NOT NULL,
    detail TEXT NOT NULL DEFAULT '',
    metric TEXT NOT NULL DEFAULT '',
    value DOUBLE PRECISION NOT NULL DEFAULT 0
  );
  CREATE INDEX IF NOT EXISTS idx_insights_findings_host_time
    ON insights_findings (host_id, event_time DESC);
`

/** Postgres row shape (event_time is unix ms, returned as string by the driver). */
interface PgFindingRow {
  event_time: string | number
  host_id: string
  severity: string
  category: string
  source: string
  title: string
  detail: string
  metric: string
  value: string | number
}

export class PostgresInsightsStore implements InsightsStore {
  readonly backend = 'postgres' as const
  private readonly sql: ReturnType<typeof postgres>
  // Single-flight migration: concurrent first calls share one promise so the
  // idempotent DDL runs at most once; a failure clears it so the next call retries.
  private migration: Promise<void> | null = null

  constructor(connectionString?: string) {
    const url = connectionString ?? process.env.DATABASE_URL
    if (!url) {
      throw new Error(
        'DATABASE_URL is required for the Postgres insights store'
      )
    }
    this.sql = postgres(url, { max: 5, idle_timeout: 20 })
  }

  private ensureMigrated(): Promise<void> {
    if (!this.migration) {
      this.migration = (async () => {
        try {
          await this.sql.unsafe(MIGRATION_SQL)
        } catch (err) {
          this.migration = null
          throw err
        }
      })()
    }
    return this.migration
  }

  async record(hostId: number, findings: Finding[]): Promise<boolean> {
    if (findings.length === 0) return true
    try {
      await this.ensureMigrated()
      const now = Date.now()
      const rows = findings.map((f) => ({
        event_time: now,
        host_id: String(hostId),
        severity: f.severity,
        category: f.category,
        source: f.source,
        title: f.title,
        detail: f.detail ?? '',
        metric: f.metric ?? '',
        value: f.value ?? 0,
      }))
      await this.sql`INSERT INTO insights_findings ${this.sql(rows)}`
      return true
    } catch (err) {
      warn(`failed to record findings on host ${hostId}: ${err}`)
      return false
    }
  }

  async list(
    hostId: number,
    opts: ListFindingsOptions = {}
  ): Promise<FindingRow[]> {
    const { severity, since } = opts
    try {
      await this.ensureMigrated()

      const safeLimit = clampLimit(opts.limit)
      const sinceMs = since ? intervalToMs(since) : null
      if (since && sinceMs === null)
        warn(`ignoring invalid "since" value: ${since}`)
      const cutoff = sinceMs !== null ? Date.now() - sinceMs : null

      const result = (await this.sql`
        SELECT event_time, host_id, severity, category, source, title, detail, metric, value
        FROM insights_findings
        WHERE host_id = ${String(hostId)}
          ${severity ? this.sql`AND severity = ${severity}` : this.sql``}
          ${cutoff !== null ? this.sql`AND event_time >= ${cutoff}` : this.sql``}
        ORDER BY event_time DESC
        LIMIT ${safeLimit}
      `) as unknown as PgFindingRow[]

      return result.map(rowFromStored)
    } catch (err) {
      warn(`failed to list findings on host ${hostId}: ${err}`)
      return []
    }
  }
}
