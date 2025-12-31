/**
 * Tests for running queries transformation utilities.
 */

import { transformRunningQueriesSummaryData } from '../transforms/running-queries'

describe('transformRunningQueriesSummaryData', () => {
  const mockMain = {
    query_count: 5,
    memory_usage: 1024,
    readable_memory_usage: '1 GiB',
  }
  const mockTotalMem = { metric: 'memory', total: 8192, readable_total: '8 GiB' }
  const mockRows = {
    rows_read: 1000,
    rows_written: 500,
    readable_rows_read: '1K',
    readable_rows_written: '500',
  }

  it('should return null if required fields are missing', () => {
    expect(transformRunningQueriesSummaryData({})).toBeNull()
    expect(transformRunningQueriesSummaryData({ main: [mockMain] })).toBeNull()
    expect(transformRunningQueriesSummaryData({ main: [mockMain], totalMem: [mockTotalMem] })).toBeNull()
  })

  it('should transform complete query data', () => {
    const input = {
      main: [mockMain],
      totalMem: [mockTotalMem],
      rowsReadWritten: [mockRows],
      todayQueryCount: [{ query_count: 100 }],
    }

    const result = transformRunningQueriesSummaryData(input)

    expect(result).not.toBeNull()
    expect(result?.primary).toEqual({
      memoryUsage: '1 GiB',
      description: 'memory used for running queries',
    })
    expect(result?.items).toHaveLength(3)
  })

  it('should place memory usage item first for queries', () => {
    const input = {
      main: [mockMain],
      totalMem: [mockTotalMem],
      rowsReadWritten: [mockRows],
    }

    const result = transformRunningQueriesSummaryData(input)

    const firstItem = result?.items[0]
    expect(firstItem?.currentReadable).toContain('memory usage')
  })

  it('should include query count comparison', () => {
    const input = {
      main: [mockMain],
      totalMem: [mockTotalMem],
      rowsReadWritten: [mockRows],
      todayQueryCount: [{ query_count: 100 }],
    }

    const result = transformRunningQueriesSummaryData(input)

    const queryItem = result?.items[1]
    expect(queryItem?.current).toBe(5)
    expect(queryItem?.target).toBe(100)
    expect(queryItem?.currentReadable).toContain('running queries')
    expect(queryItem?.targetReadable).toContain('today')
  })

  it('should fallback to main query_count for today when not provided', () => {
    const input = {
      main: [mockMain],
      totalMem: [mockTotalMem],
      rowsReadWritten: [mockRows],
    }

    const result = transformRunningQueriesSummaryData(input)

    const queryItem = result?.items[1]
    expect(queryItem?.current).toBe(5)
    expect(queryItem?.target).toBe(5) // Falls back to main.query_count
  })

  it('should include raw todayQueryCount in output', () => {
    const input = {
      main: [mockMain],
      totalMem: [mockTotalMem],
      rowsReadWritten: [mockRows],
      todayQueryCount: [{ query_count: 100 }],
    }

    const result = transformRunningQueriesSummaryData(input)

    expect(result?.raw.todayQueryCount).toBe(100)
  })

  it('should handle realistic running queries data', () => {
    const input = {
      main: [{ query_count: 12, memory_usage: 5368709120, readable_memory_usage: '5 GiB' }],
      totalMem: [{ metric: 'memory', total: 68719476736, readable_total: '64 GiB' }],
      rowsReadWritten: [
        { rows_read: 80000000, rows_written: 20000000, readable_rows_read: '80M', readable_rows_written: '20M' },
      ],
      todayQueryCount: [{ query_count: 5432 }],
    }

    const result = transformRunningQueriesSummaryData(input)

    expect(result?.primary.memoryUsage).toBe('5 GiB')
    expect(result?.items).toHaveLength(3)
    expect(result?.items[0].currentReadable).toContain('memory usage')
    expect(result?.items[1].current).toBe(12)
    expect(result?.items[1].target).toBe(5432)
  })
})
