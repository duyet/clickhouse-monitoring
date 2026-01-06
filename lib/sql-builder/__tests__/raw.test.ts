/**
 * Raw SQL Tests
 */

import { param, raw } from '../raw'
import { describe, expect, it } from '@jest/globals'

describe('RawSql', () => {
  it('should create raw SQL without alias', () => {
    expect(raw('x + y').toSql()).toBe('x + y')
  })

  it('should create raw SQL with alias', () => {
    expect(raw('x + y').as('sum').toSql()).toBe('(x + y) AS sum')
  })

  it('should handle complex expressions', () => {
    const sql = 'CASE WHEN x > 0 THEN 1 ELSE 0 END'
    expect(raw(sql).as('flag').toSql()).toBe(`(${sql}) AS flag`)
  })

  it('should be immutable', () => {
    const original = raw('x + y')
    const aliased = original.as('sum')

    expect(original.toSql()).toBe('x + y')
    expect(aliased.toSql()).toBe('(x + y) AS sum')
  })

  it('should handle nested parentheses', () => {
    expect(raw('(a + b) * (c + d)').as('calc').toSql()).toBe(
      '((a + b) * (c + d)) AS calc'
    )
  })
})

describe('param', () => {
  it('should create string parameter', () => {
    expect(param('user', 'String')).toBe('{user:String}')
  })

  it('should create numeric parameter', () => {
    expect(param('limit', 'UInt32')).toBe('{limit:UInt32}')
  })

  it('should create datetime parameter', () => {
    expect(param('start_date', 'DateTime')).toBe('{start_date:DateTime}')
  })

  it('should handle complex type names', () => {
    expect(param('arr', 'Array(String)')).toBe('{arr:Array(String)}')
  })

  it('should handle nullable types', () => {
    expect(param('nullable_id', 'Nullable(UInt64)')).toBe(
      '{nullable_id:Nullable(UInt64)}'
    )
  })
})
