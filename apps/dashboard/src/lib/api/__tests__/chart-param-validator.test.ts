/**
 * Tests for chart query_params validator.
 *
 * Covers:
 *  - Happy path: valid primitives pass through
 *  - Rejection: too many keys
 *  - Rejection: key too long
 *  - Rejection: value string too long
 *  - Rejection: nested object value
 *  - Rejection: non-finite number
 *  - Rejection: unknown key when allowedParams set
 *  - Allowed: null values are silently dropped
 *  - Coercion: number and boolean pass through typed
 */

import { validateChartParams } from '../chart-param-validator'
import { describe, expect, test } from 'bun:test'

describe('validateChartParams — happy path', () => {
  test('valid string/number/boolean params pass through', () => {
    const result = validateChartParams({
      table: 'system.query_log',
      limit: 100,
      enabled: true,
    })
    expect(result.type).toBe('ok')
    if (result.type === 'ok') {
      expect(result.params.table).toBe('system.query_log')
      expect(result.params.limit).toBe(100)
      expect(result.params.enabled).toBe(true)
    }
  })

  test('empty object is valid', () => {
    const result = validateChartParams({})
    expect(result.type).toBe('ok')
    if (result.type === 'ok') {
      expect(Object.keys(result.params)).toHaveLength(0)
    }
  })

  test('null values are silently dropped', () => {
    const result = validateChartParams({ present: 'yes', absent: null })
    expect(result.type).toBe('ok')
    if (result.type === 'ok') {
      expect(result.params.present).toBe('yes')
      expect('absent' in result.params).toBe(false)
    }
  })
})

describe('validateChartParams — rejection cases', () => {
  test('rejects when param count exceeds limit', () => {
    const raw: Record<string, unknown> = {}
    for (let i = 0; i < 21; i++) raw[`key${i}`] = 'v'
    const result = validateChartParams(raw)
    expect(result.type).toBe('validation')
    if (result.type === 'validation') {
      expect(result.message).toMatch(/Too many/)
    }
  })

  test('rejects key longer than 64 chars', () => {
    const longKey = 'k'.repeat(65)
    const result = validateChartParams({ [longKey]: 'value' })
    expect(result.type).toBe('validation')
    if (result.type === 'validation') {
      expect(result.message).toMatch(/key too long/i)
    }
  })

  test('rejects string value longer than 512 chars', () => {
    const result = validateChartParams({ sql: 'x'.repeat(513) })
    expect(result.type).toBe('validation')
    if (result.type === 'validation') {
      expect(result.message).toMatch(/too long/i)
      expect(result.field).toBe('sql')
    }
  })

  test('rejects nested object value', () => {
    const result = validateChartParams({ nested: { a: 1 } })
    expect(result.type).toBe('validation')
    if (result.type === 'validation') {
      expect(result.message).toMatch(/primitive/)
    }
  })

  test('rejects array value', () => {
    const result = validateChartParams({ ids: [1, 2, 3] })
    expect(result.type).toBe('validation')
  })

  test('rejects non-finite number (NaN)', () => {
    const result = validateChartParams({ limit: Number.NaN })
    expect(result.type).toBe('validation')
    if (result.type === 'validation') {
      expect(result.message).toMatch(/finite/)
    }
  })

  test('rejects non-finite number (Infinity)', () => {
    const result = validateChartParams({ limit: Number.POSITIVE_INFINITY })
    expect(result.type).toBe('validation')
  })
})

describe('validateChartParams — allowedParams whitelist', () => {
  test('allows keys in the whitelist', () => {
    const result = validateChartParams({ table: 'events', limit: 50 }, [
      'table',
      'limit',
    ])
    expect(result.type).toBe('ok')
  })

  test('rejects unknown key when whitelist is provided', () => {
    const result = validateChartParams({ table: 'events', extra: 'surprise' }, [
      'table',
    ])
    expect(result.type).toBe('validation')
    if (result.type === 'validation') {
      expect(result.message).toMatch(/Unknown chart param/)
      expect(result.field).toBe('extra')
    }
  })

  test('accepts whitelist as a Set', () => {
    const allowed = new Set(['database'])
    const result = validateChartParams({ database: 'default' }, allowed)
    expect(result.type).toBe('ok')
  })

  test('rejects unknown key when whitelist is a Set', () => {
    const allowed = new Set(['database'])
    const result = validateChartParams(
      { database: 'default', hack: 'x' },
      allowed
    )
    expect(result.type).toBe('validation')
    if (result.type === 'validation') {
      expect(result.field).toBe('hack')
    }
  })
})
