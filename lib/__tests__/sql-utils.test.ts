import {
  escapeIdentifier,
  escapeQualifiedIdentifier,
  validateIdentifier,
  validateLimit,
} from '../sql-utils'
import { describe, expect, it } from 'bun:test'

describe('validateIdentifier', () => {
  it('accepts alphanumeric identifiers', () => {
    expect(validateIdentifier('my_table_123')).toBe('my_table_123')
  })

  it('accepts hyphens', () => {
    expect(validateIdentifier('my-table')).toBe('my-table')
  })

  it('rejects dots by default', () => {
    expect(() => validateIdentifier('db.table')).toThrow(/Invalid identifier/)
  })

  it('allows dots when allowDots is true', () => {
    expect(validateIdentifier('db.table', true)).toBe('db.table')
  })

  it('rejects SQL-injection style payloads', () => {
    expect(() => validateIdentifier("foo'; DROP TABLE x; --")).toThrow(
      /Invalid identifier/
    )
    expect(() => validateIdentifier('foo bar')).toThrow(/Invalid identifier/)
  })

  it('throws on empty input', () => {
    expect(() => validateIdentifier('')).toThrow(/must be a non-empty string/)
  })
})

describe('escapeIdentifier', () => {
  it('wraps the identifier in backticks', () => {
    expect(escapeIdentifier('users')).toBe('`users`')
  })

  it('doubles embedded backticks to neutralize them', () => {
    expect(escapeIdentifier('weird`name')).toBe('`weird``name`')
  })

  it('throws on empty input', () => {
    expect(() => escapeIdentifier('')).toThrow(/must be a non-empty string/)
  })
})

describe('escapeQualifiedIdentifier', () => {
  it('escapes each part and joins with dots', () => {
    expect(escapeQualifiedIdentifier('default', 'users')).toBe(
      '`default`.`users`'
    )
  })

  it('handles single-part inputs', () => {
    expect(escapeQualifiedIdentifier('only')).toBe('`only`')
  })
})

describe('validateLimit', () => {
  it('accepts non-negative integer numbers', () => {
    expect(validateLimit(0)).toBe(0)
    expect(validateLimit(100)).toBe(100)
  })

  it('coerces numeric strings', () => {
    expect(validateLimit('250')).toBe(250)
  })

  it('rejects NaN, negatives, floats, and non-numeric strings', () => {
    expect(() => validateLimit(NaN)).toThrow(/Invalid LIMIT/)
    expect(() => validateLimit(-1)).toThrow(/Invalid LIMIT/)
    expect(() => validateLimit(1.5)).toThrow(/Invalid LIMIT/)
    expect(() => validateLimit('abc')).toThrow(/Invalid LIMIT/)
  })

  it('caps abusive values at 100000', () => {
    expect(() => validateLimit(100001)).toThrow(/too large/)
    expect(validateLimit(100000)).toBe(100000)
  })
})
