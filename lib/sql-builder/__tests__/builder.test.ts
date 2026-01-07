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
  })
})
