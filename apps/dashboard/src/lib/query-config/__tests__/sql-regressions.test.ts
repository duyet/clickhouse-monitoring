import { diskUsageChangeConfig } from '../anomaly/anomaly-queries'
import { explorerProjectionsConfig } from '../explorer/projections'
import { mergesConfig } from '../merges/merges'
import { expensiveQueriesConfig } from '../queries/expensive-queries'
import { projectionsConfig } from '../tables/projections'
import { tablesOverviewConfig } from '../tables/tables-overview'
import { describe, expect, test } from 'bun:test'

/** Flatten versioned or plain sql into one string for assertions. */
function allSql(config: { sql: string | { sql: string }[] }): string {
  return typeof config.sql === 'string'
    ? config.sql
    : config.sql.map((v) => v.sql).join('\n')
}

// Regression guards for SQL bugs fixed in the core-values sweep.
// These assert exact fragments so a revert reintroducing the bug fails fast.
describe('query-config SQL regressions', () => {
  test('expensive-queries aliases SelectedBytes as lowercase selected_bytes', () => {
    const sql = allSql(expensiveQueriesConfig)
    expect(sql).not.toContain('Selected_bytes')
    expect(sql).toContain('as selected_bytes')
    expect(expensiveQueriesConfig.columns).toContain('selected_bytes')
  })

  test('compression-ratio divisions are guarded with nullIf', () => {
    expect(allSql(tablesOverviewConfig)).toContain(
      'uncompressed / nullIf(compressed, 0)'
    )
    expect(allSql(projectionsConfig)).toContain(
      'uncompressed / nullIf(compressed, 0)'
    )
    expect(allSql(explorerProjectionsConfig)).toContain(
      'nullIf(sum(data_compressed_bytes), 0)'
    )
  })

  test('disk-usage-change anomaly query is bounded by LIMIT', () => {
    expect(allSql(diskUsageChangeConfig)).toContain('LIMIT 10000')
  })

  test('merges columnFormats only reference produced columns', () => {
    // system.merges has no `query` column; a stale Code format once pointed at it.
    expect(Object.keys(mergesConfig.columnFormats ?? {})).not.toContain('query')
  })
})
