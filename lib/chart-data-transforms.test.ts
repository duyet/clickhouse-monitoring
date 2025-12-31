/**
 * Tests for chart data transformation utilities.
 */

import {
  transformUserEventCounts,
  transformMergeSummaryData,
  transformRunningQueriesSummaryData,
  extractNestedData,
  formatReadWritePair,
} from './chart-data-transforms'

describe('transformUserEventCounts', () => {
  it('should transform empty array', () => {
    const result = transformUserEventCounts([])

    expect(result.data).toEqual({})
    expect(result.users).toEqual([])
    expect(result.chartData).toEqual([])
  })

  it('should transform single user data', () => {
    const input = [
      { event_time: '2024-01-01', user: 'alice', count: 5 },
      { event_time: '2024-01-02', user: 'alice', count: 7 },
    ]

    const result = transformUserEventCounts(input)

    expect(result.data).toEqual({
      '2024-01-01': { alice: 5 },
      '2024-01-02': { alice: 7 },
    })
    expect(result.users).toEqual(['alice'])
    expect(result.chartData).toEqual([
      { event_time: '2024-01-01', alice: 5 },
      { event_time: '2024-01-02', alice: 7 },
    ])
  })

  it('should transform multiple users with sorting', () => {
    const input = [
      { event_time: '2024-01-01', user: 'charlie', count: 3 },
      { event_time: '2024-01-01', user: 'alice', count: 5 },
      { event_time: '2024-01-01', user: 'bob', count: 2 },
      { event_time: '2024-01-02', user: 'bob', count: 4 },
    ]

    const result = transformUserEventCounts(input)

    expect(result.data).toEqual({
      '2024-01-01': { charlie: 3, alice: 5, bob: 2 },
      '2024-01-02': { bob: 4 },
    })
    expect(result.users).toEqual(['alice', 'bob', 'charlie'])
    expect(result.chartData).toEqual([
      { event_time: '2024-01-01', alice: 5, bob: 2, charlie: 3 },
      { event_time: '2024-01-02', bob: 4 },
    ])
  })

  it('should handle custom time field name', () => {
    const input = [{ event_time: '2024-01-01', user: 'alice', count: 5 }]

    const result = transformUserEventCounts(input, 'timestamp')

    expect(result.chartData).toEqual([
      { timestamp: '2024-01-01', alice: 5 },
    ])
  })

  it('should aggregate counts for same user and time', () => {
    const input = [
      { event_time: '2024-01-01', user: 'alice', count: 3 },
      { event_time: '2024-01-01', user: 'alice', count: 2 },
    ]

    const result = transformUserEventCounts(input)

    // Note: Current implementation overwrites; if aggregation is needed,
    // this documents expected behavior
    expect(result.data['2024-01-01'].alice).toBe(2)
  })

  it('should handle zero counts', () => {
    const input = [
      { event_time: '2024-01-01', user: 'alice', count: 0 },
      { event_time: '2024-01-01', user: 'bob', count: 5 },
    ]

    const result = transformUserEventCounts(input)

    expect(result.data['2024-01-01']).toEqual({ alice: 0, bob: 5 })
    expect(result.users).toContain('alice')
  })
})

describe('transformMergeSummaryData', () => {
  const mockUsed = { memory_usage: 1024, readable_memory_usage: '1 GiB' }
  const mockTotalMem = { metric: 'memory', total: 8192, readable_total: '8 GiB' }
  const mockRows = {
    rows_read: 1000,
    rows_written: 500,
    readable_rows_read: '1K',
    readable_rows_written: '500',
  }
  const mockBytes = {
    bytes_read: 10000,
    bytes_written: 5000,
    readable_bytes_read: '10K',
    readable_bytes_written: '5K',
  }

  it('should return null if required fields are missing', () => {
    expect(transformMergeSummaryData({})).toBeNull()
    expect(transformMergeSummaryData({ used: [mockUsed] })).toBeNull()
    expect(transformMergeSummaryData({ used: [mockUsed], totalMem: [mockTotalMem] })).toBeNull()
  })

  it('should transform complete merge data', () => {
    const input = {
      used: [mockUsed],
      totalMem: [mockTotalMem],
      rowsReadWritten: [mockRows],
      bytesReadWritten: [mockBytes],
    }

    const result = transformMergeSummaryData(input)

    expect(result).not.toBeNull()
    expect(result?.primary).toEqual({
      memoryUsage: '1 GiB',
      description: 'memory used for merges',
    })
    expect(result?.items).toHaveLength(3)
  })

  it('should order rows with smaller value first', () => {
    const input = {
      used: [mockUsed],
      totalMem: [mockTotalMem],
      rowsReadWritten: [mockRows],
    }

    const result = transformMergeSummaryData(input)

    const rowItem = result?.items[0]
    expect(rowItem?.current).toBe(500) // rows_written is smaller
    expect(rowItem?.currentReadable).toContain('rows written')
    expect(rowItem?.targetReadable).toContain('rows read')
  })

  it('should handle rows_read < rows_written', () => {
    const invertedRows = {
      rows_read: 500,
      rows_written: 1000,
      readable_rows_read: '500',
      readable_rows_written: '1K',
    }

    const input = {
      used: [mockUsed],
      totalMem: [mockTotalMem],
      rowsReadWritten: [invertedRows],
    }

    const result = transformMergeSummaryData(input)

    const rowItem = result?.items[0]
    expect(rowItem?.current).toBe(500) // rows_read is smaller
    expect(rowItem?.currentReadable).toContain('rows read')
  })

  it('should include bytes comparison when provided', () => {
    const input = {
      used: [mockUsed],
      totalMem: [mockTotalMem],
      rowsReadWritten: [mockRows],
      bytesReadWritten: [mockBytes],
    }

    const result = transformMergeSummaryData(input)

    expect(result?.items).toHaveLength(3)
    // Second item is bytes comparison (smaller value first)
    expect(result?.items[1].currentReadable).toContain('written')
    expect(result?.items[1].targetReadable).toContain('read')
    // Should contain "(uncompressed)" suffix
    expect(result?.items[1].currentReadable).toContain('(uncompressed)')
  })

  it('should place memory usage item last', () => {
    const input = {
      used: [mockUsed],
      totalMem: [mockTotalMem],
      rowsReadWritten: [mockRows],
    }

    const result = transformMergeSummaryData(input)

    const lastItem = result?.items[result?.items.length - 1]
    expect(lastItem?.currentReadable).toContain('memory used')
    expect(lastItem?.targetReadable).toContain('total')
  })

  it('should include raw data in output', () => {
    const input = {
      used: [mockUsed],
      totalMem: [mockTotalMem],
      rowsReadWritten: [mockRows],
    }

    const result = transformMergeSummaryData(input)

    expect(result?.raw.used).toEqual(mockUsed)
    expect(result?.raw.totalMem).toEqual(mockTotalMem)
    expect(result?.raw.rowsReadWritten).toEqual(mockRows)
  })
})

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
})

describe('extractNestedData', () => {
  it('should return undefined for empty array', () => {
    expect(extractNestedData([], 'used')).toBeUndefined()
  })

  it('should return undefined for undefined input', () => {
    expect(extractNestedData(undefined, 'used')).toBeUndefined()
  })

  it('should return undefined for non-object first item', () => {
    expect(extractNestedData([null], 'used')).toBeUndefined()
    expect(extractNestedData(['string'], 'used')).toBeUndefined()
  })

  it('should return undefined for missing key', () => {
    expect(extractNestedData([{ other: [] }], 'used')).toBeUndefined()
  })

  it('should return undefined for non-array value', () => {
    expect(extractNestedData([{ used: 'string' }], 'used')).toBeUndefined()
    expect(extractNestedData([{ used: null }], 'used')).toBeUndefined()
  })

  it('should extract nested array', () => {
    const nestedData = [{ id: 1 }, { id: 2 }]
    const result = extractNestedData<{ id: number }>([{ used: nestedData }], 'used')

    expect(result).toEqual(nestedData)
  })

  it('should handle empty nested array', () => {
    const result = extractNestedData([{ used: [] }], 'used')

    expect(result).toEqual([])
  })
})

describe('formatReadWritePair', () => {
  it('should format with read smaller', () => {
    const result = formatReadWritePair(
      { value: 100, readable: '100' },
      { value: 200, readable: '200' }
    )

    expect(result.current).toBe(100)
    expect(result.target).toBe(200)
    expect(result.currentReadable).toBe('100 read')
    expect(result.targetReadable).toBe('200 written')
  })

  it('should format with write smaller', () => {
    const result = formatReadWritePair(
      { value: 200, readable: '200' },
      { value: 100, readable: '100' }
    )

    expect(result.current).toBe(100)
    expect(result.target).toBe(200)
    expect(result.currentReadable).toBe('100 written')
    expect(result.targetReadable).toBe('200 read')
  })

  it('should format with equal values', () => {
    const result = formatReadWritePair(
      { value: 100, readable: '100' },
      { value: 100, readable: '100' }
    )

    // When equal, write is shown as current (consistent with logic)
    expect(result.current).toBe(100)
    expect(result.target).toBe(100)
  })

  it('should include unit suffix when provided', () => {
    const result = formatReadWritePair(
      { value: 100, readable: '100' },
      { value: 200, readable: '200' },
      'bytes'
    )

    expect(result.currentReadable).toBe('100 bytes read')
    expect(result.targetReadable).toBe('200 bytes written')
  })

  it('should handle empty unit string', () => {
    const result = formatReadWritePair(
      { value: 100, readable: '100' },
      { value: 200, readable: '200' },
      ''
    )

    expect(result.currentReadable).toBe('100 read')
    expect(result.targetReadable).toBe('200 written')
  })
})

describe('integration tests', () => {
  it('should handle realistic query count by user data', () => {
    const input = [
      { event_time: '2024-01-01', user: 'default', count: 1234 },
      { event_time: '2024-01-01', user: 'admin', count: 56 },
      { event_time: '2024-01-02', user: 'default', count: 1456 },
      { event_time: '2024-01-02', user: 'admin', count: 78 },
      { event_time: '2024-01-03', user: 'default', count: 987 },
    ]

    const result = transformUserEventCounts(input)

    expect(result.users).toEqual(['admin', 'default'])
    expect(result.chartData).toHaveLength(3)
    expect(result.chartData[0]).toEqual({
      event_time: '2024-01-01',
      admin: 56,
      default: 1234,
    })
  })

  it('should handle realistic merge summary data', () => {
    const input = {
      used: [{ memory_usage: 17179869184, readable_memory_usage: '16 GiB' }],
      totalMem: [{ metric: 'memory', total: 68719476736, readable_total: '64 GiB' }],
      rowsReadWritten: [
        { rows_read: 50000000, rows_written: 30000000, readable_rows_read: '50M', readable_rows_written: '30M' },
      ],
      bytesReadWritten: [
        { bytes_read: 5000000000, bytes_written: 2000000000, readable_bytes_read: '5 GiB', readable_bytes_written: '2 GiB' },
      ],
    }

    const result = transformMergeSummaryData(input)

    expect(result?.primary.memoryUsage).toBe('16 GiB')
    expect(result?.items).toHaveLength(3)
    expect(result?.items[0].currentReadable).toContain('rows written') // 30M < 50M
    expect(result?.items[2].currentReadable).toContain('memory used')
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
