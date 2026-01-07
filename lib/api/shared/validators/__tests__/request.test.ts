/**
 * Request Validator Tests
 */

import type { ApiRequest } from '@/lib/api/types'

import {
  validateDataRequest,
  validateEnumValue,
  validateRequiredString,
  validateSearchParams,
} from '../request'
import { describe, expect, test } from 'bun:test'

describe('validateRequiredString', () => {
  test('should return undefined for valid non-empty strings', () => {
    expect(validateRequiredString('hello', 'field')).toBeUndefined()
    expect(validateRequiredString('test value', 'field')).toBeUndefined()
    expect(validateRequiredString('  spaces  ', 'field')).toBeUndefined()
  })

  test('should return error for undefined', () => {
    const result = validateRequiredString(undefined, 'fieldName')
    expect(result).toEqual({
      type: 'validation_error',
      message: 'Missing required field: fieldName',
    })
  })

  test('should return error for null', () => {
    const result = validateRequiredString(null, 'fieldName')
    expect(result).toEqual({
      type: 'validation_error',
      message: 'Missing required field: fieldName',
    })
  })

  test('should return error for empty string', () => {
    const result = validateRequiredString('', 'fieldName')
    expect(result).toEqual({
      type: 'validation_error',
      message: 'Missing required field: fieldName',
    })
  })

  test('should return error for whitespace-only string', () => {
    const result = validateRequiredString('   ', 'fieldName')
    expect(result).toEqual({
      type: 'validation_error',
      message: 'Missing required field: fieldName',
    })
  })

  test('should return error for non-string types', () => {
    const result1 = validateRequiredString(123, 'fieldName')
    const result2 = validateRequiredString(true, 'fieldName')
    const result3 = validateRequiredString({}, 'fieldName')
    const result4 = validateRequiredString([], 'fieldName')

    expect(result1).toEqual({
      type: 'validation_error',
      message: 'Missing required field: fieldName',
    })
    expect(result2).toEqual({
      type: 'validation_error',
      message: 'Missing required field: fieldName',
    })
    expect(result3).toEqual({
      type: 'validation_error',
      message: 'Missing required field: fieldName',
    })
    expect(result4).toEqual({
      type: 'validation_error',
      message: 'Missing required field: fieldName',
    })
  })
})

describe('validateDataRequest', () => {
  const validRequest: Partial<ApiRequest> = {
    query: 'SELECT * FROM system.users',
    hostId: 0,
    format: 'JSONEachRow',
  }

  test('should return undefined for valid request', () => {
    expect(validateDataRequest(validRequest)).toBeUndefined()
  })

  test('should return undefined for valid request without format', () => {
    const { format: _format, ...requestWithoutFormat } = validRequest
    expect(validateDataRequest(requestWithoutFormat)).toBeUndefined()
  })

  test('should return error for missing query', () => {
    const { query: _query, ...requestWithoutQuery } = validRequest
    const result = validateDataRequest(requestWithoutQuery)
    expect(result).toEqual({
      type: 'validation_error',
      message: 'Missing required field: query',
    })
  })

  test('should return error for empty query', () => {
    const result = validateDataRequest({ ...validRequest, query: '' })
    expect(result).toEqual({
      type: 'validation_error',
      message: 'Missing required field: query',
    })
  })

  test('should return error for missing hostId', () => {
    const { hostId: _hostId, ...requestWithoutHostId } = validRequest
    const result = validateDataRequest(requestWithoutHostId)
    expect(result).toEqual({
      type: 'validation_error',
      message: 'Missing required field: hostId',
    })
  })

  test('should return error for invalid hostId', () => {
    const result = validateDataRequest({ ...validRequest, hostId: -1 })
    expect(result).toEqual({
      type: 'validation_error',
      message: 'Invalid hostId: must be a non-negative number',
    })
  })

  test('should return error for invalid format', () => {
    const result = validateDataRequest({ ...validRequest, format: 'XML' })
    expect(result).toEqual({
      type: 'validation_error',
      message: 'Invalid format. Supported formats: JSONEachRow, JSON, CSV, TSV',
    })
  })

  test('should validate all fields and return first error', () => {
    const invalidRequest: Partial<ApiRequest> = {
      query: '',
      hostId: -1,
      format: 'XML',
    }
    const result = validateDataRequest(invalidRequest)
    expect(result).toEqual({
      type: 'validation_error',
      message: 'Missing required field: query',
    })
  })
})

describe('validateSearchParams', () => {
  const createSearchParams = (
    params: Record<string, string>
  ): URLSearchParams => {
    return new URLSearchParams(params)
  }

  test('should return undefined when all required params are present', () => {
    const params = createSearchParams({ hostId: '0', sql: 'SELECT 1' })
    expect(validateSearchParams(params, ['hostId', 'sql'])).toBeUndefined()
  })

  test('should return undefined when extra params are present', () => {
    const params = createSearchParams({
      hostId: '0',
      sql: 'SELECT 1',
      format: 'JSON',
    })
    expect(validateSearchParams(params, ['hostId', 'sql'])).toBeUndefined()
  })

  test('should return error when required param is missing', () => {
    const params = createSearchParams({ hostId: '0' })
    const result = validateSearchParams(params, ['hostId', 'sql'])
    expect(result).toEqual({
      type: 'validation_error',
      message: 'Missing required parameter: sql',
    })
  })

  test('should return error when required param is empty', () => {
    const params = createSearchParams({ hostId: '0', sql: '' })
    const result = validateSearchParams(params, ['hostId', 'sql'])
    expect(result).toEqual({
      type: 'validation_error',
      message: 'Missing required parameter: sql',
    })
  })

  test('should return error when required param is whitespace only', () => {
    const params = createSearchParams({ hostId: '0', sql: '   ' })
    const result = validateSearchParams(params, ['hostId', 'sql'])
    expect(result).toEqual({
      type: 'validation_error',
      message: 'Missing required parameter: sql',
    })
  })

  test('should handle single required param', () => {
    const params = createSearchParams({ hostId: '0' })
    expect(validateSearchParams(params, ['hostId'])).toBeUndefined()
  })

  test('should return error for first missing param in order', () => {
    const params = createSearchParams({})
    const result = validateSearchParams(params, ['hostId', 'sql', 'format'])
    expect(result).toEqual({
      type: 'validation_error',
      message: 'Missing required parameter: hostId',
    })
  })
})

describe('validateEnumValue', () => {
  type AllowedValues = 'option1' | 'option2' | 'option3'
  const allowedValues: AllowedValues[] = ['option1', 'option2', 'option3']

  test('should return undefined for undefined (optional)', () => {
    expect(validateEnumValue(undefined, allowedValues, 'field')).toBeUndefined()
  })

  test('should return undefined for null (optional)', () => {
    expect(validateEnumValue(null, allowedValues, 'field')).toBeUndefined()
  })

  test('should return undefined for valid value', () => {
    expect(validateEnumValue('option1', allowedValues, 'field')).toBeUndefined()
    expect(validateEnumValue('option2', allowedValues, 'field')).toBeUndefined()
    expect(validateEnumValue('option3', allowedValues, 'field')).toBeUndefined()
  })

  test('should return error for invalid value', () => {
    const result = validateEnumValue('option4', allowedValues, 'field')
    expect(result).toEqual({
      type: 'validation_error',
      message: 'Invalid field: must be one of option1, option2, option3',
    })
  })

  test('should return error for non-string type', () => {
    const result1 = validateEnumValue(123, allowedValues, 'field')
    const result2 = validateEnumValue(true, allowedValues, 'field')
    const result3 = validateEnumValue({}, allowedValues, 'field')

    expect(result1).toEqual({
      type: 'validation_error',
      message: 'Invalid field: must be a string',
    })
    expect(result2).toEqual({
      type: 'validation_error',
      message: 'Invalid field: must be a string',
    })
    expect(result3).toEqual({
      type: 'validation_error',
      message: 'Invalid field: must be a string',
    })
  })

  test('should handle numeric values in enum', () => {
    const numericValues = [1, 2, 3] as const
    const result = validateEnumValue(
      '1',
      numericValues as unknown as readonly string[],
      'field'
    )
    expect(result).toEqual({
      type: 'validation_error',
      message: 'Invalid field: must be one of 1, 2, 3',
    })
  })

  test('should be case sensitive', () => {
    const result = validateEnumValue('OPTION1', allowedValues, 'field')
    expect(result).toEqual({
      type: 'validation_error',
      message: 'Invalid field: must be one of option1, option2, option3',
    })
  })
})
