/**
 * Tests for the running-query metric history store.
 *
 * The store is module-level singleton state, so each test starts by evicting
 * everything via the public API — recording an empty snapshot drops every
 * query that is no longer "live".
 */

import {
  getRunningQueryHistory,
  recordRunningQuerySnapshot,
} from '../metrics-history'

/** Build a minimal system.processes-shaped row. */
function row(
  queryId: string,
  elapsed: number,
  overrides: Record<string, unknown> = {}
) {
  return {
    query_id: queryId,
    elapsed,
    memory_usage: 1_000,
    peak_memory_usage: 2_000,
    read_bytes: 500,
    read_rows: 50,
    ...overrides,
  }
}

describe('metrics-history', () => {
  beforeEach(() => {
    // Evict all queries — none are present in an empty snapshot.
    recordRunningQuerySnapshot([])
  })

  it('records a sample for a newly seen query', () => {
    recordRunningQuerySnapshot([row('q1', 1, { memory_usage: 4_096 })])

    const history = getRunningQueryHistory('q1')
    expect(history).toHaveLength(1)
    expect(history[0].memory).toBe(4_096)
    expect(history[0].elapsed).toBe(1)
    expect(typeof history[0].t).toBe('number')
  })

  it('returns an empty array for an unknown query', () => {
    expect(getRunningQueryHistory('does-not-exist')).toEqual([])
  })

  it('accumulates one sample per poll as elapsed advances', () => {
    recordRunningQuerySnapshot([row('q1', 1)])
    recordRunningQuerySnapshot([row('q1', 6, { memory_usage: 2_000 })])
    recordRunningQuerySnapshot([row('q1', 11, { memory_usage: 3_000 })])

    const history = getRunningQueryHistory('q1')
    expect(history).toHaveLength(3)
    expect(history.map((s) => s.memory)).toEqual([1_000, 2_000, 3_000])
  })

  it('dedupes a replayed snapshot with an unchanged elapsed', () => {
    recordRunningQuerySnapshot([row('q1', 5, { memory_usage: 1_000 })])
    // Same elapsed ⇒ SWR served a cached payload, not a new data point.
    recordRunningQuerySnapshot([row('q1', 5, { memory_usage: 9_999 })])

    const history = getRunningQueryHistory('q1')
    expect(history).toHaveLength(1)
    expect(history[0].memory).toBe(1_000)
  })

  it('caps history at 120 samples, dropping the oldest', () => {
    for (let elapsed = 1; elapsed <= 130; elapsed++) {
      recordRunningQuerySnapshot([row('q1', elapsed)])
    }

    const history = getRunningQueryHistory('q1')
    expect(history).toHaveLength(120)
    // First 10 samples (elapsed 1-10) were evicted.
    expect(history[0].elapsed).toBe(11)
    expect(history[history.length - 1].elapsed).toBe(130)
  })

  it('evicts queries absent from the latest snapshot', () => {
    recordRunningQuerySnapshot([row('q1', 1), row('q2', 1)])
    expect(getRunningQueryHistory('q1')).toHaveLength(1)
    expect(getRunningQueryHistory('q2')).toHaveLength(1)

    // q2 finished — only q1 is still running.
    recordRunningQuerySnapshot([row('q1', 6)])
    expect(getRunningQueryHistory('q1')).toHaveLength(2)
    expect(getRunningQueryHistory('q2')).toEqual([])
  })

  it('keeps distinct queries independent within one snapshot', () => {
    recordRunningQuerySnapshot([
      row('q1', 1, { memory_usage: 100 }),
      row('q2', 1, { memory_usage: 200 }),
    ])

    expect(getRunningQueryHistory('q1')[0].memory).toBe(100)
    expect(getRunningQueryHistory('q2')[0].memory).toBe(200)
  })

  it('ignores rows without a query_id', () => {
    recordRunningQuerySnapshot([
      { elapsed: 1, memory_usage: 1_000 },
      { query_id: '', elapsed: 1, memory_usage: 1_000 },
    ])
    // Nothing recorded — no id to key on.
    expect(getRunningQueryHistory('')).toEqual([])
  })

  it('coerces missing or non-numeric fields to 0', () => {
    recordRunningQuerySnapshot([
      { query_id: 'q1', elapsed: 1, memory_usage: 'not-a-number' },
    ])

    const sample = getRunningQueryHistory('q1')[0]
    expect(sample.memory).toBe(0)
    expect(sample.peakMemory).toBe(0)
    expect(sample.readBytes).toBe(0)
    expect(sample.readRows).toBe(0)
  })
})
