/**
 * Raw SQL Tests
 */

import { param, RawSql, raw } from '../raw'
import { describe, expect, it } from 'bun:test'

describe('RawSql', () => {
  describe('constructor and toSql', () => {
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

    it('should handle nested parentheses', () => {
      expect(raw('(a + b) * (c + d)').as('calc').toSql()).toBe(
        '((a + b) * (c + d)) AS calc'
      )
    })

    it('should handle empty string', () => {
      expect(raw('').toSql()).toBe('')
    })

    it('should handle whitespace', () => {
      expect(raw('  ').toSql()).toBe('  ')
    })

    it('should handle SELECT * expression', () => {
      expect(raw('SELECT * FROM users').toSql()).toBe('SELECT * FROM users')
    })

    it('should handle function calls', () => {
      expect(raw('COUNT(DISTINCT user_id)').as('unique_users').toSql()).toBe(
        '(COUNT(DISTINCT user_id)) AS unique_users'
      )
    })
  })

  describe('immutability', () => {
    it('should be immutable', () => {
      const original = raw('x + y')
      const aliased = original.as('sum')

      expect(original.toSql()).toBe('x + y')
      expect(aliased.toSql()).toBe('(x + y) AS sum')
    })

    it('should create new instance on each as() call', () => {
      const base = raw('expr')
      const alias1 = base.as('a')
      const alias2 = base.as('b')

      expect(alias1.toSql()).toBe('(expr) AS a')
      expect(alias2.toSql()).toBe('(expr) AS b')
      expect(base.toSql()).toBe('expr')
    })

    it('should allow chaining as() - last wins', () => {
      const result = raw('x').as('a').as('b')
      expect(result.toSql()).toBe('(x) AS b')
    })
  })

  describe('with alias', () => {
    it('should wrap in parentheses when aliased', () => {
      const result = raw('a + b').as('total')
      expect(result.toSql()).toBe('(a + b) AS total')
    })

    it('should not wrap without alias', () => {
      const result = raw('a + b')
      expect(result.toSql()).toBe('a + b')
    })

    it('should handle multi-line SQL with alias', () => {
      const multiLine = `CASE
        WHEN x > 0 THEN 'positive'
        ELSE 'non-positive'
      END`
      expect(raw(multiLine).as('category').toSql()).toBe(
        `(${multiLine}) AS category`
      )
    })
  })

  describe('SqlFragment interface', () => {
    it('should implement toSql method', () => {
      const instance = new RawSql('test')
      expect(typeof instance.toSql).toBe('function')
    })

    it('should work with direct constructor', () => {
      const instance = new RawSql('x > 5')
      expect(instance.toSql()).toBe('x > 5')
    })

    it('should work with constructor and alias', () => {
      const instance = new RawSql('x > 5')
      const aliased = instance.as('condition')
      expect(aliased.toSql()).toBe('(x > 5) AS condition')
    })
  })

  describe('edge cases', () => {
    it('should handle SQL with string literals', () => {
      expect(raw("'hello'").toSql()).toBe("'hello'")
    })

    it('should handle SQL with numbers', () => {
      expect(raw('42').toSql()).toBe('42')
    })

    it('should handle SQL with subqueries', () => {
      const subquery = '(SELECT MAX(id) FROM users)'
      expect(raw(subquery).as('max_id').toSql()).toBe(`(${subquery}) AS max_id`)
    })

    it('should handle very long expressions', () => {
      const longExpr = 'a'.repeat(1000)
      expect(raw(longExpr).toSql()).toBe(longExpr)
    })

    it('should handle special characters', () => {
      expect(raw('col::text').as('cast').toSql()).toBe('(col::text) AS cast')
    })
  })
})

describe('param', () => {
  describe('basic parameters', () => {
    it('should create string parameter', () => {
      expect(param('user', 'String')).toBe('{user:String}')
    })

    it('should create numeric parameter', () => {
      expect(param('limit', 'UInt32')).toBe('{limit:UInt32}')
    })

    it('should create datetime parameter', () => {
      expect(param('start_date', 'DateTime')).toBe('{start_date:DateTime}')
    })
  })

  describe('complex types', () => {
    it('should handle complex type names', () => {
      expect(param('arr', 'Array(String)')).toBe('{arr:Array(String)}')
    })

    it('should handle nullable types', () => {
      expect(param('nullable_id', 'Nullable(UInt64)')).toBe(
        '{nullable_id:Nullable(UInt64)}'
      )
    })

    it('should handle low cardinality types', () => {
      expect(param('status', 'LowCardinality(String)')).toBe(
        '{status:LowCardinality(String)}'
      )
    })

    it('should handle simple date type', () => {
      expect(param('d', 'Date')).toBe('{d:Date}')
    })

    it('should handle float type', () => {
      expect(param('score', 'Float64')).toBe('{score:Float64}')
    })

    it('should handle decimal type', () => {
      expect(param('amount', 'Decimal(18,2)')).toBe('{amount:Decimal(18,2)}')
    })
  })

  describe('edge cases', () => {
    it('should handle empty name', () => {
      expect(param('', 'String')).toBe('{:String}')
    })

    it('should handle empty type', () => {
      expect(param('name', '')).toBe('{name:}')
    })

    it('should handle names with underscores', () => {
      expect(param('my_param_name', 'String')).toBe('{my_param_name:String}')
    })

    it('should handle type with nested parentheses', () => {
      expect(param('data', 'Map(String, Array(UInt64))')).toBe(
        '{data:Map(String, Array(UInt64))}'
      )
    })

    it('should handle tuple type', () => {
      expect(param('coords', 'Tuple(Float64, Float64)')).toBe(
        '{coords:Tuple(Float64, Float64)}'
      )
    })
  })

  describe('usage in queries', () => {
    it('should format correctly for ClickHouse parameterized queries', () => {
      const userParam = param('user', 'String')
      const limitParam = param('limit', 'UInt32')

      const query = `SELECT * FROM users WHERE name = ${userParam} LIMIT ${limitParam}`
      expect(query).toBe(
        'SELECT * FROM users WHERE name = {user:String} LIMIT {limit:UInt32}'
      )
    })

    it('should compose multiple params', () => {
      const p1 = param('start', 'DateTime')
      const p2 = param('end', 'DateTime')
      const p3 = param('limit', 'UInt64')

      const where = `event_time BETWEEN ${p1} AND ${p2}`
      const limit = `LIMIT ${p3}`

      expect(where).toBe(
        'event_time BETWEEN {start:DateTime} AND {end:DateTime}'
      )
      expect(limit).toBe('LIMIT {limit:UInt64}')
    })
  })
})
