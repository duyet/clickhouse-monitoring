/**
 * Column Builder Tests
 */

import { col } from '../column'
import { describe, expect, it } from '@jest/globals'

describe('ColumnBuilder', () => {
  describe('basic operations', () => {
    it('should create simple column', () => {
      expect(col('user_id').toSql()).toBe('user_id')
    })

    it('should create column with alias', () => {
      expect(col('user_id').as('uid').toSql()).toBe('user_id AS uid')
    })

    it('should be immutable', () => {
      const original = col('test')
      const aliased = original.as('alias')

      expect(original.toSql()).toBe('test')
      expect(aliased.toSql()).toBe('test AS alias')
    })
  })

  describe('formatting helpers', () => {
    it('should format readable size', () => {
      expect(col('bytes').readable().toSql()).toBe(
        'formatReadableSize(bytes) AS readable_bytes'
      )
    })

    it('should format readable quantity', () => {
      expect(col('rows').quantity().toSql()).toBe(
        'formatReadableQuantity(rows) AS readable_rows'
      )
    })

    it('should format readable time delta', () => {
      expect(col('elapsed').timeDelta().toSql()).toBe(
        'formatReadableTimeDelta(elapsed) AS readable_elapsed'
      )
    })

    it('should preserve custom alias in readable', () => {
      expect(col('bytes').as('custom').readable().toSql()).toBe(
        'formatReadableSize(bytes) AS custom'
      )
    })
  })

  describe('percentage of max', () => {
    it('should calculate pct of max with default precision', () => {
      expect(col('elapsed').pctOfMax().toSql()).toBe(
        'round(100 * elapsed / max(elapsed) OVER (), 2) AS pct_elapsed'
      )
    })

    it('should calculate pct of max with custom precision', () => {
      expect(col('bytes').pctOfMax(1).toSql()).toBe(
        'round(100 * bytes / max(bytes) OVER (), 1) AS pct_bytes'
      )
    })

    it('should preserve custom alias in pctOfMax', () => {
      expect(col('elapsed').as('custom').pctOfMax().toSql()).toBe(
        'round(100 * elapsed / max(elapsed) OVER (), 2) AS custom'
      )
    })
  })

  describe('window functions', () => {
    it('should add empty window clause', () => {
      expect(col('elapsed').over({}).toSql()).toBe('elapsed OVER ()')
    })

    it('should add partition by single column', () => {
      expect(col('elapsed').over({ partitionBy: 'user' }).toSql()).toBe(
        'elapsed OVER (PARTITION BY user)'
      )
    })

    it('should add partition by multiple columns', () => {
      expect(
        col('elapsed')
          .over({ partitionBy: ['user', 'query_id'] })
          .toSql()
      ).toBe('elapsed OVER (PARTITION BY user, query_id)')
    })

    it('should add order by', () => {
      expect(col('elapsed').over({ orderBy: 'event_time DESC' }).toSql()).toBe(
        'elapsed OVER (ORDER BY event_time DESC)'
      )
    })

    it('should add partition by and order by', () => {
      expect(
        col('elapsed')
          .over({ partitionBy: 'user', orderBy: 'event_time DESC' })
          .toSql()
      ).toBe('elapsed OVER (PARTITION BY user ORDER BY event_time DESC)')
    })

    it('should preserve alias with window', () => {
      expect(
        col('elapsed').over({ partitionBy: 'user' }).as('ranked').toSql()
      ).toBe('elapsed OVER (PARTITION BY user) AS ranked')
    })
  })

  describe('static helpers', () => {
    it('should concatenate strings', () => {
      expect(col.concat('database', '.', 'table').toSql()).toBe(
        "concat('database', '.', 'table')"
      )
    })

    it('should concatenate with alias', () => {
      expect(col.concat('database', '.', 'table').as('full_name').toSql()).toBe(
        "concat('database', '.', 'table') AS full_name"
      )
    })

    it('should create sum', () => {
      expect(col.sum('bytes').toSql()).toBe('sum(bytes)')
    })

    it('should create sum with alias', () => {
      expect(col.sum('bytes').as('total_bytes').toSql()).toBe(
        'sum(bytes) AS total_bytes'
      )
    })

    it('should create count without column', () => {
      expect(col.count().toSql()).toBe('count()')
    })

    it('should create count with column', () => {
      expect(col.count('user_id').toSql()).toBe('count(user_id)')
    })

    it('should create avg', () => {
      expect(col.avg('duration').toSql()).toBe('avg(duration)')
    })

    it('should create max', () => {
      expect(col.max('bytes').toSql()).toBe('max(bytes)')
    })

    it('should create min', () => {
      expect(col.min('bytes').toSql()).toBe('min(bytes)')
    })
  })

  describe('chaining operations', () => {
    it('should chain readable and alias', () => {
      expect(col('bytes').readable().as('size').toSql()).toBe(
        'formatReadableSize(bytes) AS size'
      )
    })

    it('should chain window and pctOfMax', () => {
      // pctOfMax already includes window, so this tests expression chaining
      const result = col('elapsed').pctOfMax()
      expect(result.toSql()).toBe(
        'round(100 * elapsed / max(elapsed) OVER (), 2) AS pct_elapsed'
      )
    })
  })
})
