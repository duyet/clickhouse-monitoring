/**
 * Validator Utilities Tests
 */

import {
  isNonEmptyString,
  isPositiveNumber,
  isValidNumber,
  sanitizeQueryParams,
  truncateString,
} from '../utils'
import { describe, expect, test } from '@jest/globals'

describe('sanitizeQueryParams', () => {
  test('should convert primitives to strings', () => {
    const result = sanitizeQueryParams({
      name: 'users',
      count: 100,
      active: true,
    })

    expect(result).toEqual({
      name: 'users',
      count: '100',
      active: 'true',
    })
  })

  test('should handle null values', () => {
    const result = sanitizeQueryParams({
      nullable: null,
      name: 'test',
    })

    expect(result).toEqual({
      nullable: '',
      name: 'test',
    })
  })

  test('should remove undefined values', () => {
    const result = sanitizeQueryParams({
      name: 'test',
      optional: undefined,
      count: 10,
    })

    expect(result).toEqual({
      name: 'test',
      count: '10',
    })
    expect(result).not.toHaveProperty('optional')
  })

  test('should join arrays with commas', () => {
    const result = sanitizeQueryParams({
      ids: [1, 2, 3],
      names: ['a', 'b', 'c'],
    })

    expect(result).toEqual({
      ids: '1,2,3',
      names: 'a,b,c',
    })
  })

  test('should stringify objects', () => {
    const result = sanitizeQueryParams({
      config: { key: 'value', nested: { num: 123 } },
    })

    expect(result).toEqual({
      config: '{"key":"value","nested":{"num":123}}',
    })
  })

  test('should handle mixed types', () => {
    const result = sanitizeQueryParams({
      string: 'hello',
      number: 42,
      boolean: false,
      null: null,
      undefined: undefined,
      array: [1, 2, 3],
      object: { key: 'value' },
    })

    expect(result).toEqual({
      string: 'hello',
      number: '42',
      boolean: 'false',
      null: '',
      array: '1,2,3',
      object: '{"key":"value"}',
    })
  })

  test('should handle empty arrays', () => {
    const result = sanitizeQueryParams({
      empty: [],
    })

    expect(result).toEqual({
      empty: '',
    })
  })

  test('should handle arrays with mixed types', () => {
    const result = sanitizeQueryParams({
      mixed: [1, 'two', true, null],
    })

    expect(result).toEqual({
      mixed: '1,two,true,null',
    })
  })

  test('should handle nested arrays', () => {
    const result = sanitizeQueryParams({
      nested: [
        [1, 2],
        [3, 4],
      ],
    })

    expect(result).toEqual({
      nested: '1,2,3,4',
    })
  })

  test('should handle special characters in strings', () => {
    const result = sanitizeQueryParams({
      special: '"quotes" and \'apostrophes\'',
    })

    expect(result).toEqual({
      special: '"quotes" and \'apostrophes\'',
    })
  })
})

describe('truncateString', () => {
  test('should return string unchanged if shorter than max', () => {
    expect(truncateString('hello', 10)).toBe('hello')
    expect(truncateString('hello', 5)).toBe('hello')
  })

  test('should truncate string longer than max', () => {
    expect(truncateString('hello world', 5)).toBe('hello...')
    expect(truncateString('SELECT * FROM system.users', 15)).toBe(
      'SELECT * FROM s...'
    )
  })

  test('should handle empty string', () => {
    expect(truncateString('', 10)).toBe('')
  })

  test('should handle max length of 0', () => {
    expect(truncateString('hello', 0)).toBe('...')
  })

  test('should handle very long strings', () => {
    const longString = 'a'.repeat(1000)
    expect(truncateString(longString, 50)).toBe(`${'a'.repeat(50)}...`)
  })

  test('should handle unicode characters', () => {
    expect(truncateString('Hello World', 8)).toBe('Hello Wo...')
  })
})

describe('isNonEmptyString', () => {
  test('should return true for non-empty strings', () => {
    expect(isNonEmptyString('hello')).toBe(true)
    expect(isNonEmptyString('hello world')).toBe(true)
    expect(isNonEmptyString('  spaces  ')).toBe(true)
    expect(isNonEmptyString('0')).toBe(true)
  })

  test('should return false for empty string', () => {
    expect(isNonEmptyString('')).toBe(false)
  })

  test('should return false for whitespace-only string', () => {
    expect(isNonEmptyString('   ')).toBe(false)
    expect(isNonEmptyString('\t\n')).toBe(false)
  })

  test('should return false for non-string types', () => {
    expect(isNonEmptyString(undefined)).toBe(false)
    expect(isNonEmptyString(null)).toBe(false)
    expect(isNonEmptyString(123)).toBe(false)
    expect(isNonEmptyString(true)).toBe(false)
    expect(isNonEmptyString({})).toBe(false)
    expect(isNonEmptyString([])).toBe(false)
  })

  test('should work as type guard', () => {
    const value: unknown = 'hello'
    if (isNonEmptyString(value)) {
      // TypeScript should know value is string here
      expect(value.toUpperCase()).toBe('HELLO')
    } else {
      fail('Should be non-empty string')
    }
  })
})

describe('isValidNumber', () => {
  test('should return true for valid numbers', () => {
    expect(isValidNumber(0)).toBe(true)
    expect(isValidNumber(1)).toBe(true)
    expect(isValidNumber(-1)).toBe(true)
    expect(isValidNumber(1.5)).toBe(true)
    expect(isValidNumber(-1.5)).toBe(true)
    expect(isValidNumber(Number.MAX_VALUE)).toBe(true)
    expect(isValidNumber(Number.MIN_VALUE)).toBe(true)
  })

  test('should return false for NaN', () => {
    expect(isValidNumber(NaN)).toBe(false)
  })

  test('should return false for Infinity', () => {
    expect(isValidNumber(Infinity)).toBe(true) // Infinity is a valid number in JS
    expect(isValidNumber(-Infinity)).toBe(true)
  })

  test('should return false for non-number types', () => {
    expect(isValidNumber(undefined)).toBe(false)
    expect(isValidNumber(null)).toBe(false)
    expect(isValidNumber('123')).toBe(false)
    expect(isValidNumber(true)).toBe(false)
    expect(isValidNumber({})).toBe(false)
    expect(isValidNumber([])).toBe(false)
  })

  test('should work as type guard', () => {
    const value: unknown = 42
    if (isValidNumber(value)) {
      // TypeScript should know value is number here
      expect(value + 1).toBe(43)
    } else {
      fail('Should be valid number')
    }
  })
})

describe('isPositiveNumber', () => {
  test('should return true for positive numbers including zero', () => {
    expect(isPositiveNumber(0)).toBe(true)
    expect(isPositiveNumber(1)).toBe(true)
    expect(isPositiveNumber(100)).toBe(true)
    expect(isPositiveNumber(1.5)).toBe(true)
  })

  test('should return false for negative numbers', () => {
    expect(isPositiveNumber(-1)).toBe(false)
    expect(isPositiveNumber(-100)).toBe(false)
    expect(isPositiveNumber(-1.5)).toBe(false)
  })

  test('should return false for NaN', () => {
    expect(isPositiveNumber(NaN)).toBe(false)
  })

  test('should return false for non-number types', () => {
    expect(isPositiveNumber(undefined)).toBe(false)
    expect(isPositiveNumber(null)).toBe(false)
    expect(isPositiveNumber('123')).toBe(false)
    expect(isPositiveNumber(true)).toBe(false)
  })

  test('should work as type guard', () => {
    const value: unknown = 42
    if (isPositiveNumber(value)) {
      // TypeScript should know value is number here
      expect(value * 2).toBe(84)
    } else {
      fail('Should be positive number')
    }
  })

  test('should handle edge case of zero', () => {
    expect(isPositiveNumber(0)).toBe(true)
    expect(isPositiveNumber(-0)).toBe(true) // -0 === 0 in JavaScript
  })
})
