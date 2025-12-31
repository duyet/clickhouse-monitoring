/**
 * Tests for merge data transformation utilities.
 */

import { transformMergeSummaryData } from '../transforms/merge-data'

describe('transformMergeSummaryData', () => {
  const mockUsed = { memory_usage: 1024, readable_memory_usage: '1 GiB' }
  const mockTotalMem = {
    metric: 'memory',
    total: 8192,
    readable_total: '8 GiB',
  }
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
    expect(
      transformMergeSummaryData({ used: [mockUsed], totalMem: [mockTotalMem] })
    ).toBeNull()
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

  it('should handle realistic merge summary data', () => {
    const input = {
      used: [{ memory_usage: 17179869184, readable_memory_usage: '16 GiB' }],
      totalMem: [
        { metric: 'memory', total: 68719476736, readable_total: '64 GiB' },
      ],
      rowsReadWritten: [
        {
          rows_read: 50000000,
          rows_written: 30000000,
          readable_rows_read: '50M',
          readable_rows_written: '30M',
        },
      ],
      bytesReadWritten: [
        {
          bytes_read: 5000000000,
          bytes_written: 2000000000,
          readable_bytes_read: '5 GiB',
          readable_bytes_written: '2 GiB',
        },
      ],
    }

    const result = transformMergeSummaryData(input)

    expect(result?.primary.memoryUsage).toBe('16 GiB')
    expect(result?.items).toHaveLength(3)
    expect(result?.items[0].currentReadable).toContain('rows written') // 30M < 50M
    expect(result?.items[2].currentReadable).toContain('memory used')
  })
})
