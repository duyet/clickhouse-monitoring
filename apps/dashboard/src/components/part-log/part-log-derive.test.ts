import type { PartLogRow } from './lib'

import { derivePartLogData } from './part-log-derive'
import { describe, expect, it } from 'bun:test'

function row(overrides: Partial<PartLogRow>): PartLogRow {
  return {
    event_time: '2024-01-01 00:00:00',
    event_unixtime: '0',
    event_type: 'NewPart',
    merge_reason: 'NotAMerge',
    database: 'default',
    table: 'default.t',
    table_name: 't',
    part_name: 'all_1_1_0',
    partition_id: 'all',
    part_type: 'Compact',
    part_level: '0',
    rows: '0',
    readable_rows: '0',
    read_rows: '0',
    size_in_bytes: '0',
    readable_size: '0 B',
    duration_ms: '0',
    readable_duration: '0ms',
    peak_memory_usage: '0',
    readable_peak_memory: '0 B',
    error: '0',
    exception: '',
    ...overrides,
  }
}

describe('derivePartLogData', () => {
  it('counts new parts and averages their size', () => {
    const { kpis } = derivePartLogData([
      row({ event_type: 'NewPart', size_in_bytes: '100' }),
      row({ event_type: 'NewPart', size_in_bytes: '300' }),
    ])
    expect(kpis.newParts).toBe(2)
    expect(kpis.newAvgSize).toBe(200)
    expect(kpis.totalEvents).toBe(2)
  })

  it('splits merges into regular vs TTL percentages', () => {
    const { kpis } = derivePartLogData([
      row({ event_type: 'MergeParts', merge_reason: 'RegularMerge' }),
      row({ event_type: 'MergeParts', merge_reason: 'RegularMerge' }),
      row({ event_type: 'MergeParts', merge_reason: 'TTLDeleteMerge' }),
      row({ event_type: 'MergeParts', merge_reason: 'TTLRecompressMerge' }),
    ])
    expect(kpis.merges).toBe(4)
    expect(kpis.mergeRegularPct).toBe(50)
    expect(kpis.mergeTtlPct).toBe(50)
  })

  it('tallies reclaimed bytes from removed parts', () => {
    const { kpis } = derivePartLogData([
      row({ event_type: 'RemovePart', size_in_bytes: '512' }),
      row({ event_type: 'RemovePart', size_in_bytes: '512' }),
    ])
    expect(kpis.removedParts).toBe(2)
    expect(kpis.reclaimedBytes).toBe(1024)
  })

  it('ranks per-table churn descending and caps at 7 tables', () => {
    const rows = Array.from({ length: 9 }, (_, i) =>
      // table i appears (i+1) times so churn is strictly ordered
      Array.from({ length: i + 1 }, () => row({ table: `db.t${i}` }))
    ).flat()
    const { churnRows } = derivePartLogData(rows)
    expect(churnRows).toHaveLength(7)
    expect(churnRows[0].table).toBe('db.t8')
    expect(churnRows[0].events).toBe(9)
  })

  it('excludes zero-byte parts from the size distribution', () => {
    const { sizeBins } = derivePartLogData([
      row({ size_in_bytes: '0' }),
      row({ size_in_bytes: '0' }),
    ])
    expect(sizeBins.reduce((a, b) => a + b, 0)).toBe(0)
  })
})
