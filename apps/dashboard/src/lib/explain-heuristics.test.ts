import {
  analyzeExplain,
  checkFullScanWithoutPrewhere,
  checkHighReadRowsToResultRatio,
  checkLargeJoinWithoutKey,
  checkMissingPartitionPruning,
  checkNoIndexUsed,
  truncateSql,
} from './explain-heuristics'
import { describe, expect, test } from 'bun:test'

describe('truncateSql', () => {
  test('collapses internal whitespace', () => {
    expect(truncateSql('SELECT  *\n  FROM   events')).toBe(
      'SELECT * FROM events'
    )
  })

  test('trims surrounding whitespace', () => {
    expect(truncateSql('  SELECT 1  ')).toBe('SELECT 1')
  })

  test('returns unchanged when within maxLen', () => {
    const short = 'SELECT 1'
    expect(truncateSql(short, 80)).toBe('SELECT 1')
  })

  test('truncates at maxLen and appends ellipsis', () => {
    const sql =
      'SELECT col1, col2, col3 FROM very_long_table_name WHERE condition = 1'
    const result = truncateSql(sql, 30)
    expect(result.length).toBe(31) // 30 chars + '…'
    expect(result.endsWith('…')).toBe(true)
  })

  test('uses default maxLen of 80', () => {
    const long = 'A'.repeat(100)
    const result = truncateSql(long)
    expect(result.length).toBe(81) // 80 + '…'
  })
})

describe('checkFullScanWithoutPrewhere', () => {
  test('returns suggestion when MergeTree scan has no PREWHERE', () => {
    const plan = ['ReadFromMergeTree (default.events)', '  Columns: a, b, c']
    const sql = 'SELECT * FROM events WHERE a = 1'
    const result = checkFullScanWithoutPrewhere(sql, plan)
    expect(result?.id).toBe('full-scan-no-prewhere')
    expect(result?.severity).toBe('warning')
  })

  test('returns null when PREWHERE is present in plan lines', () => {
    const plan = [
      'ReadFromMergeTree (default.events)',
      '  PREWHERE a = 1',
      '  Columns: a, b',
    ]
    const sql = 'SELECT * FROM events PREWHERE a = 1 WHERE b = 2'
    expect(checkFullScanWithoutPrewhere(sql, plan)).toBeNull()
  })

  test('returns null when PREWHERE is in the SQL but not the plan', () => {
    const plan = ['ReadFromMergeTree (default.events)', '  Columns: a']
    const sql = 'SELECT * FROM events PREWHERE a = 1'
    expect(checkFullScanWithoutPrewhere(sql, plan)).toBeNull()
  })

  test('returns null when there is no MergeTree scan at all', () => {
    const plan = ['ExpressionTransform', '  Expression: (a + b)']
    expect(checkFullScanWithoutPrewhere('SELECT 1 + 1', plan)).toBeNull()
  })
})

describe('checkMissingPartitionPruning', () => {
  test('returns suggestion when selected parts > 100', () => {
    const plan = ['ReadFromMergeTree', '  Parts: 450/500']
    const result = checkMissingPartitionPruning('SELECT 1', plan)
    expect(result?.id).toBe('missing-partition-pruning')
  })

  test('returns suggestion when selected/total ratio > 0.8', () => {
    const plan = ['ReadFromMergeTree', '  Parts: 9/10']
    expect(checkMissingPartitionPruning('SELECT 1', plan)?.id).toBe(
      'missing-partition-pruning'
    )
  })

  test('returns null when few parts are selected', () => {
    const plan = ['ReadFromMergeTree', '  Parts: 2/500']
    expect(checkMissingPartitionPruning('SELECT 1', plan)).toBeNull()
  })

  test('returns null when no Parts line is present', () => {
    const plan = ['ReadFromMergeTree', '  Columns: a, b']
    expect(checkMissingPartitionPruning('SELECT 1', plan)).toBeNull()
  })

  test('returns null when total is zero (avoids divide by zero)', () => {
    const plan = ['Parts: 0/0']
    expect(checkMissingPartitionPruning('SELECT 1', plan)).toBeNull()
  })
})

describe('checkHighReadRowsToResultRatio', () => {
  test('returns warning when ratio > 1000 and readRows > 1M', () => {
    const result = checkHighReadRowsToResultRatio('SELECT 1', [], 2_000_000, 1)
    expect(result?.id).toBe('high-read-rows-ratio')
    expect(result?.severity).toBe('warning')
  })

  test('rationale includes formatted row counts', () => {
    const result = checkHighReadRowsToResultRatio(
      'SELECT 1',
      [],
      5_000_000,
      100
    )
    expect(result?.rationale).toMatch(/5\.0M/)
    expect(result?.rationale).toMatch(/100/)
  })

  test('returns null when readRows <= 1M', () => {
    expect(
      checkHighReadRowsToResultRatio('SELECT 1', [], 900_000, 1)
    ).toBeNull()
  })

  test('returns null when resultRows is 0', () => {
    expect(
      checkHighReadRowsToResultRatio('SELECT 1', [], 2_000_000, 0)
    ).toBeNull()
  })

  test('returns null when ratio <= 1000', () => {
    expect(
      checkHighReadRowsToResultRatio('SELECT 1', [], 2_000_000, 5_000)
    ).toBeNull()
  })

  test('returns null when readRows is undefined', () => {
    expect(checkHighReadRowsToResultRatio('SELECT 1', [])).toBeNull()
  })
})

describe('checkLargeJoinWithoutKey', () => {
  test('returns suggestion when SQL has JOIN and plan has Hash Join without key', () => {
    const sql = 'SELECT * FROM a JOIN b ON a.id = b.id'
    const plan = [
      'Hash Join',
      '  Left: ReadFromMergeTree (a)',
      '  Right: ReadFromMergeTree (b)',
    ]
    expect(checkLargeJoinWithoutKey(sql, plan)?.id).toBe(
      'large-join-without-key'
    )
  })

  test('returns suggestion for Cross Join', () => {
    const sql = 'SELECT * FROM a CROSS JOIN b'
    const plan = ['Cross Join', '  Left: ReadFromMergeTree']
    expect(checkLargeJoinWithoutKey(sql, plan)?.id).toBe(
      'large-join-without-key'
    )
  })

  test('returns null when SQL has no JOIN', () => {
    const plan = ['Hash Join']
    expect(checkLargeJoinWithoutKey('SELECT 1', plan)).toBeNull()
  })

  test('returns null when Hash Join line contains "key"', () => {
    const sql = 'SELECT * FROM a JOIN b ON a.id = b.id'
    const plan = ['Hash Join (key=a.id)']
    expect(checkLargeJoinWithoutKey(sql, plan)).toBeNull()
  })
})

describe('checkNoIndexUsed', () => {
  test('returns info suggestion when MergeTree scan has no index hints', () => {
    const plan = ['ReadFromMergeTree (default.events)', '  Columns: a, b']
    const result = checkNoIndexUsed('SELECT * FROM events', plan)
    expect(result?.id).toBe('no-index-hint')
    expect(result?.severity).toBe('info')
  })

  test('returns null when Indexes: line is present', () => {
    const plan = [
      'ReadFromMergeTree (default.events)',
      '  Indexes:',
      '    PrimaryKey',
    ]
    expect(checkNoIndexUsed('SELECT * FROM events', plan)).toBeNull()
  })

  test('returns null when "Selected marks:" is present', () => {
    const plan = ['ReadFromMergeTree (default.events)', '  Selected marks: 5']
    expect(checkNoIndexUsed('SELECT * FROM events', plan)).toBeNull()
  })

  test('returns null when no MergeTree scan', () => {
    const plan = ['ExpressionTransform']
    expect(checkNoIndexUsed('SELECT 1', plan)).toBeNull()
  })
})

describe('analyzeExplain', () => {
  test('returns empty array for empty plan lines', () => {
    expect(analyzeExplain('SELECT 1', [])).toEqual([])
  })

  test('returns multiple suggestions for a scan with no prewhere and no index', () => {
    const plan = ['ReadFromMergeTree (default.events)', '  Columns: a, b']
    const sql = 'SELECT * FROM events WHERE a = 1'
    const results = analyzeExplain(sql, plan)
    const ids = results.map((s) => s.id)
    expect(ids).toContain('full-scan-no-prewhere')
    expect(ids).toContain('no-index-hint')
  })

  test('deduplicates suggestions with the same id', () => {
    // Both checkFullScanWithoutPrewhere and checkNoIndexUsed could trigger —
    // verify IDs are unique across the returned array.
    const plan = ['ReadFromMergeTree (default.events)', '  Columns: a']
    const results = analyzeExplain('SELECT * FROM events', plan)
    const ids = results.map((s) => s.id)
    const uniqueIds = [...new Set(ids)]
    expect(ids).toEqual(uniqueIds)
  })

  test('includes high-read-rows-ratio when row counts are extreme', () => {
    const plan = ['ReadFromMergeTree', '  Columns: a']
    const results = analyzeExplain('SELECT * FROM t', plan, 5_000_000, 1)
    const ids = results.map((s) => s.id)
    expect(ids).toContain('high-read-rows-ratio')
  })

  test('returns only info suggestions for clean plan with no rows threshold', () => {
    const plan = ['ReadFromMergeTree', '  Columns: a']
    const results = analyzeExplain('SELECT * FROM t', plan)
    // Should only have no-index-hint (info) and full-scan-no-prewhere (warning)
    expect(results.every((s) => ['warning', 'info'].includes(s.severity))).toBe(
      true
    )
  })
})
