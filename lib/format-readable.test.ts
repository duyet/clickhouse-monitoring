import { expect } from 'vitest'
import {
  formatQuery,
  formatReadableQuantity,
  formatReadableSecondDuration,
  formatReadableSize,
} from './format-readable'

describe('formatReadableSize', () => {
  it('should format 0 bytes correctly', () => {
    const result = formatReadableSize(0)
    expect(result).toBe('0 Bytes')
  })

  it('should format bytes correctly', () => {
    const result = formatReadableSize(512)
    expect(result).toBe('512 Bytes')
  })

  it('should format kilobytes correctly', () => {
    const result = formatReadableSize(1024)
    expect(result).toBe('1 KiB')
  })

  it('should format megabytes correctly', () => {
    const result = formatReadableSize(1048576)
    expect(result).toBe('1 MiB')
  })

  it('should format gigabytes correctly', () => {
    const result = formatReadableSize(1073741824)
    expect(result).toBe('1 GiB')
  })

  it('should format with specified decimal places', () => {
    const result = formatReadableSize(1500, 2)
    expect(result).toBe('1.46 KiB')
  })

  it('should handle large sizes correctly', () => {
    const result = formatReadableSize(1.5e15)
    expect(result).toBe('1.3 PiB')
  })
})

describe('formatReadableQuantity', () => {
  it('should format a number to a human readable short quantity', () => {
    const result = formatReadableQuantity(123456789)
    expect(result).toBe('123M')
  })

  it('should format a number to a human readable short quantity explicitly', () => {
    const result = formatReadableQuantity(123456789, 'short')
    expect(result).toBe('123M')
  })

  it('should format a number to a human readable long quantity', () => {
    const result = formatReadableQuantity(123456789, 'long')
    expect(result).toBe('123,456,789')
  })

  it('should handle small numbers correctly', () => {
    const result = formatReadableQuantity(1234)
    expect(result).toBe('1.2K')
  })

  it('should handle small numbers in long format correctly', () => {
    const result = formatReadableQuantity(1234, 'long')
    expect(result).toBe('1,234')
  })

  it('should handle zero correctly', () => {
    const result = formatReadableQuantity(0)
    expect(result).toBe('0')
  })

  it('should handle negative numbers correctly', () => {
    const result = formatReadableQuantity(-123456789)
    expect(result).toBe('-123M')
  })

  it('should handle negative numbers in long format correctly', () => {
    const result = formatReadableQuantity(-123456789, 'long')
    expect(result).toBe('-123,456,789')
  })
})

describe('formatReadableSecondDuration', () => {
  it('should format seconds correctly when less than 60 seconds', () => {
    expect(formatReadableSecondDuration(30)).toBe('30s')
    expect(formatReadableSecondDuration(0)).toBe('0s')
    expect(formatReadableSecondDuration(59)).toBe('59s')
  })

  it('should format minutes and seconds correctly when 60 seconds or more', () => {
    expect(formatReadableSecondDuration(60)).toBe('1m 0s')
    expect(formatReadableSecondDuration(65)).toBe('1m 5s')
    expect(formatReadableSecondDuration(120)).toBe('2m 0s')
    expect(formatReadableSecondDuration(3599)).toBe('59m 59s')
  })

  it('should handle large durations correctly', () => {
    expect(formatReadableSecondDuration(3600)).toBe('60m 0s')
    expect(formatReadableSecondDuration(7200)).toBe('120m 0s')
  })

  it('should handle negative values by returning 0s', () => {
    expect(formatReadableSecondDuration(-30)).toBe('0s')
    expect(formatReadableSecondDuration(-3600)).toBe('0s')
  })
})

describe('formatQuery', () => {
  it('should return the original query when comment_remove is false', () => {
    const query = 'SELECT * FROM table /* This is a comment */'
    const result = formatQuery({ query, comment_remove: false })
    expect(result).toBe(query.trim()) // Note: trim is applied by default
  })

  it('should remove comments when comment_remove is true', () => {
    const query = 'SELECT * FROM table /* This is a comment */'
    const expected = 'SELECT * FROM table'
    const result = formatQuery({ query, comment_remove: true })
    expect(result).toBe(expected)
  })

  it('should handle multiple comments', () => {
    const query = 'SELECT * /* Comment 1 */ FROM table /* Comment 2 */'
    const expected = 'SELECT * FROM table'
    const result = formatQuery({ query, comment_remove: true })
    expect(result).toBe(expected)
  })

  it('should handle multiline comments', () => {
    const query = `
      SELECT *
      /* This is a
         multiline comment */
      FROM table
    `
    const expected = 'SELECT * FROM table'
    const result = formatQuery({ query, comment_remove: true })
    expect(result).toBe(expected)
  })

  it('should not remove comments when comment_remove is undefined', () => {
    const query = 'SELECT * FROM table /* This is a comment */'
    const result = formatQuery({ query })
    expect(result).toBe(query.trim()) // Note: trim is applied by default
  })

  it('should truncate the query when truncate option is provided', () => {
    const query = 'SELECT * FROM table WHERE column = "value"'
    const result = formatQuery({ query, truncate: 20 })
    expect(result.length).toBe(20 + 3) // 3 characters are added for the ellipsis
    expect(result).toBe('SELECT * FROM table ...')
  })

  it('should not truncate the query when it is shorter than the truncate limit', () => {
    const query = 'SELECT * FROM table'
    const result = formatQuery({ query, truncate: 30 })
    expect(result).toBe(query)
  })

  it('should trim the query by default', () => {
    const query = '  SELECT * FROM table  '
    const result = formatQuery({ query })
    expect(result).toBe('SELECT * FROM table')
  })

  it('should not trim the query when trim and remove_extra_whitespace is set to false', () => {
    const query = '  SELECT * FROM table  '
    const result = formatQuery({ query, trim: false })
    expect(result).toBe(query)
  })

  it('should apply all options correctly', () => {
    const query = '  SELECT * /* comment */ FROM table WHERE column = "value"  '
    const result = formatQuery({
      query,
      comment_remove: true,
      truncate: 25,
      trim: true,
    })

    expect(result.length).toBe(25 + 3) // 3 characters are added for the ellipsis
    expect(result).toBe('SELECT * FROM table WHERE...')
  })
})
