import { describe, expect, it } from 'vitest'

import {
  safeArrayAccess,
  safePropertyAccess,
  validateEnum,
  validateHostId,
  validateNumericRange,
  validateString,
  validateUrl,
} from './validation'

describe('validation utilities', () => {
  describe('validateHostId', () => {
    it('should validate valid host IDs', () => {
      // Mock getClickHouseConfigs to return configs
      process.env.CLICKHOUSE_HOST = 'http://host1,http://host2'
      process.env.CLICKHOUSE_USER = 'user1'
      process.env.CLICKHOUSE_PASSWORD = 'pass1'

      const result = validateHostId(0)
      expect(result.isValid).toBe(true)
      expect(result.value).toBe(0)
    })

    it('should handle string host IDs', () => {
      const result = validateHostId('0')
      expect(result.isValid).toBe(true)
      expect(result.value).toBe(0)
    })

    it('should reject negative host IDs', () => {
      const result = validateHostId(-1)
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('non-negative')
    })

    it('should reject invalid string host IDs', () => {
      const result = validateHostId('invalid')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('valid number')
    })

    it('should handle null and undefined by defaulting to 0', () => {
      const resultNull = validateHostId(null)
      expect(resultNull.isValid).toBe(true)
      expect(resultNull.value).toBe(0)

      const resultUndef = validateHostId(undefined)
      expect(resultUndef.isValid).toBe(true)
      expect(resultUndef.value).toBe(0)
    })
  })

  describe('validateUrl', () => {
    it('should validate valid URLs', () => {
      const result = validateUrl('https://example.com')
      expect(result.isValid).toBe(true)
      expect(result.value).toBe('https://example.com')
    })

    it('should validate path URLs', () => {
      const result = validateUrl('/path/to/page')
      expect(result.isValid).toBe(true)
      expect(result.value).toBe('/path/to/page')
    })

    it('should reject empty URLs', () => {
      const result = validateUrl('')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('required')
    })

    it('should reject null URLs', () => {
      const result = validateUrl(null)
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('required')
    })
  })

  describe('validateNumericRange', () => {
    it('should validate numbers within range', () => {
      const result = validateNumericRange(5, 1, 10, 'testValue')
      expect(result.isValid).toBe(true)
      expect(result.value).toBe(5)
    })

    it('should validate string numbers within range', () => {
      const result = validateNumericRange('5', 1, 10, 'testValue')
      expect(result.isValid).toBe(true)
      expect(result.value).toBe(5)
    })

    it('should reject numbers below minimum', () => {
      const result = validateNumericRange(0, 1, 10, 'testValue')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('between 1 and 10')
    })

    it('should reject numbers above maximum', () => {
      const result = validateNumericRange(11, 1, 10, 'testValue')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('between 1 and 10')
    })

    it('should reject invalid numbers', () => {
      const result = validateNumericRange('invalid', 1, 10, 'testValue')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('valid number')
    })
  })

  describe('validateString', () => {
    it('should validate valid strings', () => {
      const result = validateString('test', 'testValue')
      expect(result.isValid).toBe(true)
      expect(result.value).toBe('test')
    })

    it('should trim strings', () => {
      const result = validateString('  test  ', 'testValue')
      expect(result.isValid).toBe(true)
      expect(result.value).toBe('test')
    })

    it('should validate minimum length', () => {
      const result = validateString('ab', 'testValue', 3)
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('at least 3')
    })

    it('should validate maximum length', () => {
      const result = validateString('abcdef', 'testValue', undefined, 5)
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('at most 5')
    })

    it('should reject null strings', () => {
      const result = validateString(null, 'testValue')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('required')
    })
  })

  describe('validateEnum', () => {
    it('should validate valid enum values', () => {
      const result = validateEnum(
        'option1',
        ['option1', 'option2', 'option3'],
        'testEnum'
      )
      expect(result.isValid).toBe(true)
      expect(result.value).toBe('option1')
    })

    it('should reject invalid enum values', () => {
      const result = validateEnum(
        'invalid',
        ['option1', 'option2', 'option3'],
        'testEnum'
      )
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('must be one of')
    })

    it('should reject null enum values', () => {
      const result = validateEnum(
        null,
        ['option1', 'option2', 'option3'],
        'testEnum'
      )
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('required')
    })
  })

  describe('safeArrayAccess', () => {
    it('should access valid array indices', () => {
      const arr = ['a', 'b', 'c']
      const result = safeArrayAccess(arr, 1)
      expect(result).toBe('b')
    })

    it('should return default for out-of-bounds indices', () => {
      const arr = ['a', 'b', 'c']
      const result = safeArrayAccess(arr, 5, 'default')
      expect(result).toBe('default')
    })

    it('should return undefined for out-of-bounds without default', () => {
      const arr = ['a', 'b', 'c']
      const result = safeArrayAccess(arr, 5)
      expect(result).toBeUndefined()
    })

    it('should handle null arrays', () => {
      const result = safeArrayAccess(null, 0, 'default')
      expect(result).toBe('default')
    })

    it('should handle negative indices', () => {
      const arr = ['a', 'b', 'c']
      const result = safeArrayAccess(arr, -1, 'default')
      expect(result).toBe('default')
    })
  })

  describe('safePropertyAccess', () => {
    it('should access valid properties', () => {
      const obj = { key: 'value' }
      const result = safePropertyAccess(obj, 'key')
      expect(result).toBe('value')
    })

    it('should return default for missing properties', () => {
      const obj = { key: 'value' }
      const result = safePropertyAccess(
        obj,
        'missing' as keyof typeof obj,
        'default'
      )
      expect(result).toBe('default')
    })

    it('should handle null objects', () => {
      const result = safePropertyAccess(null, 'key', 'default')
      expect(result).toBe('default')
    })
  })
})
