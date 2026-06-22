/**
 * Unit tests for mutationsConfig (merges/mutations.ts).
 *
 * Validates exported constants, QueryConfig shape, SQL content, column list,
 * columnFormats, card layout, relatedCharts, and the rowClassName callback.
 */

import {
  LONG_RUNNING_THRESHOLD_SECONDS,
  mutationsConfig,
  STUCK_THRESHOLD_SECONDS,
} from './mutations'
import { describe, expect, test } from 'bun:test'
import { ColumnFormat } from '@/types/column-format'

// ---------------------------------------------------------------------------
// Exported constants
// ---------------------------------------------------------------------------

describe('exported constants', () => {
  test('STUCK_THRESHOLD_SECONDS is 600 (10 minutes)', () => {
    expect(STUCK_THRESHOLD_SECONDS).toBe(600)
  })

  test('LONG_RUNNING_THRESHOLD_SECONDS is 300 (5 minutes)', () => {
    expect(LONG_RUNNING_THRESHOLD_SECONDS).toBe(300)
  })
})

// ---------------------------------------------------------------------------
// Basic shape
// ---------------------------------------------------------------------------

describe('mutationsConfig shape', () => {
  test('name is "mutations"', () => {
    expect(mutationsConfig.name).toBe('mutations')
  })

  test('defaultView is "auto"', () => {
    expect(mutationsConfig.defaultView).toBe('auto')
  })

  test('refreshInterval is 30 000 ms', () => {
    expect(mutationsConfig.refreshInterval).toBe(30_000)
  })

  test('description is set', () => {
    expect(typeof mutationsConfig.description).toBe('string')
    expect(mutationsConfig.description!.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// Card layout
// ---------------------------------------------------------------------------

describe('card config', () => {
  test('card is defined', () => {
    expect(mutationsConfig.card).toBeDefined()
  })

  test('card.primary is "command"', () => {
    expect(mutationsConfig.card!.primary).toBe('command')
  })

  test('card.badges contains is_done and is_stuck', () => {
    expect(mutationsConfig.card!.badges).toContain('is_done')
    expect(mutationsConfig.card!.badges).toContain('is_stuck')
  })
})

// ---------------------------------------------------------------------------
// SQL
// ---------------------------------------------------------------------------

describe('SQL content', () => {
  const sql = mutationsConfig.sql as string

  test('sql is a string', () => {
    expect(typeof sql).toBe('string')
  })

  test('queries system.mutations', () => {
    expect(sql).toContain('system.mutations')
  })

  test('selects database and table as concatenated "table" column', () => {
    expect(sql).toContain("database || '.' || table as table")
  })

  test('includes mutation_id', () => {
    expect(sql).toContain('mutation_id')
  })

  test('includes command', () => {
    expect(sql).toContain('command')
  })

  test('includes create_time and elapsed', () => {
    expect(sql).toContain('create_time')
    expect(sql).toContain('now() - create_time AS elapsed')
  })

  test('includes parts_to_do with background-bar triple', () => {
    expect(sql).toContain('parts_to_do')
    expect(sql).toContain(
      'formatReadableQuantity(parts_to_do) AS readable_parts_to_do'
    )
    expect(sql).toContain('pct_parts_to_do')
  })

  test('includes is_done', () => {
    expect(sql).toContain('is_done')
  })

  test('is_stuck derived using STUCK_THRESHOLD_SECONDS (600)', () => {
    expect(sql).toContain('is_stuck')
    expect(sql).toContain(String(STUCK_THRESHOLD_SECONDS))
  })

  test('includes latest_failed_part, latest_fail_time, latest_fail_reason', () => {
    expect(sql).toContain('latest_failed_part')
    expect(sql).toContain('latest_fail_time')
    expect(sql).toContain('latest_fail_reason')
  })

  test('orders by is_done ASC, is_stuck DESC, create_time DESC', () => {
    expect(sql).toContain(
      'ORDER BY is_done ASC, is_stuck DESC, create_time DESC'
    )
  })
})

// ---------------------------------------------------------------------------
// Columns
// ---------------------------------------------------------------------------

describe('columns', () => {
  const cols = mutationsConfig.columns as string[]

  test('contains all expected column names', () => {
    const expected = [
      'is_done',
      'is_stuck',
      'table',
      'mutation_id',
      'command',
      'create_time',
      'elapsed',
      'readable_parts_to_do',
      'latest_failed_part',
      'latest_fail_time',
      'latest_fail_reason',
    ]
    for (const col of expected) {
      expect(cols).toContain(col)
    }
  })

  test('has exactly 11 columns', () => {
    expect(cols.length).toBe(11)
  })

  test('pct_parts_to_do is NOT in the visible columns list', () => {
    expect(cols).not.toContain('pct_parts_to_do')
  })
})

// ---------------------------------------------------------------------------
// Column formats
// ---------------------------------------------------------------------------

describe('columnFormats', () => {
  const fmt = mutationsConfig.columnFormats!

  test('table uses ColoredBadge', () => {
    expect(fmt.table).toBe(ColumnFormat.ColoredBadge)
  })

  test('command uses CodeDialog', () => {
    expect(fmt.command).toBe(ColumnFormat.CodeDialog)
  })

  test('is_done uses Boolean', () => {
    expect(fmt.is_done).toBe(ColumnFormat.Boolean)
  })

  test('is_stuck uses Boolean', () => {
    expect(fmt.is_stuck).toBe(ColumnFormat.Boolean)
  })

  test('elapsed uses Duration', () => {
    expect(fmt.elapsed).toBe(ColumnFormat.Duration)
  })

  test('readable_parts_to_do uses BackgroundBar', () => {
    expect(fmt.readable_parts_to_do).toBe(ColumnFormat.BackgroundBar)
  })
})

// ---------------------------------------------------------------------------
// relatedCharts
// ---------------------------------------------------------------------------

describe('relatedCharts', () => {
  const charts = mutationsConfig.relatedCharts as [string, object][]

  test('has exactly 3 related charts', () => {
    expect(charts.length).toBe(3)
  })

  test('first chart is summary-stuck-mutations', () => {
    expect(charts[0][0]).toBe('summary-stuck-mutations')
  })

  test('second chart is summary-used-by-mutations', () => {
    expect(charts[1][0]).toBe('summary-used-by-mutations')
  })

  test('third chart is merge-count with interval and lastHours', () => {
    expect(charts[2][0]).toBe('merge-count')
    const opts = charts[2][1] as Record<string, unknown>
    expect(opts.interval).toBe('toStartOfDay')
    expect(opts.lastHours).toBe(24 * 14)
  })
})

// ---------------------------------------------------------------------------
// rowClassName callback
// ---------------------------------------------------------------------------

describe('rowClassName', () => {
  const fn = mutationsConfig.rowClassName!

  test('is_stuck=1 → red row', () => {
    const cls = fn({ is_stuck: 1, is_done: 0, elapsed: 0 })
    expect(cls).toContain('bg-red-50')
  })

  test('is_stuck=1 overrides long-running amber check', () => {
    const cls = fn({
      is_stuck: 1,
      is_done: 0,
      elapsed: LONG_RUNNING_THRESHOLD_SECONDS + 100,
    })
    expect(cls).toContain('bg-red-50')
    expect(cls).not.toContain('amber')
  })

  test('not done + elapsed > LONG_RUNNING_THRESHOLD_SECONDS → amber row', () => {
    const cls = fn({
      is_stuck: 0,
      is_done: 0,
      elapsed: LONG_RUNNING_THRESHOLD_SECONDS + 1,
    })
    expect(cls).toContain('bg-amber-50')
  })

  test('not done + elapsed exactly at threshold → no highlight', () => {
    const cls = fn({
      is_stuck: 0,
      is_done: 0,
      elapsed: LONG_RUNNING_THRESHOLD_SECONDS,
    })
    expect(cls).toBe('')
  })

  test('is_done=1 → no highlight even with large elapsed', () => {
    const cls = fn({ is_stuck: 0, is_done: 1, elapsed: 9999 })
    expect(cls).toBe('')
  })

  test('all zeros → empty string (no highlight)', () => {
    const cls = fn({ is_stuck: 0, is_done: 0, elapsed: 0 })
    expect(cls).toBe('')
  })

  test('missing fields coerce to 0 — no highlight', () => {
    const cls = fn({})
    expect(cls).toBe('')
  })

  test('string "1" for is_stuck is treated as stuck', () => {
    const cls = fn({ is_stuck: '1', is_done: 0, elapsed: 0 })
    expect(cls).toContain('bg-red-50')
  })
})
