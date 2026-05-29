/**
 * Validator Tests
 *
 * Tests for SQL builder state validation.
 */

import type { BuilderState } from '../types'

import { sql } from '../builder'
import { SqlBuilderError, validateBuilderState } from '../validator'
import { describe, expect, it } from 'bun:test'

describe('SqlBuilderError', () => {
  it('should create error with message', () => {
    const error = new SqlBuilderError('test message')
    expect(error.message).toBe('test message')
    expect(error.name).toBe('SqlBuilderError')
    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(SqlBuilderError)
  })

  it('should create error with context', () => {
    const error = new SqlBuilderError('test', { state: 'missing_from' })
    expect(error.context).toEqual({ state: 'missing_from' })
  })

  it('should create error without context', () => {
    const error = new SqlBuilderError('test')
    expect(error.context).toBeUndefined()
  })

  it('should be catchable as Error', () => {
    const throwIt = () => {
      throw new SqlBuilderError('caught')
    }
    expect(throwIt).toThrow(Error)
    expect(throwIt).toThrow(SqlBuilderError)
  })

  it('should preserve instanceof across boundaries', () => {
    const error = new SqlBuilderError('test')
    expect(error instanceof SqlBuilderError).toBe(true)
    // Check prototype chain
    expect(Object.getPrototypeOf(error)).toBe(SqlBuilderError.prototype)
  })
})

describe('validateBuilderState', () => {
  describe('valid states', () => {
    it('should accept minimal valid state', () => {
      const state: BuilderState = {
        ctes: [],
        columns: ['id'],
        from: { table: 'users' },
        joins: [],
        wheres: [],
        groupBy: [],
        having: [],
        orderBy: [],
        limit: undefined,
        offset: undefined,
        unions: [],
        settings: {},
        format: undefined,
      }
      expect(() => validateBuilderState(state)).not.toThrow()
    })

    it('should accept fully populated valid state', () => {
      const _state: BuilderState = {
        ctes: [],
        columns: ['id', 'name'],
        from: { table: 'users', alias: 'u' },
        joins: [
          {
            type: 'INNER',
            table: 'orders',
            alias: 'o',
            condition: 'o.user_id = u.id',
          },
        ],
        wheres: [{ column: 'age', operator: '>', value: 18, type: 'and' }],
        groupBy: ['user_id'],
        having: [{ column: 'count()', operator: '>', value: 5, type: 'and' }],
        orderBy: [{ column: 'name', direction: 'ASC' }],
        limit: 10,
        offset: 5,
        unions: [],
        settings: { max_execution_time: 60 },
        format: 'JSONEachRow',
      }
      expect(() => validateBuilderState(state)).not.toThrow()
    })

    it('should accept state with LIMIT 0', () => {
      const state: BuilderState = {
        ctes: [],
        columns: ['id'],
        from: { table: 'users' },
        joins: [],
        wheres: [],
        groupBy: [],
        having: [],
        orderBy: [],
        limit: 0,
        offset: undefined,
        unions: [],
        settings: {},
      }
      expect(() => validateBuilderState(state)).not.toThrow()
    })

    it('should accept state with OFFSET 0', () => {
      const state: BuilderState = {
        ctes: [],
        columns: ['id'],
        from: { table: 'users' },
        joins: [],
        wheres: [],
        groupBy: [],
        having: [],
        orderBy: [],
        limit: 10,
        offset: 0,
        unions: [],
        settings: {},
      }
      expect(() => validateBuilderState(state)).not.toThrow()
    })

    it('should accept WHERE with valid operators', () => {
      const operators = [
        '=',
        '!=',
        '<>',
        '>',
        '>=',
        '<',
        '<=',
        'LIKE',
        'NOT LIKE',
        'IN',
        'NOT IN',
        'IS',
        'IS NOT',
        'BETWEEN',
        'NOT BETWEEN',
      ]
      for (const op of operators) {
        const state: BuilderState = {
          ctes: [],
          columns: ['id'],
          from: { table: 'users' },
          joins: [],
          wheres: [{ column: 'col', operator: op, value: 1, type: 'and' }],
          groupBy: [],
          having: [],
          orderBy: [],
          unions: [],
          settings: {},
        }
        expect(
          () => validateBuilderState(state),
          `operator ${op}`
        ).not.toThrow()
      }
    })

    it('should accept CASE-INSENSITIVE operators', () => {
      const state: BuilderState = {
        ctes: [],
        columns: ['id'],
        from: { table: 'users' },
        joins: [],
        wheres: [
          { column: 'col', operator: 'like', value: '%test%', type: 'and' },
        ],
        groupBy: [],
        having: [],
        orderBy: [],
        unions: [],
        settings: {},
      }
      expect(() => validateBuilderState(state)).not.toThrow()
    })

    it('should accept WHERE with raw SQL conditions', () => {
      const state: BuilderState = {
        ctes: [],
        columns: ['id'],
        from: { table: 'users' },
        joins: [],
        wheres: [
          {
            column: '',
            operator: '',
            value: { toSql: () => 'x > 5' } as any,
            type: 'and',
          },
        ],
        groupBy: [],
        having: [],
        orderBy: [],
        unions: [],
        settings: {},
      }
      expect(() => validateBuilderState(state)).not.toThrow()
    })
  })

  describe('missing FROM clause', () => {
    it('should throw when FROM is missing', () => {
      const state: BuilderState = {
        ctes: [],
        columns: ['id'],
        from: undefined,
        joins: [],
        wheres: [],
        groupBy: [],
        having: [],
        orderBy: [],
        unions: [],
        settings: {},
      }
      expect(() => validateBuilderState(state)).toThrow(SqlBuilderError)
      expect(() => validateBuilderState(state)).toThrow(
        'Cannot build SQL without FROM clause'
      )
    })

    it('should include context about columns when FROM is missing', () => {
      try {
        validateBuilderState({
          ctes: [],
          columns: ['id'],
          from: undefined,
          joins: [],
          wheres: [],
          groupBy: [],
          having: [],
          orderBy: [],
          unions: [],
          settings: {},
        })
      } catch (e) {
        expect(e).toBeInstanceOf(SqlBuilderError)
        expect((e as SqlBuilderError).context).toEqual({
          state: 'missing_from',
          hasColumns: true,
        })
      }
    })
  })

  describe('missing columns', () => {
    it('should throw when no columns selected', () => {
      const state: BuilderState = {
        ctes: [],
        columns: [],
        from: { table: 'users' },
        joins: [],
        wheres: [],
        groupBy: [],
        having: [],
        orderBy: [],
        unions: [],
        settings: {},
      }
      expect(() => validateBuilderState(state)).toThrow(SqlBuilderError)
      expect(() => validateBuilderState(state)).toThrow(
        'Cannot build SQL without columns'
      )
    })

    it('should include context about FROM when columns are missing', () => {
      try {
        validateBuilderState({
          ctes: [],
          columns: [],
          from: { table: 'users' },
          joins: [],
          wheres: [],
          groupBy: [],
          having: [],
          orderBy: [],
          unions: [],
          settings: {},
        })
      } catch (e) {
        expect((e as SqlBuilderError).context).toEqual({
          state: 'missing_select',
          hasFrom: true,
        })
      }
    })
  })

  describe('HAVING without GROUP BY', () => {
    it('should throw when HAVING used without GROUP BY', () => {
      const state: BuilderState = {
        ctes: [],
        columns: ['id'],
        from: { table: 'users' },
        joins: [],
        wheres: [],
        groupBy: [],
        having: [{ column: 'count()', operator: '>', value: 5, type: 'and' }],
        orderBy: [],
        unions: [],
        settings: {},
      }
      expect(() => validateBuilderState(state)).toThrow(SqlBuilderError)
      expect(() => validateBuilderState(state)).toThrow(
        'Cannot use HAVING clause without GROUP BY'
      )
    })
  })

  describe('LIMIT validation', () => {
    it('should throw for negative LIMIT', () => {
      const state: BuilderState = {
        ctes: [],
        columns: ['id'],
        from: { table: 'users' },
        joins: [],
        wheres: [],
        groupBy: [],
        having: [],
        orderBy: [],
        limit: -1,
        unions: [],
        settings: {},
      }
      expect(() => validateBuilderState(state)).toThrow(SqlBuilderError)
      expect(() => validateBuilderState(state)).toThrow(
        'LIMIT must be a non-negative number'
      )
    })

    it('should throw for non-integer LIMIT', () => {
      const state: BuilderState = {
        ctes: [],
        columns: ['id'],
        from: { table: 'users' },
        joins: [],
        wheres: [],
        groupBy: [],
        having: [],
        orderBy: [],
        limit: 1.5,
        unions: [],
        settings: {},
      }
      expect(() => validateBuilderState(state)).toThrow(SqlBuilderError)
      expect(() => validateBuilderState(state)).toThrow(
        'LIMIT must be an integer'
      )
    })
  })

  describe('OFFSET validation', () => {
    it('should throw for negative OFFSET', () => {
      const state: BuilderState = {
        ctes: [],
        columns: ['id'],
        from: { table: 'users' },
        joins: [],
        wheres: [],
        groupBy: [],
        having: [],
        orderBy: [],
        limit: 10,
        offset: -5,
        unions: [],
        settings: {},
      }
      expect(() => validateBuilderState(state)).toThrow(SqlBuilderError)
      expect(() => validateBuilderState(state)).toThrow(
        'OFFSET must be a non-negative number'
      )
    })

    it('should throw for non-integer OFFSET', () => {
      const state: BuilderState = {
        ctes: [],
        columns: ['id'],
        from: { table: 'users' },
        joins: [],
        wheres: [],
        groupBy: [],
        having: [],
        orderBy: [],
        limit: 10,
        offset: 2.5,
        unions: [],
        settings: {},
      }
      expect(() => validateBuilderState(state)).toThrow(SqlBuilderError)
      expect(() => validateBuilderState(state)).toThrow(
        'OFFSET must be an integer'
      )
    })
  })

  describe('CTE validation', () => {
    it('should throw for duplicate CTE names', () => {
      const cteQuery = sql().select('id').from('users')
      const state: BuilderState = {
        ctes: [
          { name: 'dup', query: cteQuery },
          { name: 'dup', query: cteQuery },
        ],
        columns: ['id'],
        from: { table: 'dup' },
        joins: [],
        wheres: [],
        groupBy: [],
        having: [],
        orderBy: [],
        unions: [],
        settings: {},
      }
      expect(() => validateBuilderState(state)).toThrow(SqlBuilderError)
      expect(() => validateBuilderState(state)).toThrow(
        'Duplicate CTE name: dup'
      )
    })

    it('should throw for invalid CTE name starting with number', () => {
      const cteQuery = sql().select('id').from('users')
      const state: BuilderState = {
        ctes: [{ name: '123abc', query: cteQuery }],
        columns: ['id'],
        from: { table: '123abc' },
        joins: [],
        wheres: [],
        groupBy: [],
        having: [],
        orderBy: [],
        unions: [],
        settings: {},
      }
      expect(() => validateBuilderState(state)).toThrow(SqlBuilderError)
      expect(() => validateBuilderState(state)).toThrow('Invalid CTE name')
    })

    it('should throw for CTE name with special characters', () => {
      const cteQuery = sql().select('id').from('users')
      const state: BuilderState = {
        ctes: [{ name: 'my-cte', query: cteQuery }],
        columns: ['id'],
        from: { table: 'my-cte' },
        joins: [],
        wheres: [],
        groupBy: [],
        having: [],
        orderBy: [],
        unions: [],
        settings: {},
      }
      expect(() => validateBuilderState(state)).toThrow(SqlBuilderError)
    })

    it('should accept valid CTE names with underscores', () => {
      const cteQuery = sql().select('id').from('users')
      const state: BuilderState = {
        ctes: [{ name: 'my_cte', query: cteQuery }],
        columns: ['id'],
        from: { table: 'my_cte' },
        joins: [],
        wheres: [],
        groupBy: [],
        having: [],
        orderBy: [],
        unions: [],
        settings: {},
      }
      expect(() => validateBuilderState(state)).not.toThrow()
    })

    it('should accept CTE names starting with underscore', () => {
      const cteQuery = sql().select('id').from('users')
      const state: BuilderState = {
        ctes: [{ name: '_private', query: cteQuery }],
        columns: ['id'],
        from: { table: '_private' },
        joins: [],
        wheres: [],
        groupBy: [],
        having: [],
        orderBy: [],
        unions: [],
        settings: {},
      }
      expect(() => validateBuilderState(state)).not.toThrow()
    })

    it('should throw for CTE with no query', () => {
      const state: BuilderState = {
        ctes: [{ name: 'broken', query: null as any }],
        columns: ['id'],
        from: { table: 'broken' },
        joins: [],
        wheres: [],
        groupBy: [],
        having: [],
        orderBy: [],
        unions: [],
        settings: {},
      }
      expect(() => validateBuilderState(state)).toThrow(SqlBuilderError)
      expect(() => validateBuilderState(state)).toThrow('has no query defined')
    })
  })

  describe('JOIN validation', () => {
    it('should throw for duplicate JOIN aliases', () => {
      const state: BuilderState = {
        ctes: [],
        columns: ['id'],
        from: { table: 'users', alias: 'u' },
        joins: [
          {
            type: 'INNER',
            table: 'orders',
            alias: 'o',
            condition: 'o.user_id = u.id',
          },
          {
            type: 'LEFT',
            table: 'profiles',
            alias: 'o',
            condition: 'o.user_id = u.id',
          },
        ],
        wheres: [],
        groupBy: [],
        having: [],
        orderBy: [],
        unions: [],
        settings: {},
      }
      expect(() => validateBuilderState(state)).toThrow(SqlBuilderError)
      expect(() => validateBuilderState(state)).toThrow(
        'Duplicate JOIN alias: o'
      )
    })

    it('should throw for JOIN without condition or USING', () => {
      const state: BuilderState = {
        ctes: [],
        columns: ['id'],
        from: { table: 'users', alias: 'u' },
        joins: [{ type: 'INNER', table: 'orders', alias: 'o' }],
        wheres: [],
        groupBy: [],
        having: [],
        orderBy: [],
        unions: [],
        settings: {},
      }
      expect(() => validateBuilderState(state)).toThrow(SqlBuilderError)
      expect(() => validateBuilderState(state)).toThrow(
        'requires either ON condition or USING clause'
      )
    })

    it('should throw for JOIN with empty USING', () => {
      const state: BuilderState = {
        ctes: [],
        columns: ['id'],
        from: { table: 'users', alias: 'u' },
        joins: [{ type: 'INNER', table: 'orders', alias: 'o', using: [] }],
        wheres: [],
        groupBy: [],
        having: [],
        orderBy: [],
        unions: [],
        settings: {},
      }
      expect(() => validateBuilderState(state)).toThrow(SqlBuilderError)
    })

    it('should throw for JOIN with both condition and USING', () => {
      const state: BuilderState = {
        ctes: [],
        columns: ['id'],
        from: { table: 'users', alias: 'u' },
        joins: [
          {
            type: 'INNER',
            table: 'orders',
            alias: 'o',
            condition: 'x',
            using: ['y'],
          },
        ],
        wheres: [],
        groupBy: [],
        having: [],
        orderBy: [],
        unions: [],
        settings: {},
      }
      expect(() => validateBuilderState(state)).toThrow(SqlBuilderError)
      expect(() => validateBuilderState(state)).toThrow('both ON and USING')
    })

    it('should accept CROSS JOIN without condition', () => {
      const state: BuilderState = {
        ctes: [],
        columns: ['id'],
        from: { table: 'users', alias: 'u' },
        joins: [{ type: 'CROSS', table: 'roles', alias: 'r' }],
        wheres: [],
        groupBy: [],
        having: [],
        orderBy: [],
        unions: [],
        settings: {},
      }
      expect(() => validateBuilderState(state)).not.toThrow()
    })

    it('should accept ARRAY JOIN without condition', () => {
      const state: BuilderState = {
        ctes: [],
        columns: ['id'],
        from: { table: 'events' },
        joins: [{ type: 'ARRAY', table: 'tags' }],
        wheres: [],
        groupBy: [],
        having: [],
        orderBy: [],
        unions: [],
        settings: {},
      }
      expect(() => validateBuilderState(state)).not.toThrow()
    })

    it('should throw for empty table name in JOIN', () => {
      const state: BuilderState = {
        ctes: [],
        columns: ['id'],
        from: { table: 'users', alias: 'u' },
        joins: [{ type: 'INNER', table: '  ', alias: 'o', condition: 'x' }],
        wheres: [],
        groupBy: [],
        having: [],
        orderBy: [],
        unions: [],
        settings: {},
      }
      expect(() => validateBuilderState(state)).toThrow(SqlBuilderError)
      expect(() => validateBuilderState(state)).toThrow(
        'JOIN table name cannot be empty'
      )
    })

    it('should accept JOIN without alias', () => {
      const state: BuilderState = {
        ctes: [],
        columns: ['id'],
        from: { table: 'users' },
        joins: [
          {
            type: 'INNER',
            table: 'orders',
            condition: 'orders.user_id = users.id',
          },
        ],
        wheres: [],
        groupBy: [],
        having: [],
        orderBy: [],
        unions: [],
        settings: {},
      }
      expect(() => validateBuilderState(state)).not.toThrow()
    })

    it('should accept multiple JOINs with different aliases', () => {
      const state: BuilderState = {
        ctes: [],
        columns: ['id'],
        from: { table: 'users', alias: 'u' },
        joins: [
          {
            type: 'INNER',
            table: 'orders',
            alias: 'o',
            condition: 'o.user_id = u.id',
          },
          {
            type: 'LEFT',
            table: 'profiles',
            alias: 'p',
            condition: 'p.user_id = u.id',
          },
        ],
        wheres: [],
        groupBy: [],
        having: [],
        orderBy: [],
        unions: [],
        settings: {},
      }
      expect(() => validateBuilderState(state)).not.toThrow()
    })
  })

  describe('condition validation', () => {
    it('should throw for empty column in WHERE condition', () => {
      const state: BuilderState = {
        ctes: [],
        columns: ['id'],
        from: { table: 'users' },
        joins: [],
        wheres: [{ column: '', operator: '=', value: 1, type: 'and' }],
        groupBy: [],
        having: [],
        orderBy: [],
        unions: [],
        settings: {},
      }
      expect(() => validateBuilderState(state)).toThrow(SqlBuilderError)
      expect(() => validateBuilderState(state)).toThrow(
        'must have a column name'
      )
    })

    it('should throw for whitespace-only column in WHERE', () => {
      const state: BuilderState = {
        ctes: [],
        columns: ['id'],
        from: { table: 'users' },
        joins: [],
        wheres: [{ column: '  ', operator: '=', value: 1, type: 'and' }],
        groupBy: [],
        having: [],
        orderBy: [],
        unions: [],
        settings: {},
      }
      expect(() => validateBuilderState(state)).toThrow(SqlBuilderError)
    })

    it('should throw for empty operator in WHERE condition', () => {
      const state: BuilderState = {
        ctes: [],
        columns: ['id'],
        from: { table: 'users' },
        joins: [],
        wheres: [{ column: 'col', operator: '', value: 1, type: 'and' }],
        groupBy: [],
        having: [],
        orderBy: [],
        unions: [],
        settings: {},
      }
      expect(() => validateBuilderState(state)).toThrow(SqlBuilderError)
      expect(() => validateBuilderState(state)).toThrow('must have an operator')
    })

    it('should throw for invalid operator in WHERE', () => {
      const state: BuilderState = {
        ctes: [],
        columns: ['id'],
        from: { table: 'users' },
        joins: [],
        wheres: [{ column: 'col', operator: 'INVALID', value: 1, type: 'and' }],
        groupBy: [],
        having: [],
        orderBy: [],
        unions: [],
        settings: {},
      }
      expect(() => validateBuilderState(state)).toThrow(SqlBuilderError)
      expect(() => validateBuilderState(state)).toThrow(
        'Invalid WHERE operator'
      )
    })

    it('should throw for IS with non-null value', () => {
      const state: BuilderState = {
        ctes: [],
        columns: ['id'],
        from: { table: 'users' },
        joins: [],
        wheres: [{ column: 'col', operator: 'IS', value: 42, type: 'and' }],
        groupBy: [],
        having: [],
        orderBy: [],
        unions: [],
        settings: {},
      }
      expect(() => validateBuilderState(state)).toThrow(SqlBuilderError)
      expect(() => validateBuilderState(state)).toThrow(
        'IS operator requires NULL value'
      )
    })

    it('should throw for IS NOT with non-null value', () => {
      const state: BuilderState = {
        ctes: [],
        columns: ['id'],
        from: { table: 'users' },
        joins: [],
        wheres: [
          { column: 'col', operator: 'IS NOT', value: 'test', type: 'and' },
        ],
        groupBy: [],
        having: [],
        orderBy: [],
        unions: [],
        settings: {},
      }
      expect(() => validateBuilderState(state)).toThrow(SqlBuilderError)
    })

    it('should accept IS with null value', () => {
      const state: BuilderState = {
        ctes: [],
        columns: ['id'],
        from: { table: 'users' },
        joins: [],
        wheres: [{ column: 'col', operator: 'IS', value: null, type: 'and' }],
        groupBy: [],
        having: [],
        orderBy: [],
        unions: [],
        settings: {},
      }
      expect(() => validateBuilderState(state)).not.toThrow()
    })

    it('should accept IS NOT with null value', () => {
      const state: BuilderState = {
        ctes: [],
        columns: ['id'],
        from: { table: 'users' },
        joins: [],
        wheres: [
          { column: 'col', operator: 'IS NOT', value: null, type: 'and' },
        ],
        groupBy: [],
        having: [],
        orderBy: [],
        unions: [],
        settings: {},
      }
      expect(() => validateBuilderState(state)).not.toThrow()
    })

    it('should validate HAVING conditions', () => {
      const state: BuilderState = {
        ctes: [],
        columns: ['id'],
        from: { table: 'users' },
        joins: [],
        wheres: [],
        groupBy: ['id'],
        having: [{ column: '', operator: '=', value: 1, type: 'and' }],
        orderBy: [],
        unions: [],
        settings: {},
      }
      expect(() => validateBuilderState(state)).toThrow(SqlBuilderError)
    })
  })

  describe('condition group validation', () => {
    it('should throw for empty WHERE group', () => {
      const state: BuilderState = {
        ctes: [],
        columns: ['id'],
        from: { table: 'users' },
        joins: [],
        wheres: [{ conditions: [], type: 'and' }],
        groupBy: [],
        having: [],
        orderBy: [],
        unions: [],
        settings: {},
      }
      expect(() => validateBuilderState(state)).toThrow(SqlBuilderError)
      expect(() => validateBuilderState(state)).toThrow('group cannot be empty')
    })

    it('should throw for empty HAVING group', () => {
      const state: BuilderState = {
        ctes: [],
        columns: ['id'],
        from: { table: 'users' },
        joins: [],
        wheres: [],
        groupBy: ['id'],
        having: [{ conditions: [], type: 'and' }],
        orderBy: [],
        unions: [],
        settings: {},
      }
      expect(() => validateBuilderState(state)).toThrow(SqlBuilderError)
    })

    it('should accept non-empty WHERE group', () => {
      const state: BuilderState = {
        ctes: [],
        columns: ['id'],
        from: { table: 'users' },
        joins: [],
        wheres: [
          {
            conditions: [
              { column: 'a', operator: '=', value: 1, type: 'and' },
              { column: 'b', operator: '=', value: 2, type: 'or' },
            ],
            type: 'and',
          },
        ],
        groupBy: [],
        having: [],
        orderBy: [],
        unions: [],
        settings: {},
      }
      expect(() => validateBuilderState(state)).not.toThrow()
    })
  })

  describe('UNION validation', () => {
    it('should throw for invalid UNION query', () => {
      const state: BuilderState = {
        ctes: [],
        columns: ['id'],
        from: { table: 'users' },
        joins: [],
        wheres: [],
        groupBy: [],
        having: [],
        orderBy: [],
        unions: [{ query: null as any, all: false }],
        settings: {},
      }
      expect(() => validateBuilderState(state)).toThrow(SqlBuilderError)
      expect(() => validateBuilderState(state)).toThrow('Invalid UNION query')
    })

    it('should accept valid UNION queries', () => {
      const unionQuery = sql().select('id').from('admins')
      const state: BuilderState = {
        ctes: [],
        columns: ['id'],
        from: { table: 'users' },
        joins: [],
        wheres: [],
        groupBy: [],
        having: [],
        orderBy: [],
        unions: [{ query: unionQuery, all: false }],
        settings: {},
      }
      expect(() => validateBuilderState(state)).not.toThrow()
    })
  })

  describe('ILIKE operator', () => {
    it('should accept ILIKE operator', () => {
      const state: BuilderState = {
        ctes: [],
        columns: ['id'],
        from: { table: 'users' },
        joins: [],
        wheres: [
          { column: 'name', operator: 'ILIKE', value: '%test%', type: 'and' },
        ],
        groupBy: [],
        having: [],
        orderBy: [],
        unions: [],
        settings: {},
      }
      expect(() => validateBuilderState(state)).not.toThrow()
    })

    it('should accept NOT ILIKE operator', () => {
      const state: BuilderState = {
        ctes: [],
        columns: ['id'],
        from: { table: 'users' },
        joins: [],
        wheres: [
          {
            column: 'name',
            operator: 'NOT ILIKE',
            value: '%test%',
            type: 'and',
          },
        ],
        groupBy: [],
        having: [],
        orderBy: [],
        unions: [],
        settings: {},
      }
      expect(() => validateBuilderState(state)).not.toThrow()
    })
  })

  describe('BETWEEN operator', () => {
    it('should accept BETWEEN operator', () => {
      const state: BuilderState = {
        ctes: [],
        columns: ['id'],
        from: { table: 'users' },
        joins: [],
        wheres: [
          {
            column: 'age',
            operator: 'BETWEEN',
            value: '18 AND 65',
            type: 'and',
          },
        ],
        groupBy: [],
        having: [],
        orderBy: [],
        unions: [],
        settings: {},
      }
      expect(() => validateBuilderState(state)).not.toThrow()
    })

    it('should accept NOT BETWEEN operator', () => {
      const state: BuilderState = {
        ctes: [],
        columns: ['id'],
        from: { table: 'users' },
        joins: [],
        wheres: [
          {
            column: 'age',
            operator: 'NOT BETWEEN',
            value: '1 AND 17',
            type: 'and',
          },
        ],
        groupBy: [],
        having: [],
        orderBy: [],
        unions: [],
        settings: {},
      }
      expect(() => validateBuilderState(state)).not.toThrow()
    })
  })
})
