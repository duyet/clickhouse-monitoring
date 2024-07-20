import { expect } from '@jest/globals'
import {
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
