/**
 * SQL Builder Tests
 *
 * Tests for the immutable SQL query builder.
 */

import { col, raw, SqlBuilderError, sql } from '../index'
import { describe, expect, it } from 'bun:test'

describe('SqlBuilder', () => {
  describe('Basic SELECT queries', () => {
    it('builds simple SELECT query', () => {
      const query = sql().select('id', 'name').from('users').build()
      expect(query).toBe('SELECT id, name FROM users')
    })

    it('builds SELECT * query', () => {
      const query = sql().select('*').from('users').build()
      expect(query).toBe('SELECT * FROM users')
    })

    it('allows flexible ordering of select/from', () => {
      const query1 = sql().select('id').from('users').build()
      const query2 = sql().from('users').select('id').build()
      expect(query1).toBe(query2)
    })

    it('builds SELECT with many columns', () => {
      const query = sql().select('a', 'b', 'c', 'd', 'e').from('t').build()
      expect(query).toBe('SELECT a, b, c, d, e FROM t')
    })

    it('builds SELECT with no columns when only from is set then select added', () => {
      const base = sql().from('users')
      expect(() => base.build()).toThrow()
      const query = base.select('id').build()
      expect(query).toBe('SELECT id FROM users')
    })
  })

  describe('WHERE clauses', () => {
    it('builds simple WHERE condition', () => {
      const query = sql()
        .select('*')
        .from('users')
        .where('age', '>', 18)
        .build()
      expect(query).toBe('SELECT * FROM users WHERE age > 18')
    })

    it('builds multiple AND conditions', () => {
      const query = sql()
        .select('*')
        .from('users')
        .where('age', '>', 18)
        .where('status', '=', 'active')
        .build()
      expect(query).toBe(
        "SELECT * FROM users WHERE age > 18 AND status = 'active'"
      )
    })

    it('builds OR conditions', () => {
      const query = sql()
        .select('*')
        .from('users')
        .where('age', '>', 18)
        .orWhere('vip', '=', true)
        .build()
      expect(query).toBe('SELECT * FROM users WHERE age > 18 OR vip = 1')
    })

    it('builds grouped WHERE conditions', () => {
      const query = sql()
        .select('*')
        .from('users')
        .where('status', '=', 'active')
        .where((q) => q.where('age', '>', 18).orWhere('vip', '=', true))
        .build()
      expect(query).toBe(
        "SELECT * FROM users WHERE status = 'active' AND (age > 18 OR vip = 1)"
      )
    })

    it('builds raw WHERE conditions', () => {
      const query = sql()
        .select('*')
        .from('users')
        .whereRaw('age > 18 AND status = "active"')
        .build()
      expect(query).toBe(
        'SELECT * FROM users WHERE age > 18 AND status = "active"'
      )
    })

    it('returns same builder when group function produces no conditions', () => {
      const query = sql()
        .select('*')
        .from('users')
        .where((q) => q)
        .build()
      expect(query).toBe('SELECT * FROM users')
    })

    it('throws when where called without operator and value', () => {
      expect(() => {
        sql()
          .select('*')
          .from('users')
          .where('age' as any)
      }).toThrow('WHERE clause requires column, operator, and value')
    })

    it('builds WHERE with null value', () => {
      const query = sql()
        .select('*')
        .from('users')
        .where('deleted_at', 'IS', null)
        .build()
      expect(query).toBe('SELECT * FROM users WHERE deleted_at IS NULL')
    })

    it('builds WHERE with boolean false value', () => {
      const query = sql()
        .select('*')
        .from('users')
        .where('active', '=', false)
        .build()
      expect(query).toBe('SELECT * FROM users WHERE active = 0')
    })

    it('builds WHERE with numeric value', () => {
      const query = sql().select('*').from('users').where('id', '=', 42).build()
      expect(query).toBe('SELECT * FROM users WHERE id = 42')
    })

    it('escapes single quotes in string values', () => {
      const query = sql()
        .select('*')
        .from('users')
        .where('name', '=', "O'Brien")
        .build()
      expect(query).toBe("SELECT * FROM users WHERE name = 'O''Brien'")
    })

    it('builds WHERE with IN operator using raw value', () => {
      const query = sql()
        .select('*')
        .from('users')
        .whereRaw("status IN ('active', 'pending')")
        .build()
      expect(query).toBe(
        "SELECT * FROM users WHERE status IN ('active', 'pending')"
      )
    })

    it('builds multiple OR conditions', () => {
      const query = sql()
        .select('*')
        .from('users')
        .where('a', '=', 1)
        .orWhere('b', '=', 2)
        .orWhere('c', '=', 3)
        .build()
      expect(query).toBe('SELECT * FROM users WHERE a = 1 OR b = 2 OR c = 3')
    })
  })

  describe('JOINs', () => {
    it('builds INNER JOIN', () => {
      const query = sql()
        .select('u.id', 'o.total')
        .from('users', 'u')
        .join('orders', 'o', 'o.user_id = u.id')
        .build()
      expect(query).toBe(
        'SELECT u.id, o.total FROM users AS u INNER JOIN orders AS o ON o.user_id = u.id'
      )
    })

    it('builds LEFT JOIN', () => {
      const query = sql()
        .select('*')
        .from('users', 'u')
        .leftJoin('orders', 'o', 'o.user_id = u.id')
        .build()
      expect(query).toBe(
        'SELECT * FROM users AS u LEFT JOIN orders AS o ON o.user_id = u.id'
      )
    })

    it('builds JOIN with USING', () => {
      const query = sql()
        .select('*')
        .from('users', 'u')
        .join('orders', 'o', { using: ['user_id'] })
        .build()
      expect(query).toBe(
        'SELECT * FROM users AS u INNER JOIN orders AS o USING (user_id)'
      )
    })

    it('builds RIGHT JOIN', () => {
      const query = sql()
        .select('*')
        .from('users', 'u')
        .rightJoin('orders', 'o', 'o.user_id = u.id')
        .build()
      expect(query).toBe(
        'SELECT * FROM users AS u RIGHT JOIN orders AS o ON o.user_id = u.id'
      )
    })

    it('builds FULL JOIN', () => {
      const query = sql()
        .select('*')
        .from('users', 'u')
        .fullJoin('orders', 'o', 'o.user_id = u.id')
        .build()
      expect(query).toBe(
        'SELECT * FROM users AS u FULL JOIN orders AS o ON o.user_id = u.id'
      )
    })

    it('builds multiple JOINs', () => {
      const query = sql()
        .select('*')
        .from('users', 'u')
        .join('orders', 'o', 'o.user_id = u.id')
        .leftJoin('profiles', 'p', 'p.user_id = u.id')
        .build()
      expect(query).toContain('INNER JOIN orders AS o ON o.user_id = u.id')
      expect(query).toContain('LEFT JOIN profiles AS p ON p.user_id = u.id')
    })

    it('builds JOIN with subquery', () => {
      const sub = sql()
        .select('user_id', 'count()')
        .from('orders')
        .groupBy('user_id')
      const query = sql()
        .select('*')
        .from('users', 'u')
        .join(sub, 'o', 'o.user_id = u.id')
        .build()
      expect(query).toContain(
        'INNER JOIN (SELECT user_id, count() FROM orders GROUP BY user_id) AS o'
      )
    })
  })

  describe('GROUP BY and HAVING', () => {
    it('builds GROUP BY', () => {
      const query = sql()
        .select('user_id', 'COUNT(*)')
        .from('orders')
        .groupBy('user_id')
        .build()
      expect(query).toBe(
        'SELECT user_id, COUNT(*) FROM orders GROUP BY user_id'
      )
    })

    it('builds GROUP BY with multiple columns', () => {
      const query = sql()
        .select('user_id', 'date')
        .from('orders')
        .groupBy('user_id', 'date')
        .build()
      expect(query).toBe(
        'SELECT user_id, date FROM orders GROUP BY user_id, date'
      )
    })

    it('builds HAVING', () => {
      const query = sql()
        .select('user_id', 'COUNT(*)')
        .from('orders')
        .groupBy('user_id')
        .having('COUNT(*)', '>', 5)
        .build()
      expect(query).toBe(
        'SELECT user_id, COUNT(*) FROM orders GROUP BY user_id HAVING COUNT(*) > 5'
      )
    })

    it('builds HAVING with grouped conditions', () => {
      const query = sql()
        .select('user_id', 'count()')
        .from('orders')
        .groupBy('user_id')
        .having((q) => q.where('count()', '>', 5).orWhere('count()', '<', 2))
        .build()
      expect(query).toContain('HAVING (count() > 5 OR count() < 2)')
    })

    it('builds raw HAVING', () => {
      const query = sql()
        .select('user_id', 'count()')
        .from('orders')
        .groupBy('user_id')
        .havingRaw('count() > 10')
        .build()
      expect(query).toContain('HAVING count() > 10')
    })

    it('returns same builder when having group produces no conditions', () => {
      const query = sql()
        .select('user_id', 'count()')
        .from('orders')
        .groupBy('user_id')
        .having((q) => q)
        .build()
      expect(query).toBe('SELECT user_id, count() FROM orders GROUP BY user_id')
    })

    it('throws for HAVING without GROUP BY', () => {
      expect(() => {
        sql()
          .select('COUNT(*)')
          .from('users')
          .having('COUNT(*)', '>', 5)
          .build()
      }).toThrow(SqlBuilderError)
    })

    it('throws when having called without operator and value', () => {
      expect(() => {
        sql()
          .select('count()')
          .from('orders')
          .groupBy('user_id')
          .having('count()' as any)
      }).toThrow('HAVING clause requires column, operator, and value')
    })
  })

  describe('ORDER BY', () => {
    it('builds ORDER BY ASC', () => {
      const query = sql()
        .select('*')
        .from('users')
        .orderBy('created_at', 'ASC')
        .build()
      expect(query).toBe('SELECT * FROM users ORDER BY created_at ASC')
    })

    it('builds ORDER BY DESC', () => {
      const query = sql()
        .select('*')
        .from('users')
        .orderBy('created_at', 'DESC')
        .build()
      expect(query).toBe('SELECT * FROM users ORDER BY created_at DESC')
    })

    it('builds ORDER BY with NULLS', () => {
      const query = sql()
        .select('*')
        .from('users')
        .orderBy('updated_at', 'DESC', 'LAST')
        .build()
      expect(query).toBe(
        'SELECT * FROM users ORDER BY updated_at DESC NULLS LAST'
      )
    })

    it('builds raw ORDER BY', () => {
      const query = sql()
        .select('*')
        .from('users')
        .orderByRaw('created_at DESC NULLS FIRST')
        .build()
      expect(query).toBe(
        'SELECT * FROM users ORDER BY created_at DESC NULLS FIRST'
      )
    })

    it('builds ORDER BY with default direction', () => {
      const query = sql().select('*').from('users').orderBy('name').build()
      expect(query).toBe('SELECT * FROM users ORDER BY name ASC')
    })

    it('builds multiple ORDER BY clauses', () => {
      const query = sql()
        .select('*')
        .from('users')
        .orderBy('last_name', 'ASC')
        .orderBy('first_name', 'ASC')
        .build()
      expect(query).toBe(
        'SELECT * FROM users ORDER BY last_name ASC, first_name ASC'
      )
    })

    it('builds ORDER BY FIRST', () => {
      const query = sql()
        .select('*')
        .from('users')
        .orderBy('name', 'ASC', 'FIRST')
        .build()
      expect(query).toBe('SELECT * FROM users ORDER BY name ASC NULLS FIRST')
    })
  })

  describe('LIMIT and OFFSET', () => {
    it('builds LIMIT', () => {
      const query = sql().select('*').from('users').limit(10).build()
      expect(query).toBe('SELECT * FROM users LIMIT 10')
    })

    it('builds OFFSET', () => {
      const query = sql().select('*').from('users').limit(10).offset(20).build()
      expect(query).toBe('SELECT * FROM users LIMIT 10 OFFSET 20')
    })

    it('builds LIMIT 0', () => {
      const query = sql().select('*').from('users').limit(0).build()
      expect(query).toBe('SELECT * FROM users LIMIT 0')
    })

    it('throws error for negative LIMIT', () => {
      expect(() => {
        sql().select('*').from('users').limit(-1).build()
      }).toThrow(SqlBuilderError)
    })

    it('throws error for negative OFFSET', () => {
      expect(() => {
        sql().select('*').from('users').limit(10).offset(-5).build()
      }).toThrow(SqlBuilderError)
    })

    it('throws error for non-integer LIMIT', () => {
      expect(() => {
        sql().select('*').from('users').limit(1.5).build()
      }).toThrow(SqlBuilderError)
    })

    it('throws error for non-integer OFFSET', () => {
      expect(() => {
        sql().select('*').from('users').limit(10).offset(2.5).build()
      }).toThrow(SqlBuilderError)
    })
  })

  describe('CTEs (WITH)', () => {
    it('builds simple CTE', () => {
      const activeUsers = sql()
        .select('*')
        .from('users')
        .where('status', '=', 'active')
      const query = sql()
        .with('active_users', activeUsers)
        .select('*')
        .from('active_users')
        .build()
      expect(query).toBe(
        "WITH active_users AS (SELECT * FROM users WHERE status = 'active') SELECT * FROM active_users"
      )
    })

    it('builds multiple CTEs', () => {
      const cte1 = sql().select('id').from('users')
      const cte2 = sql().select('id').from('orders')
      const query = sql()
        .with('u', cte1)
        .with('o', cte2)
        .select('*')
        .from('u')
        .build()
      expect(query).toContain('WITH u AS (SELECT id FROM users),')
      expect(query).toContain('o AS (SELECT id FROM orders)')
    })
  })

  describe('UNION', () => {
    it('builds UNION', () => {
      const q1 = sql().select('id', 'name').from('users')
      const q2 = sql().select('id', 'name').from('admins')
      const query = q1.union(q2).build()
      expect(query).toBe(
        'SELECT id, name FROM users UNION SELECT id, name FROM admins'
      )
    })

    it('builds UNION ALL', () => {
      const q1 = sql().select('id').from('users')
      const q2 = sql().select('id').from('admins')
      const query = q1.unionAll(q2).build()
      expect(query).toBe('SELECT id FROM users UNION ALL SELECT id FROM admins')
    })

    it('builds multiple UNIONs', () => {
      const q1 = sql().select('id').from('users')
      const q2 = sql().select('id').from('admins')
      const q3 = sql().select('id').from('moderators')
      const query = q1.union(q2).union(q3).build()
      expect(query).toBe(
        'SELECT id FROM users UNION SELECT id FROM admins UNION SELECT id FROM moderators'
      )
    })
  })

  describe('ClickHouse specific features', () => {
    it('builds SETTINGS clause', () => {
      const query = sql()
        .select('*')
        .from('users')
        .settings({ max_execution_time: 60 })
        .build()
      expect(query).toBe('SELECT * FROM users SETTINGS max_execution_time = 60')
    })

    it('builds multiple SETTINGS', () => {
      const query = sql()
        .select('*')
        .from('users')
        .settings({ max_execution_time: 60, max_rows_to_read: 1000 })
        .build()
      expect(query).toContain('SETTINGS')
      expect(query).toContain('max_execution_time = 60')
      expect(query).toContain('max_rows_to_read = 1000')
    })

    it('builds FORMAT clause', () => {
      const query = sql()
        .select('*')
        .from('users')
        .format('JSONEachRow')
        .build()
      expect(query).toBe('SELECT * FROM users FORMAT JSONEachRow')
    })

    it('builds ARRAY JOIN', () => {
      const query = sql().select('*').from('events').arrayJoin('tags').build()
      expect(query).toBe('SELECT * FROM events ARRAY JOIN tags')
    })

    it('builds FORMAT with SETTINGS', () => {
      const query = sql()
        .select('*')
        .from('users')
        .settings({ max_execution_time: 30 })
        .format('JSON')
        .build()
      expect(query).toContain('SETTINGS max_execution_time = 30')
      expect(query).toContain('FORMAT JSON')
    })

    it('builds settings with string value', () => {
      const query = sql()
        .select('*')
        .from('t')
        .settings({ load_balancing: 'random' })
        .build()
      expect(query).toContain("load_balancing = 'random'")
    })
  })

  describe('FROM clause', () => {
    it('builds FROM with alias', () => {
      const query = sql().select('*').from('users', 'u').build()
      expect(query).toBe('SELECT * FROM users AS u')
    })

    it('builds FROM with subquery', () => {
      const sub = sql().select('id').from('users')
      const query = sql().select('*').from(sub, 'sub').build()
      expect(query).toBe('SELECT * FROM (SELECT id FROM users) AS sub')
    })

    it('builds FROM with subquery without alias', () => {
      const sub = sql().select('id').from('users')
      const query = sql().select('*').from(sub).build()
      expect(query).toBe('SELECT * FROM (SELECT id FROM users)')
    })
  })

  describe('Raw SQL', () => {
    it('builds raw SELECT expressions', () => {
      const query = sql()
        .selectRaw('COUNT(DISTINCT user_id) as users')
        .from('orders')
        .build()
      expect(query).toBe('SELECT COUNT(DISTINCT user_id) as users FROM orders')
    })

    it('mixes regular and raw SELECT', () => {
      const query = sql()
        .select('id')
        .selectRaw('COUNT(*) as total')
        .from('orders')
        .build()
      expect(query).toBe('SELECT id, COUNT(*) as total FROM orders')
    })

    it('uses raw in select multiple times', () => {
      const query = sql()
        .selectRaw('a + b')
        .selectRaw('c * d')
        .from('data')
        .build()
      expect(query).toBe('SELECT a + b, c * d FROM data')
    })
  })

  describe('buildPretty()', () => {
    it('formats query with newlines', () => {
      const query = sql()
        .select('id', 'name')
        .from('users')
        .where('status', '=', 'active')
        .orderBy('created_at', 'DESC')
        .limit(10)
        .buildPretty()

      expect(query).toContain('\n')
      expect(query).toMatch(/SELECT id, name\nFROM users/)
    })

    it('formats complex query with all clauses', () => {
      const query = sql()
        .select('user_id', 'count()')
        .from('orders')
        .join('users', 'u', 'u.id = orders.user_id')
        .where('status', '=', 'active')
        .groupBy('user_id')
        .having('count()', '>', 5)
        .orderBy('count()', 'DESC')
        .limit(10)
        .offset(20)
        .settings({ max_execution_time: 60 })
        .format('JSONEachRow')
        .buildPretty()

      expect(query).toContain('\n')
      expect(query).toContain('SELECT')
      expect(query).toContain('FROM')
      expect(query).toContain('INNER JOIN')
      expect(query).toContain('WHERE')
      expect(query).toContain('GROUP BY')
      expect(query).toContain('HAVING')
      expect(query).toContain('ORDER BY')
      expect(query).toContain('LIMIT')
      expect(query).toContain('OFFSET')
      expect(query).toContain('SETTINGS')
      expect(query).toContain('FORMAT')
    })
  })

  describe('Immutability', () => {
    it('does not mutate original builder', () => {
      const base = sql().select('id').from('users')
      const query1 = base.where('status', '=', 'active').build()
      const query2 = base.where('role', '=', 'admin').build()

      expect(query1).toBe("SELECT id FROM users WHERE status = 'active'")
      expect(query2).toBe("SELECT id FROM users WHERE role = 'admin'")
      expect(query1).not.toBe(query2)
    })

    it('does not mutate state when chaining methods', () => {
      const base = sql().select('id').from('users')
      const withWhere = base.where('a', '=', 1)
      const withLimit = withWhere.limit(10)

      // Base should not have where or limit
      const baseQuery = base.build()
      expect(baseQuery).toBe('SELECT id FROM users')

      // withWhere should not have limit
      const whereQuery = withWhere.build()
      expect(whereQuery).toBe('SELECT id FROM users WHERE a = 1')
      expect(whereQuery).not.toContain('LIMIT')

      // withLimit should have both
      const limitQuery = withLimit.build()
      expect(limitQuery).toBe('SELECT id FROM users WHERE a = 1 LIMIT 10')
    })
  })

  describe('Validation', () => {
    it('throws error without FROM clause', () => {
      expect(() => {
        sql().select('id').build()
      }).toThrow(SqlBuilderError)
    })

    it('throws error without SELECT clause', () => {
      expect(() => {
        sql().from('users').build()
      }).toThrow(SqlBuilderError)
    })

    it('throws error for HAVING without GROUP BY', () => {
      expect(() => {
        sql()
          .select('COUNT(*)')
          .from('users')
          .having('COUNT(*)', '>', 5)
          .build()
      }).toThrow(SqlBuilderError)
    })

    it('throws error for negative LIMIT', () => {
      expect(() => {
        sql().select('*').from('users').limit(-1).build()
      }).toThrow(SqlBuilderError)
    })

    it('throws error for duplicate CTE names', () => {
      const cte = sql().select('id').from('users')
      expect(() => {
        sql().with('x', cte).with('x', cte).select('*').from('x').build()
      }).toThrow(SqlBuilderError)
    })

    it('throws error for invalid CTE name', () => {
      const cte = sql().select('id').from('users')
      expect(() => {
        sql().with('123bad', cte).select('*').from('x').build()
      }).toThrow(SqlBuilderError)
    })

    it('throws error for duplicate JOIN aliases', () => {
      expect(() => {
        sql()
          .select('*')
          .from('users', 'u')
          .join('orders', 'o', 'o.user_id = u.id')
          .join('profiles', 'o', 'o.user_id = u.id')
          .build()
      }).toThrow(SqlBuilderError)
    })

    it('throws error for JOIN without condition', () => {
      expect(() => {
        sql().select('*').from('users', 'u').join('orders', 'o').build()
      }).toThrow(SqlBuilderError)
    })

    it('throws error for JOIN with both ON and USING', () => {
      // The builder API doesn't allow both, but let's test validation
      const builder = sql().select('*').from('users', 'u')
      // Manually craft invalid state
      const badState = {
        ...builder.state,
        joins: [
          {
            type: 'INNER',
            table: 'orders',
            alias: 'o',
            condition: 'o.user_id = u.id',
            using: ['user_id'],
          },
        ],
      }
      expect(() => {
        const { validateBuilderState } = require('../validator')
        validateBuilderState(badState)
      }).toThrow(SqlBuilderError)
    })

    it('throws error for empty JOIN table name', () => {
      const builder = sql().select('*').from('users', 'u')
      const badState = {
        ...builder.state,
        joins: [{ type: 'INNER', table: '  ', alias: 'o', condition: 'x' }],
      }
      expect(() => {
        const { validateBuilderState } = require('../validator')
        validateBuilderState(badState)
      }).toThrow(SqlBuilderError)
    })
  })

  describe('Integration with col() and raw()', () => {
    it('uses ColumnBuilder in SELECT', () => {
      const query = sql()
        .select(col('bytes').readable().toSql())
        .from('query_log')
        .build()
      expect(query).toBe(
        'SELECT formatReadableSize(bytes) AS readable_bytes FROM query_log'
      )
    })

    it('uses raw() in SELECT', () => {
      const query = sql()
        .select(raw('x + y * 2').as('calculated').toSql())
        .from('data')
        .build()
      expect(query).toBe('SELECT (x + y * 2) AS calculated FROM data')
    })

    it('uses SqlFragment objects directly in select', () => {
      const query = sql().select(raw('a + b').as('sum')).from('data').build()
      expect(query).toBe('SELECT (a + b) AS sum FROM data')
    })

    it('uses ColumnBuilder objects directly in select', () => {
      const query = sql().select(col('bytes').readable()).from('data').build()
      expect(query).toBe(
        'SELECT formatReadableSize(bytes) AS readable_bytes FROM data'
      )
    })
  })

  describe('formatValue edge cases', () => {
    it('handles WHERE value of 0', () => {
      const query = sql()
        .select('*')
        .from('users')
        .where('is_deleted', '=', 0)
        .build()
      expect(query).toBe('SELECT * FROM users WHERE is_deleted = 0')
    })

    it('handles WHERE value of empty string', () => {
      const query = sql()
        .select('*')
        .from('users')
        .where('name', '=', '')
        .build()
      expect(query).toBe("SELECT * FROM users WHERE name = ''")
    })

    it('handles WHERE value with SqlFragment', () => {
      const query = sql()
        .select('*')
        .from('users')
        .where('name', '=', raw("'admin'"))
        .build()
      expect(query).toBe("SELECT * FROM users WHERE 'admin'")
    })
  })

  describe('extend()', () => {
    it('creates ExtendedBuilder from SqlBuilder', () => {
      const base = sql().select('id').from('users')
      const extended = base.extend()
      expect(extended).toBeDefined()
      expect(typeof extended.build).toBe('function')
    })

    it('ExtendedBuilder produces valid SQL', () => {
      const base = sql().select('id').from('users')
      const extended = base.extend().addColumn('name')
      expect(extended.build()).toContain('id, name')
    })
  })

  describe('constructor', () => {
    it('creates builder with default state', () => {
      const builder = sql()
      expect(builder.state.columns).toEqual([])
      expect(builder.state.joins).toEqual([])
      expect(builder.state.wheres).toEqual([])
      expect(builder.state.groupBy).toEqual([])
      expect(builder.state.having).toEqual([])
      expect(builder.state.orderBy).toEqual([])
      expect(builder.state.unions).toEqual([])
      expect(builder.state.settings).toEqual({})
      expect(builder.state.ctes).toEqual([])
    })

    it('creates builder with partial state', () => {
      const builder = new (require('../builder').SqlBuilder)({
        columns: ['id'],
        from: { table: 'users' },
      })
      expect(builder.state.columns).toEqual(['id'])
      expect(builder.state.from).toEqual({ table: 'users' })
    })
  })
})
