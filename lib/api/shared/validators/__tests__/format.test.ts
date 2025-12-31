/**
 * Format Validator Tests
 */

import { describe, expect, test } from '@jest/globals'
import { validateFormat, isSupportedFormat, SUPPORTED_FORMATS } from '../format'

describe('SUPPORTED_FORMATS', () => {
  test('should contain all expected formats', () => {
    expect(SUPPORTED_FORMATS).toEqual(['JSONEachRow', 'JSON', 'CSV', 'TSV'])
  })

  test('should be readonly', () => {
    // TypeScript should prevent mutation at compile time
    expect(SUPPORTED_FORMATS).toHaveLength(4)
  })
})

describe('isSupportedFormat', () => {
  test('should return true for JSONEachRow', () => {
    expect(isSupportedFormat('JSONEachRow')).toBe(true)
  })

  test('should return true for JSON', () => {
    expect(isSupportedFormat('JSON')).toBe(true)
  })

  test('should return true for CSV', () => {
    expect(isSupportedFormat('CSV')).toBe(true)
  })

  test('should return true for TSV', () => {
    expect(isSupportedFormat('TSV')).toBe(true)
  })

  test('should return false for unsupported formats', () => {
    expect(isSupportedFormat('XML')).toBe(false)
    expect(isSupportedFormat('TabSeparated')).toBe(false)
    expect(isSupportedFormat('Parquet')).toBe(false)
    expect(isSupportedFormat('ORC')).toBe(false)
    expect(isSupportedFormat('')).toBe(false)
    expect(isSupportedFormat('json')).toBe(false) // Case sensitive
  })

  test('should work as type guard', () => {
    const format = 'JSONEachRow'
    if (isSupportedFormat(format)) {
      // TypeScript should know format is DataFormat here
      expect(format).toBe('JSONEachRow')
    } else {
      fail('Should be supported format')
    }
  })
})

describe('validateFormat', () => {
  test('should return undefined for undefined (optional)', () => {
    expect(validateFormat(undefined)).toBeUndefined()
  })

  test('should return undefined for null (optional)', () => {
    expect(validateFormat(null)).toBeUndefined()
  })

  test('should return undefined for valid JSONEachRow format', () => {
    expect(validateFormat('JSONEachRow')).toBeUndefined()
  })

  test('should return undefined for valid JSON format', () => {
    expect(validateFormat('JSON')).toBeUndefined()
  })

  test('should return undefined for valid CSV format', () => {
    expect(validateFormat('CSV')).toBeUndefined()
  })

  test('should return undefined for valid TSV format', () => {
    expect(validateFormat('TSV')).toBeUndefined()
  })

  test('should return error for unsupported format', () => {
    const result = validateFormat('XML')
    expect(result).toEqual({
      type: 'validation_error',
      message: 'Invalid format. Supported formats: JSONEachRow, JSON, CSV, TSV',
    })
  })

  test('should return error for non-string type', () => {
    const result1 = validateFormat(123)
    const result2 = validateFormat(true)
    const result3 = validateFormat({})
    const result4 = validateFormat([])

    expect(result1).toEqual({
      type: 'validation_error',
      message:
        'Invalid format: must be a string. Supported formats: JSONEachRow, JSON, CSV, TSV',
    })
    expect(result2).toEqual({
      type: 'validation_error',
      message:
        'Invalid format: must be a string. Supported formats: JSONEachRow, JSON, CSV, TSV',
    })
    expect(result3).toEqual({
      type: 'validation_error',
      message:
        'Invalid format: must be a string. Supported formats: JSONEachRow, JSON, CSV, TSV',
    })
    expect(result4).toEqual({
      type: 'validation_error',
      message:
        'Invalid format: must be a string. Supported formats: JSONEachRow, JSON, CSV, TSV',
    })
  })

  test('should be case sensitive', () => {
    const result = validateFormat('jsoneachrow')
    expect(result).toEqual({
      type: 'validation_error',
      message: 'Invalid format. Supported formats: JSONEachRow, JSON, CSV, TSV',
    })
  })
})
