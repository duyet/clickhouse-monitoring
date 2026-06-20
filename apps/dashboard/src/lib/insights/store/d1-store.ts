/**
 * Cloudflare D1 insights backend.
 *
 * Persists findings in a dedicated `insights_findings` table on a D1 database.
 * By default it reuses the same D1 binding as the agent's conversation store
 * (`CONVERSATIONS_D1`) so operators who already provisioned D1 get insight
 * persistence for free; an optional dedicated `INSIGHTS_D1` binding takes
 * precedence when present.
 *
 * Best-effort like every backend: the table is migrated lazily on first use and
 * all failures are swallowed (logged) so a misconfigured binding degrades to
 * "no persisted insights" rather than breaking generation. Mirrors the D1
 * conversation store but with the scalar findings schema.
 */

import type {
  Finding,
  FindingRow,
  InsightsStore,
  ListFindingsOptions,
} from './types'

import { intervalToMs } from './interval'
import { ErrorLogger } from '@chm/logger'
import { getPlatformBindings } from '@chm/platform'

const COMPONENT = 'insights-d1-store'
const warn = (msg: string) =>
  ErrorLogger.logWarning(`[insights-d1-store] ${msg}`, { component: COMPONENT })

/** Preferred dedicated binding, then the shared conversation binding. */
const D1_BINDING_NAMES = ['INSIGHTS_D1', 'CONVERSATIONS_D1'] as const

const TABLE = 'insights_findings'

const MIGRATION_SQL = `
  CREATE TABLE IF NOT EXISTS ${TABLE} (
    event_time INTEGER NOT NULL,
    host_id TEXT NOT NULL,
    severity TEXT NOT NULL,
    category TEXT NOT NULL,
    source TEXT NOT NULL,
    title TEXT NOT NULL,
    detail TEXT NOT NULL DEFAULT '',
    metric TEXT NOT NULL DEFAULT '',
    value REAL NOT NULL DEFAULT 0
  )
`
const INDEX_SQL = `
  CREATE INDEX IF NOT EXISTS idx_${TABLE}_host_time
    ON ${TABLE} (host_id, event_time)
`

/** D1 row shape (event_time is unix ms). */
interface D1FindingRow {
  event_time: number
  host_id: string
  severity: string
  category: string
  source: string
  title: string
  detail: string
  metric: string
  value: number
}

export class D1InsightsStore implements InsightsStore {
  readonly backend = 'd1' as const
  private migrated = false

  private getDb(): D1Database | null {
    const bindings = getPlatformBindings()
    for (const name of D1_BINDING_NAMES) {
      const db = bindings.getD1Database(name)
      if (db) return db
    }
    return null
  }

  private async ensureMigrated(db: D1Database): Promise<void> {
    if (this.migrated) return
    await db.batch([db.prepare(MIGRATION_SQL), db.prepare(INDEX_SQL)])
    this.migrated = true
  }

  async record(hostId: number, findings: Finding[]): Promise<boolean> {
    if (findings.length === 0) return true
    try {
      const db = this.getDb()
      if (!db) {
        warn('no D1 binding (INSIGHTS_D1 / CONVERSATIONS_D1) found')
        return false
      }
      await this.ensureMigrated(db)

      const now = Date.now()
      const stmt = db.prepare(
        `INSERT INTO ${TABLE}
           (event_time, host_id, severity, category, source, title, detail, metric, value)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)`
      )
      await db.batch(
        findings.map((f) =>
          stmt.bind(
            now,
            String(hostId),
            f.severity,
            f.category,
            f.source,
            f.title,
            f.detail ?? '',
            f.metric ?? '',
            f.value ?? 0
          )
        )
      )
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
    const { severity, since, limit = 100 } = opts
    try {
      const db = this.getDb()
      if (!db) return []
      await this.ensureMigrated(db)

      const conditions = ['host_id = ?']
      const binds: (string | number)[] = [String(hostId)]

      if (severity) {
        conditions.push('severity = ?')
        binds.push(severity)
      }
      if (since) {
        const ms = intervalToMs(since)
        if (ms !== null) {
          conditions.push('event_time >= ?')
          binds.push(Date.now() - ms)
        } else {
          warn(`ignoring invalid "since" value: ${since}`)
        }
      }

      const safeLimit = Math.min(Math.max(Math.trunc(limit) || 0, 1), 1000)
      binds.push(safeLimit)

      const stmt = db
        .prepare(
          `SELECT event_time, host_id, severity, category, source, title, detail, metric, value
           FROM ${TABLE}
           WHERE ${conditions.join(' AND ')}
           ORDER BY event_time DESC
           LIMIT ?`
        )
        .bind(...binds)

      const result = await stmt.all<D1FindingRow>()
      return (result.results ?? []).map((r) => ({
        event_time: new Date(r.event_time).toISOString(),
        host_id: r.host_id,
        severity: r.severity,
        category: r.category,
        source: r.source,
        title: r.title,
        detail: r.detail,
        metric: r.metric,
        value: r.value,
      }))
    } catch (err) {
      warn(`failed to list findings on host ${hostId}: ${err}`)
      return []
    }
  }
}
