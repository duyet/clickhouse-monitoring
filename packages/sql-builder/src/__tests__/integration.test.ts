/**
 * Integration Tests
 *
 * Tests combining multiple builders together.
 */

import {
  col,
  fn,
  getAllSqlStrings,
  param,
  raw,
  SqlBuilderError,
  sql,
  validateBuilderState,
} from '../index'
import { describe, expect, it } from 'bun:test'

describe('SQL Builder Integration', () => {
  describe('column + function combinations', () => {
    it('should combine col with fn for readable size', () => {
      const manual = col('bytes').readable()
      const fromFn = `${fn.readableSize('bytes')} AS readable_bytes`

      expect(manual.toSql()).toBe(fromFn)
    })

    it('should combine col with fn for pctOfMax', () => {
      const manual = col('elapsed').pctOfMax()
      const fromFn = `${fn.pctOfMax('elapsed')} AS pct_elapsed`

      expect(manual.toSql()).toBe(fromFn)
    })

    it('should combine col with fn for quantity', () => {
      const manual = col('rows').quantity()
      const fromFn = `${fn.readableQuantity('rows')} AS readable_rows`

      expect(manual.toSql()).toBe(fromFn)
    })

    it('should combine col with fn for timeDelta', () => {
      const manual = col('elapsed').timeDelta()
      const fromFn = `${fn.readableTimeDelta('elapsed')} AS readable_elapsed`

      expect(manual.toSql()).toBe(fromFn)
    })

    it('should combine col sum with fn sum', () => {
      const fromCol = col.sum('bytes').toSql()
      const fromFn = fn.sum('bytes')
      expect(fromCol).toBe(fromFn)
    })

    it('should combine col count with fn count', () => {
      const fromCol = col.count('user_id').toSql()
      const fromFn = fn.count('user_id')
      expect(fromCol).toBe(fromFn)
    })
  })

  describe('complex query patterns', () => {
    it('should build query with multiple column types', () => {
      const columns = [
        col('query_id'),
        col('user'),
        col('bytes').readable(),
        col('elapsed').pctOfMax(),
        col.sum('rows').as('total_rows'),
      ]

      const sqlStr = columns.map((c) => c.toSql()).join(',\n  ')
      expect(sqlStr).toBe(
        `query_id,
  user,
  formatReadableSize(bytes) AS readable_bytes,
  round(100 * elapsed / max(elapsed) OVER (), 2) AS pct_elapsed,
  sum(rows) AS total_rows`
      )
    })

    it('should build window function with partition', () => {
      const column = col('elapsed')
        .over({ partitionBy: 'user', orderBy: 'event_time DESC' })
        .as('elapsed_rank')

      expect(column.toSql()).toBe(
        'elapsed OVER (PARTITION BY user ORDER BY event_time DESC) AS elapsed_rank'
      )
    })

    it('should build full monitoring query', () => {
      const query = sql()
        .select(
          col('query_id'),
          col('user'),
          col('query_duration_ms').as('duration'),
          col('read_bytes').readable(),
          col('memory_usage').readable()
        )
        .from('system.processes')
        .where('is_cancelled', '=', 0)
        .orderBy('query_duration_ms', 'DESC')
        .limit(20)
        .build()

      expect(query).toContain('query_id')
      expect(query).toContain('user')
      expect(query).toContain(
        'formatReadableSize(read_bytes) AS readable_read_bytes'
      )
      expect(query).toContain(
        'formatReadableSize(memory_usage) AS readable_memory_usage'
      )
      expect(query).toContain('FROM system.processes')
      expect(query).toContain('is_cancelled = 0')
      expect(query).toContain('ORDER BY query_duration_ms DESC')
      expect(query).toContain('LIMIT 20')
    })
  })

  describe('raw SQL escape hatches', () => {
    it('should use raw for complex expressions', () => {
      const columns = [
        col('query_id'),
        raw("CASE WHEN bytes > 1000000 THEN 'large' ELSE 'small' END").as(
          'size_category'
        ),
        col('bytes').readable(),
      ]

      const sqlStr = columns.map((c) => c.toSql()).join(',\n  ')
      expect(sqlStr).toContain(
        "CASE WHEN bytes > 1000000 THEN 'large' ELSE 'small' END"
      )
      expect(sqlStr).toContain('formatReadableSize(bytes)')
    })

    it('should use raw in WHERE clause', () => {
      const query = sql()
        .select('*')
        .from('users')
        .whereRaw("status IN ('active', 'pending')")
        .build()

      expect(query).toContain("status IN ('active', 'pending')")
    })

    it('should use raw in ORDER BY', () => {
      const query = sql().select('*').from('users').orderByRaw('RAND()').build()

      expect(query).toContain('ORDER BY RAND()')
    })
  })

  describe('parameterized queries', () => {
    it('should build query with parameters', () => {
      const userParam = param('user', 'String')
      const limitParam = param('limit', 'UInt32')

      expect(userParam).toBe('{user:String}')
      expect(limitParam).toBe('{limit:UInt32}')

      // Simulated WHERE clause
      const where = `user = ${userParam} LIMIT ${limitParam}`
      expect(where).toBe('user = {user:String} LIMIT {limit:UInt32}')
    })

    it('should build parameterized query with multiple params', () => {
      const startParam = param('start', 'DateTime')
      const endParam = param('end', 'DateTime')

      const whereClause = `event_time >= ${startParam} AND event_time < ${endParam}`
      expect(whereClause).toBe(
        'event_time >= {start:DateTime} AND event_time < {end:DateTime}'
      )
    })
  })

  describe('real-world query examples', () => {
    it('should build query monitoring query', () => {
      const columns = [
        col('query_id'),
        col('user'),
        col('query_duration_ms').as('duration'),
        col('read_bytes').readable(),
        col('memory_usage').readable(),
        col('query_duration_ms').pctOfMax().as('pct_duration'),
      ]

      const sqlStr = `SELECT\n  ${columns.map((c) => c.toSql()).join(',\n  ')}`

      expect(sqlStr).toContain('query_id')
      expect(sqlStr).toContain(
        'formatReadableSize(read_bytes) AS readable_read_bytes'
      )
      expect(sqlStr).toContain(
        'round(100 * query_duration_ms / max(query_duration_ms) OVER (), 2) AS pct_duration'
      )
    })

    it('should build aggregation query', () => {
      const columns = [
        col('user'),
        col.count('query_id').as('query_count'),
        col.sum('read_bytes').as('total_bytes'),
        col.avg('query_duration_ms').as('avg_duration'),
        col.max('memory_usage').as('peak_memory'),
      ]

      const sqlStr = `SELECT\n  ${columns.map((c) => c.toSql()).join(',\n  ')}\nGROUP BY user`

      expect(sqlStr).toContain('count(query_id) AS query_count')
      expect(sqlStr).toContain('sum(read_bytes) AS total_bytes')
      expect(sqlStr).toContain('avg(query_duration_ms) AS avg_duration')
      expect(sqlStr).toContain('GROUP BY user')
    })

    it('should build profile events query', () => {
      const columns = [
        col('event_time'),
        raw(fn.profileEvent('Query')).as('queries'),
        raw(fn.profileEvent('SelectQuery')).as('select_queries'),
        raw(fn.profileEvent('InsertQuery')).as('insert_queries'),
      ]

      const sqlStr = columns.map((c) => c.toSql()).join(',\n  ')

      expect(sqlStr).toContain("(ProfileEvents['Query']) AS queries")
      expect(sqlStr).toContain(
        "(ProfileEvents['SelectQuery']) AS select_queries"
      )
    })

    it('should build versioned query config pattern', () => {
      // Simulate how query configs work with versioned SQL
      const sqls = [
        { since: '23.8', sql: 'SELECT query, user FROM system.query_log' },
        {
          since: '24.1',
          sql: 'SELECT query, user, peak_threads FROM system.query_log',
        },
      ]

      const allSql = getAllSqlStrings(sqls)
      expect(allSql).toHaveLength(2)
      expect(allSql[0]).not.toContain('peak_threads')
      expect(allSql[1]).toContain('peak_threads')
    })
  })

  describe('builder + validator integration', () => {
    it('should validate state from builder', () => {
      const builder = sql().select('id').from('users')
      expect(() => validateBuilderState(builder.state)).not.toThrow()
    })

    it('should throw on invalid builder state', () => {
      const builder = sql().select('id')
      expect(() => validateBuilderState(builder.state)).toThrow(SqlBuilderError)
    })

    it('should validate extended builder', () => {
      const base = sql().select('id').from('users')
      const extended = base
        .extend()
        .addColumn('name')
        .addWhere('active', '=', true)
      expect(() => extended.build()).not.toThrow()
    })

    it('should catch invalid extended builder', () => {
      const base = sql().select('id').from('users')
      const extended = base.extend().removeColumn('id')
      expect(() => extended.build()).toThrow(SqlBuilderError)
    })
  })

  describe('CTE with column helpers', () => {
    it('should build CTE with formatted columns', () => {
      const cte = sql()
        .select(col('user_id'), col.sum('bytes').as('total_bytes'))
        .from('orders')
        .groupBy('user_id')

      const query = sql()
        .with('user_totals', cte)
        .select('user_id', 'total_bytes')
        .from('user_totals')
        .orderBy('total_bytes', 'DESC')
        .limit(10)
        .build()

      expect(query).toContain('WITH user_totals AS (')
      expect(query).toContain('sum(bytes) AS total_bytes')
      expect(query).toContain('GROUP BY user_id')
      expect(query).toContain('ORDER BY total_bytes DESC')
    })
  })

  describe('UNION with different column types', () => {
    it('should UNION queries with column builders', () => {
      const activeUsers = sql()
        .select(col('id'), col('name'))
        .from('users')
        .where('status', '=', 'active')

      const adminUsers = sql().select(col('id'), col('name')).from('admins')

      const query = activeUsers.union(adminUsers).build()
      expect(query).toContain('UNION')
      expect(query).toContain('FROM users')
      expect(query).toContain('FROM admins')
    })
  })

  describe('export integrity', () => {
    it('should export all builders from index', () => {
      expect(col).toBeDefined()
      expect(fn).toBeDefined()
      expect(raw).toBeDefined()
      expect(param).toBeDefined()
      expect(sql).toBeDefined()
      expect(SqlBuilderError).toBeDefined()
      expect(validateBuilderState).toBeDefined()
      expect(getAllSqlStrings).toBeDefined()
    })

    it('should have col static methods', () => {
      expect(col.concat).toBeDefined()
      expect(col.sum).toBeDefined()
      expect(col.count).toBeDefined()
      expect(col.avg).toBeDefined()
      expect(col.max).toBeDefined()
      expect(col.min).toBeDefined()
    })

    it('should have fn methods', () => {
      expect(fn.readableSize).toBeDefined()
      expect(fn.readableQuantity).toBeDefined()
      expect(fn.readableTimeDelta).toBeDefined()
      expect(fn.pctOfMax).toBeDefined()
      expect(fn.profileEvent).toBeDefined()
      expect(fn.sum).toBeDefined()
      expect(fn.count).toBeDefined()
      expect(fn.avg).toBeDefined()
      expect(fn.max).toBeDefined()
      expect(fn.min).toBeDefined()
      expect(fn.toDate).toBeDefined()
      expect(fn.toDateTime).toBeDefined()
      expect(fn.today).toBeDefined()
      expect(fn.now).toBeDefined()
    })
  })

  describe('end-to-end query building', () => {
    it('should build a complete monitoring dashboard query', () => {
      const query = sql()
        .with(
          'recent_queries',
          sql()
            .select(
              'query_id',
              'user',
              'query_duration_ms',
              'read_bytes',
              'memory_usage',
              'event_time'
            )
            .from('system.query_log')
            .where('type', '=', 'QueryFinish')
            .where('event_date', '>=', 'today()')
        )
        .select(
          col('user'),
          col.count('query_id').as('query_count'),
          col.avg('query_duration_ms').as('avg_duration'),
          col.max('read_bytes').as('max_read'),
          col.sum('memory_usage').as('total_memory')
        )
        .from('recent_queries')
        .groupBy('user')
        .having('query_count', '>', 5)
        .orderBy('query_count', 'DESC')
        .limit(50)
        .settings({ max_execution_time: 30 })
        .format('JSONEachRow')
        .build()

      expect(query).toContain('WITH recent_queries AS (')
      expect(query).toContain('count(query_id) AS query_count')
      expect(query).toContain('avg(query_duration_ms) AS avg_duration')
      expect(query).toContain('GROUP BY user')
      expect(query).toContain('HAVING query_count > 5')
      expect(query).toContain('ORDER BY query_count DESC')
      expect(query).toContain('LIMIT 50')
      expect(query).toContain('SETTINGS max_execution_time = 30')
      expect(query).toContain('FORMAT JSONEachRow')
    })
  })
})
