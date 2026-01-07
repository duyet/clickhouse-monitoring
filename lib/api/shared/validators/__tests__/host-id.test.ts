/**
 * Host ID Validator Tests
 */

import {
  getAndValidateHostId,
  validateHostId,
  validateHostIdWithError,
} from '../host-id'
import { describe, expect, test } from 'bun:test'

describe('validateHostId', () => {
  test('should return parsed number for valid hostId string', () => {
    expect(validateHostId('0')).toBe(0)
    expect(validateHostId('1')).toBe(1)
    expect(validateHostId('10')).toBe(10)
    expect(validateHostId('999')).toBe(999)
  })

  test('should throw error for null hostId', () => {
    expect(() => validateHostId(null)).toThrow(
      'Missing required parameter: hostId'
    )
  })

  test('should throw error for empty string hostId', () => {
    expect(() => validateHostId('')).toThrow(
      'Missing required parameter: hostId'
    )
  })

  test('should throw error for invalid number string', () => {
    expect(() => validateHostId('abc')).toThrow(
      'Invalid hostId: must be a non-negative number'
    )
  })

  test('should throw error for negative numbers', () => {
    expect(() => validateHostId('-1')).toThrow(
      'Invalid hostId: must be a non-negative number'
    )
    expect(() => validateHostId('-100')).toThrow(
      'Invalid hostId: must be a non-negative number'
    )
  })

  test('should throw error for NaN', () => {
    expect(() => validateHostId('NaN')).toThrow(
      'Invalid hostId: must be a non-negative number'
    )
  })
})

describe('validateHostIdWithError', () => {
  test('should return undefined for valid number hostId', () => {
    expect(validateHostIdWithError(0)).toBeUndefined()
    expect(validateHostIdWithError(1)).toBeUndefined()
    expect(validateHostIdWithError(100)).toBeUndefined()
  })

  test('should return undefined for valid string hostId', () => {
    expect(validateHostIdWithError('0')).toBeUndefined()
    expect(validateHostIdWithError('1')).toBeUndefined()
    expect(validateHostIdWithError('100')).toBeUndefined()
  })

  test('should return error for undefined hostId', () => {
    const result = validateHostIdWithError(undefined)
    expect(result).toEqual({
      type: 'validation_error',
      message: 'Missing required field: hostId',
    })
  })

  test('should return error for null hostId', () => {
    const result = validateHostIdWithError(null)
    expect(result).toEqual({
      type: 'validation_error',
      message: 'Missing required field: hostId',
    })
  })

  test('should return error for empty string hostId', () => {
    const result = validateHostIdWithError('')
    expect(result).toEqual({
      type: 'validation_error',
      message: 'Missing required field: hostId',
    })
  })

  test('should return error for invalid number string', () => {
    const result = validateHostIdWithError('abc')
    expect(result).toEqual({
      type: 'validation_error',
      message: 'Invalid hostId: must be a non-negative number',
    })
  })

  test('should return error for negative numbers', () => {
    const result1 = validateHostIdWithError(-1)
    const result2 = validateHostIdWithError('-1')

    expect(result1).toEqual({
      type: 'validation_error',
      message: 'Invalid hostId: must be a non-negative number',
    })
    expect(result2).toEqual({
      type: 'validation_error',
      message: 'Invalid hostId: must be a non-negative number',
    })
  })
})

describe('getAndValidateHostId', () => {
  const createSearchParams = (hostId: string | null): URLSearchParams => {
    const params = new URLSearchParams()
    if (hostId !== null) {
      params.set('hostId', hostId)
    }
    return params
  }

  test('should return parsed number for valid hostId', () => {
    const params1 = createSearchParams('0')
    const params2 = createSearchParams('1')
    const params3 = createSearchParams('100')

    expect(getAndValidateHostId(params1)).toBe(0)
    expect(getAndValidateHostId(params2)).toBe(1)
    expect(getAndValidateHostId(params3)).toBe(100)
  })

  test('should return error for missing hostId parameter', () => {
    const params = createSearchParams(null)
    const result = getAndValidateHostId(params)

    expect(result).toEqual({
      type: 'validation_error',
      message: 'Missing required parameter: hostId',
    })
  })

  test('should return error for invalid hostId', () => {
    const params = createSearchParams('abc')
    const result = getAndValidateHostId(params)

    expect(result).toEqual({
      type: 'validation_error',
      message: 'Invalid hostId: must be a non-negative number',
    })
  })

  test('should return error for negative hostId', () => {
    const params = createSearchParams('-1')
    const result = getAndValidateHostId(params)

    expect(result).toEqual({
      type: 'validation_error',
      message: 'Invalid hostId: must be a non-negative number',
    })
  })

  test('should handle type narrowing for success case', () => {
    const params = createSearchParams('5')
    const result = getAndValidateHostId(params)

    if (typeof result === 'number') {
      // TypeScript should know result is number here
      expect(result).toBe(5)
      expect(result + 1).toBe(6)
    } else {
      fail('Expected number, got error')
    }
  })
})
