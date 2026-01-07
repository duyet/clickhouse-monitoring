import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

import {
  binding,
  chartTickFormatters,
  cn,
  createDateTickFormatter,
  dedent,
  formatBytes,
  formatCount,
  formatDuration,
  formatPercentage,
  getHost,
  removeHostPrefix,
  uniq,
} from './utils'
import { describe, expect, it, jest } from 'bun:test'

jest.mock('clsx', () => ({
  clsx: jest.fn(),
}))

jest.mock('tailwind-merge', () => ({
  twMerge: jest.fn(),
}))

describe('utils', () => {
  describe('cn', () => {
    it('should merge class names using clsx and twMerge', () => {
      const mockInputs = ['class1', 'class2']
      ;(clsx as jest.Mock).mockReturnValue('merged-class')
      ;(twMerge as jest.Mock).mockReturnValue('tw-merged-class')

      const result = cn(...mockInputs)

      expect(clsx).toHaveBeenCalledWith(mockInputs)
      expect(twMerge).toHaveBeenCalledWith('merged-class')
      expect(result).toBe('tw-merged-class')
    })
  })

  describe('uniq', () => {
    it('should remove duplicate items from an array', () => {
      const input = [1, 2, 2, 3, 4, 4, 5]
      const expectedOutput = [1, 2, 3, 4, 5]

      const result = uniq(input)

      expect(result).toEqual(expectedOutput)
    })
  })

  describe('dedent', () => {
    it('should remove common leading whitespace from each line', () => {
      const input = `
        line one
        line two
        line three
      `
      const expectedOutput = `line one\nline two\nline three`

      const result = dedent(input)

      expect(result).toBe(expectedOutput)
    })

    it('should return the original string if no common leading whitespace', () => {
      const input = 'line one\nline two\nline three'
      const expectedOutput = 'line one\nline two\nline three'

      const result = dedent(input)

      expect(result).toBe(expectedOutput)
    })
  })

  describe('getHost', () => {
    it('should return the host from a URL', () => {
      const input = 'https://example.com/path'
      const expectedOutput = 'example.com'

      const result = getHost(input)

      expect(result).toBe(expectedOutput)
    })

    it('should return an empty string if no URL is provided', () => {
      const result = getHost()

      expect(result).toBe('')
    })

    it('should handle URLs with subdomains', () => {
      const input = 'https://subdomain.example.com/path'
      const expectedOutput = 'subdomain.example.com'

      const result = getHost(input)

      expect(result).toBe(expectedOutput)
    })

    it('should handle URLs with ports', () => {
      const input = 'https://example.com:8080/path'
      const expectedOutput = 'example.com:8080'

      const result = getHost(input)

      expect(result).toBe(expectedOutput)
    })

    it('should handle URLs with different protocols', () => {
      const input = 'http://example.com/path'
      const expectedOutput = 'example.com'

      const result = getHost(input)

      expect(result).toBe(expectedOutput)
    })

    it('should handle URLs with IP addresses', () => {
      const input = 'http://192.168.0.1/path'
      const expectedOutput = '192.168.0.1'

      const result = getHost(input)

      expect(result).toBe(expectedOutput)
    })

    it('should handle URLs with query parameters', () => {
      const input = 'https://example.com/path?query=param'
      const expectedOutput = 'example.com'

      const result = getHost(input)

      expect(result).toBe(expectedOutput)
    })

    it('should handle URLs with hash fragments', () => {
      const input = 'https://example.com/path#fragment'
      const expectedOutput = 'example.com'

      const result = getHost(input)

      expect(result).toBe(expectedOutput)
    })

    it('should handle URLs with auth info', () => {
      const input = 'https://user:pass@example.com/path'
      const expectedOutput = 'example.com'

      const result = getHost(input)

      expect(result).toBe(expectedOutput)
    })

    it('should handle invalid URLs gracefully', () => {
      const input = 'invalid-url'

      expect(() => getHost(input)).toThrow(TypeError)
    })
  })

  describe('removeHostPrefix', () => {
    it('should works', () => {
      expect(removeHostPrefix('/0/overview')).toEqual('overview')
      expect(removeHostPrefix('/0/a/b')).toEqual('a/b')
    })
  })
})

describe('binding', () => {
  it('should replace placeholders with values from data object', () => {
    const template = '/users/[id]/profile'
    const data = { id: '123' }
    const result = binding(template, data)
    expect(result).toBe('/users/123/profile')
  })

  it('should handle multiple placeholders', () => {
    const template = '/[category]/[product]/[id]'
    const data = { category: 'electronics', product: 'laptop', id: '456' }
    const result = binding(template, data)
    expect(result).toBe('/electronics/laptop/456')
  })

  it('should remove placeholders when no matching data is found', () => {
    const template = '/users/[id]/[action]'
    const data = { id: '789' }
    const result = binding(template, data)
    expect(result).toBe('/users/789/')
  })

  it('should handle empty data object', () => {
    const template = '/[category]/[product]'
    const data = {}
    const result = binding(template, data)
    expect(result).toBe('//')
  })

  it('should handle template without placeholders', () => {
    const template = '/static/page'
    const data = { id: '123' }
    const result = binding(template, data)
    expect(result).toBe('/static/page')
  })

  it('should handle empty string template', () => {
    const template = ''
    const data = { id: '123' }
    const result = binding(template, data)
    expect(result).toBe('')
  })

  it('should handle placeholders with special characters in data', () => {
    const template = '/[path]/[query]'
    const data = { path: 'search', query: 'foo=bar&baz=qux' }
    const result = binding(template, data)
    expect(result).toBe('/search/foo=bar&baz=qux')
  })
})

describe('formatBytes', () => {
  it('should format 0 bytes correctly', () => {
    expect(formatBytes(0)).toBe('0 B')
  })

  it('should format negative bytes as "-"', () => {
    expect(formatBytes(-1)).toBe('-')
  })

  it('should format NaN as "-"', () => {
    expect(formatBytes(NaN)).toBe('-')
  })

  it('should format Infinity as "-"', () => {
    expect(formatBytes(Infinity)).toBe('-')
  })

  it('should format bytes correctly', () => {
    expect(formatBytes(512)).toBe('512.0 B')
    expect(formatBytes(100)).toBe('100.0 B')
  })

  it('should format kilobytes correctly', () => {
    expect(formatBytes(1024)).toBe('1.0 KB')
    expect(formatBytes(2048)).toBe('2.0 KB')
    expect(formatBytes(5120)).toBe('5.0 KB')
  })

  it('should format megabytes correctly', () => {
    expect(formatBytes(1048576)).toBe('1.0 MB')
    expect(formatBytes(5242880)).toBe('5.0 MB')
  })

  it('should format gigabytes correctly', () => {
    expect(formatBytes(1073741824)).toBe('1.0 GB')
    expect(formatBytes(2147483648)).toBe('2.0 GB')
  })

  it('should format terabytes correctly', () => {
    expect(formatBytes(1099511627776)).toBe('1.0 TB')
  })

  it('should format petabytes correctly', () => {
    expect(formatBytes(1125899906842624)).toBe('1.0 PB')
  })

  it('should handle decimal values correctly', () => {
    expect(formatBytes(1536)).toBe('1.5 KB')
    expect(formatBytes(1572864)).toBe('1.5 MB')
  })
})

describe('formatPercentage', () => {
  it('should format percentage values correctly', () => {
    expect(formatPercentage(0)).toBe('0.0%')
    expect(formatPercentage(50)).toBe('50.0%')
    expect(formatPercentage(100)).toBe('100.0%')
    expect(formatPercentage(99.99)).toBe('100.0%') // Rounds to 1 decimal place
    expect(formatPercentage(33.333)).toBe('33.3%')
  })

  it('should handle negative values', () => {
    expect(formatPercentage(-10)).toBe('-10.0%')
    expect(formatPercentage(-0.5)).toBe('-0.5%')
  })

  it('should handle decimal precision', () => {
    expect(formatPercentage(12.3456)).toBe('12.3%')
    expect(formatPercentage(0.123)).toBe('0.1%')
  })
})

describe('formatCount', () => {
  it('should format NaN as "-"', () => {
    expect(formatCount(NaN)).toBe('-')
  })

  it('should format Infinity as "-"', () => {
    expect(formatCount(Infinity)).toBe('-')
  })

  it('should format negative numbers as "-"', () => {
    expect(formatCount(-1)).toBe('-')
    expect(formatCount(-1000)).toBe('-')
  })

  it('should return string representation for small numbers', () => {
    expect(formatCount(0)).toBe('0')
    expect(formatCount(999)).toBe('999')
    expect(formatCount(100)).toBe('100')
  })

  it('should format thousands correctly', () => {
    expect(formatCount(1000)).toBe('1.0K')
    expect(formatCount(1500)).toBe('1.5K')
    expect(formatCount(9999)).toBe('10.0K')
  })

  it('should format millions correctly', () => {
    expect(formatCount(1000000)).toBe('1.0M')
    expect(formatCount(2500000)).toBe('2.5M')
    expect(formatCount(123456789)).toBe('123.5M')
  })

  it('should format billions correctly', () => {
    expect(formatCount(1000000000)).toBe('1.0B')
    expect(formatCount(5000000000)).toBe('5.0B')
  })

  it('should format trillions correctly', () => {
    expect(formatCount(1000000000000)).toBe('1.0T')
  })

  it('should handle very large numbers gracefully', () => {
    // Should cap at available units
    expect(formatCount(1e15)).toBe('1000.0T')
  })
})

describe('formatDuration', () => {
  it('should format NaN as "-"', () => {
    expect(formatDuration(NaN)).toBe('-')
  })

  it('should format Infinity as "-"', () => {
    expect(formatDuration(Infinity)).toBe('-')
  })

  it('should format negative values as "-"', () => {
    expect(formatDuration(-1)).toBe('-')
    expect(formatDuration(-1000)).toBe('-')
  })

  it('should format milliseconds correctly', () => {
    expect(formatDuration(0)).toBe('0ms')
    expect(formatDuration(100)).toBe('100ms')
    expect(formatDuration(999)).toBe('999ms')
  })

  it('should format seconds correctly', () => {
    expect(formatDuration(1000)).toBe('1.0s')
    expect(formatDuration(5000)).toBe('5.0s')
    expect(formatDuration(59999)).toBe('60.0s')
  })

  it('should format minutes correctly', () => {
    expect(formatDuration(60000)).toBe('1.0m')
    expect(formatDuration(120000)).toBe('2.0m')
    expect(formatDuration(300000)).toBe('5.0m')
    expect(formatDuration(3599999)).toBe('60.0m')
  })

  it('should format hours correctly', () => {
    expect(formatDuration(3600000)).toBe('1.0h')
    expect(formatDuration(7200000)).toBe('2.0h')
    expect(formatDuration(10800000)).toBe('3.0h')
  })
})

describe('chartTickFormatters', () => {
  describe('bytes formatter', () => {
    it('should format bytes values', () => {
      const formatter = chartTickFormatters.bytes
      expect(formatter(null)).toBe('-')
      expect(formatter(undefined)).toBe('-')
      expect(formatter(1024)).toBe('1.0 KB')
      expect(formatter('1024')).toBe('1.0 KB')
      expect(formatter(0)).toBe('0 B')
    })
  })

  describe('percentage formatter', () => {
    it('should format percentage values', () => {
      const formatter = chartTickFormatters.percentage
      expect(formatter(null)).toBe('-')
      expect(formatter(undefined)).toBe('-')
      expect(formatter(50)).toBe('50.0%')
      expect(formatter('75')).toBe('75.0%')
      expect(formatter(0)).toBe('0.0%')
    })
  })

  describe('count formatter', () => {
    it('should format count values', () => {
      const formatter = chartTickFormatters.count
      expect(formatter(null)).toBe('-')
      expect(formatter(undefined)).toBe('-')
      expect(formatter(1000)).toBe('1.0K')
      expect(formatter('1500')).toBe('1.5K')
      expect(formatter(0)).toBe('0')
    })
  })

  describe('duration formatter', () => {
    it('should format duration values', () => {
      const formatter = chartTickFormatters.duration
      expect(formatter(null)).toBe('-')
      expect(formatter(undefined)).toBe('-')
      expect(formatter(1000)).toBe('1.0s')
      expect(formatter('60000')).toBe('1.0m')
      expect(formatter(0)).toBe('0ms')
    })
  })

  describe('default formatter', () => {
    it('should convert values to string', () => {
      const formatter = chartTickFormatters.default
      expect(formatter(null)).toBe('-')
      expect(formatter(undefined)).toBe('-')
      expect(formatter(123)).toBe('123')
      expect(formatter('test')).toBe('test')
      expect(formatter(0)).toBe('0')
      expect(formatter(true)).toBe('true')
    })
  })
})

describe('createDateTickFormatter', () => {
  // Use fixed dates to avoid timezone issues in tests
  const testDate = '2026-01-01T14:30:00Z'

  describe('short range (≤24 hours)', () => {
    it('should show time only for 12 hour range', () => {
      const formatter = createDateTickFormatter(12)
      const result = formatter(testDate)
      // Should contain time but not date
      expect(result).toMatch(/\d{2}:\d{2}/)
      expect(result).not.toMatch(/Jan|Dec|2026/)
    })

    it('should show time only for 24 hour range', () => {
      const formatter = createDateTickFormatter(24)
      const result = formatter(testDate)
      expect(result).toMatch(/\d{2}:\d{2}/)
    })
  })

  describe('medium range (1-7 days)', () => {
    it('should show date and time for 48 hour range', () => {
      const formatter = createDateTickFormatter(48)
      const result = formatter(testDate)
      // Should contain both date and time components
      expect(result).toMatch(/\d{2}:\d{2}/)
    })

    it('should show date and time for 7 day range', () => {
      const formatter = createDateTickFormatter(24 * 7)
      const result = formatter(testDate)
      expect(result).toMatch(/\d{2}:\d{2}/)
    })
  })

  describe('long range (>7 days)', () => {
    it('should show date only for 14 day range', () => {
      const formatter = createDateTickFormatter(24 * 14)
      const result = formatter(testDate)
      // Should contain date but not time
      expect(result).not.toMatch(/\d{2}:\d{2}/)
      expect(result).toMatch(/Jan|1/)
    })

    it('should show date only for 30 day range', () => {
      const formatter = createDateTickFormatter(24 * 30)
      const result = formatter(testDate)
      expect(result).not.toMatch(/\d{2}:\d{2}/)
    })
  })

  describe('edge cases', () => {
    it('should return empty string for empty value', () => {
      const formatter = createDateTickFormatter(24)
      expect(formatter('')).toBe('')
    })

    it('should return original value for invalid date', () => {
      const formatter = createDateTickFormatter(24)
      expect(formatter('not-a-date')).toBe('not-a-date')
    })

    it('should handle null/undefined gracefully', () => {
      const formatter = createDateTickFormatter(24)
      expect(formatter(null as unknown as string)).toBe('')
      expect(formatter(undefined as unknown as string)).toBe('')
    })
  })
})
