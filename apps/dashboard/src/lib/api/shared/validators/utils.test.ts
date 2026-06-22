import { describe, expect, test } from 'bun:test'
import {
  isNonEmptyString,
  isPositiveNumber,
  isValidNumber,
  sanitizeQueryParams,
  truncateString,
} from './utils'

// ---------------------------------------------------------------------------
// sanitizeQueryParams
// ---------------------------------------------------------------------------

describe('sanitizeQueryParams', () => {
  test('converts string values unchanged', () => {
    expect(sanitizeQueryParams({ name: 'users' })).toEqual({ name: 'users' })
  })

  test('converts number to string', () => {
    expect(sanitizeQueryParams({ limit: 100 })).toEqual({ limit: '100' })
  })

  test('converts boolean true to "true"', () => {
    expect(sanitizeQueryParams({ active: true })).toEqual({ active: 'true' })
  })

  test('converts boolean false to "false"', () => {
    expect(sanitizeQueryParams({ active: false })).toEqual({ active: 'false' })
  })

  test('skips undefined values', () => {
    expect(sanitizeQueryParams({ offset: undefined })).toEqual({})
  })

  test('converts null to empty string', () => {
    expect(sanitizeQueryParams({ nullable: null })).toEqual({ nullable: '' })
  })

  test('joins array values with commas', () => {
    expect(sanitizeQueryParams({ ids: [1, 2, 3] })).toEqual({ ids: '1,2,3' })
  })

  test('joins array of strings with commas', () => {
    expect(sanitizeQueryParams({ tags: ['a', 'b', 'c'] })).toEqual({
      tags: 'a,b,c',
    })
  })

  test('joins mixed-type array with commas (each element stringified)', () => {
    expect(sanitizeQueryParams({ mixed: [1, 'two', true] })).toEqual({
      mixed: '1,two,true',
    })
  })

  test('JSON-stringifies plain objects', () => {
    expect(sanitizeQueryParams({ config: { key: 'value' } })).toEqual({
      config: '{"key":"value"}',
    })
  })

  test('mixes multiple types in one call', () => {
    expect(
      sanitizeQueryParams({
        name: 'users',
        limit: 100,
        offset: undefined,
        active: true,
      })
    ).toEqual({ name: 'users', limit: '100', active: 'true' })
  })

  test('returns empty object when all values are undefined', () => {
    expect(sanitizeQueryParams({ a: undefined, b: undefined })).toEqual({})
  })

  test('returns empty object for empty input', () => {
    expect(sanitizeQueryParams({})).toEqual({})
  })

  test('converts zero number to "0"', () => {
    expect(sanitizeQueryParams({ n: 0 })).toEqual({ n: '0' })
  })

  test('converts negative number to string', () => {
    expect(sanitizeQueryParams({ n: -42 })).toEqual({ n: '-42' })
  })

  test('handles empty string value', () => {
    expect(sanitizeQueryParams({ s: '' })).toEqual({ s: '' })
  })

  test('handles empty array', () => {
    expect(sanitizeQueryParams({ ids: [] })).toEqual({ ids: '' })
  })
})

// ---------------------------------------------------------------------------
// truncateString
// ---------------------------------------------------------------------------

describe('truncateString', () => {
  test('returns original string when shorter than maxLength', () => {
    expect(truncateString('hello', 10)).toBe('hello')
  })

  test('returns original string when equal to maxLength', () => {
    expect(truncateString('hello', 5)).toBe('hello')
  })

  test('truncates and appends ellipsis when longer than maxLength', () => {
    // substring(0, 20) of 'SELECT * FROM system.users' => 'SELECT * FROM system'
    expect(truncateString('SELECT * FROM system.users', 20)).toBe(
      'SELECT * FROM system...'
    )
  })

  test('truncates to the correct number of characters', () => {
    const result = truncateString('abcdefghij', 5)
    expect(result).toBe('abcde...')
    expect(result.length).toBe(8) // 5 chars + '...'
  })

  test('handles empty string', () => {
    expect(truncateString('', 10)).toBe('')
  })

  test('handles maxLength of 0', () => {
    expect(truncateString('abc', 0)).toBe('...')
  })

  test('handles maxLength of 1', () => {
    expect(truncateString('abc', 1)).toBe('a...')
  })
})

// ---------------------------------------------------------------------------
// isNonEmptyString
// ---------------------------------------------------------------------------

describe('isNonEmptyString', () => {
  test('returns true for a non-empty string', () => {
    expect(isNonEmptyString('hello')).toBe(true)
  })

  test('returns false for an empty string', () => {
    expect(isNonEmptyString('')).toBe(false)
  })

  test('returns false for a whitespace-only string', () => {
    expect(isNonEmptyString('   ')).toBe(false)
  })

  test('returns false for null', () => {
    expect(isNonEmptyString(null)).toBe(false)
  })

  test('returns false for undefined', () => {
    expect(isNonEmptyString(undefined)).toBe(false)
  })

  test('returns false for a number', () => {
    expect(isNonEmptyString(123)).toBe(false)
  })

  test('returns false for boolean', () => {
    expect(isNonEmptyString(true)).toBe(false)
  })

  test('returns false for an object', () => {
    expect(isNonEmptyString({})).toBe(false)
  })

  test('returns true for a string with leading/trailing spaces but non-empty after trim', () => {
    expect(isNonEmptyString('  a  ')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// isValidNumber
// ---------------------------------------------------------------------------

describe('isValidNumber', () => {
  test('returns true for a positive integer', () => {
    expect(isValidNumber(123)).toBe(true)
  })

  test('returns true for zero', () => {
    expect(isValidNumber(0)).toBe(true)
  })

  test('returns true for a negative number', () => {
    expect(isValidNumber(-5)).toBe(true)
  })

  test('returns true for a float', () => {
    expect(isValidNumber(3.14)).toBe(true)
  })

  test('returns false for NaN', () => {
    expect(isValidNumber(NaN)).toBe(false)
  })

  test('returns false for a numeric string', () => {
    expect(isValidNumber('123')).toBe(false)
  })

  test('returns false for null', () => {
    expect(isValidNumber(null)).toBe(false)
  })

  test('returns false for undefined', () => {
    expect(isValidNumber(undefined)).toBe(false)
  })

  test('returns false for boolean', () => {
    expect(isValidNumber(true)).toBe(false)
  })

  test('returns true for Infinity', () => {
    // Infinity is typeof 'number' and not NaN — the function accepts it
    expect(isValidNumber(Infinity)).toBe(true)
  })

  test('returns true for -Infinity', () => {
    expect(isValidNumber(-Infinity)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// isPositiveNumber
// ---------------------------------------------------------------------------

describe('isPositiveNumber', () => {
  test('returns true for a positive integer', () => {
    expect(isPositiveNumber(10)).toBe(true)
  })

  test('returns true for zero (>= 0)', () => {
    expect(isPositiveNumber(0)).toBe(true)
  })

  test('returns false for a negative number', () => {
    expect(isPositiveNumber(-5)).toBe(false)
  })

  test('returns false for a numeric string', () => {
    expect(isPositiveNumber('10')).toBe(false)
  })

  test('returns false for NaN', () => {
    expect(isPositiveNumber(NaN)).toBe(false)
  })

  test('returns false for null', () => {
    expect(isPositiveNumber(null)).toBe(false)
  })

  test('returns false for undefined', () => {
    expect(isPositiveNumber(undefined)).toBe(false)
  })

  test('returns true for a positive float', () => {
    expect(isPositiveNumber(0.1)).toBe(true)
  })

  test('returns false for a small negative float', () => {
    expect(isPositiveNumber(-0.001)).toBe(false)
  })
})
