/**
 * Integration Tests
 *
 * Tests combining multiple builders together.
 */

import { col, fn, param, raw } from '../index'
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

      const sql = columns.map((c) => c.toSql()).join(',\n  ')
      expect(sql).toBe(
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

      const sql = columns.map((c) => c.toSql()).join(',\n  ')
      expect(sql).toContain(
        "CASE WHEN bytes > 1000000 THEN 'large' ELSE 'small' END"
      )
      expect(sql).toContain('formatReadableSize(bytes)')
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

      const sql = `SELECT\n  ${columns.map((c) => c.toSql()).join(',\n  ')}`

      expect(sql).toContain('query_id')
      expect(sql).toContain(
        'formatReadableSize(read_bytes) AS readable_read_bytes'
      )
      expect(sql).toContain(
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

      const sql = `SELECT\n  ${columns.map((c) => c.toSql()).join(',\n  ')}\nGROUP BY user`

      expect(sql).toContain('count(query_id) AS query_count')
      expect(sql).toContain('sum(read_bytes) AS total_bytes')
      expect(sql).toContain('avg(query_duration_ms) AS avg_duration')
      expect(sql).toContain('GROUP BY user')
    })

    it('should build profile events query', () => {
      const columns = [
        col('event_time'),
        raw(fn.profileEvent('Query')).as('queries'),
        raw(fn.profileEvent('SelectQuery')).as('select_queries'),
        raw(fn.profileEvent('InsertQuery')).as('insert_queries'),
      ]

      const sql = columns.map((c) => c.toSql()).join(',\n  ')

      expect(sql).toContain("(ProfileEvents['Query']) AS queries")
      expect(sql).toContain("(ProfileEvents['SelectQuery']) AS select_queries")
    })
  })

  describe('export integrity', () => {
    it('should export all builders from index', () => {
      expect(col).toBeDefined()
      expect(fn).toBeDefined()
      expect(raw).toBeDefined()
      expect(param).toBeDefined()
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
      expect(fn.pctOfMax).toBeDefined()
      expect(fn.profileEvent).toBeDefined()
      expect(fn.sum).toBeDefined()
      expect(fn.toDate).toBeDefined()
    })
  })
})
