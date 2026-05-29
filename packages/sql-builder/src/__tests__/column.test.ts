/**
 * Column Builder Tests
 */

import { col } from '../column'
import { RawSql } from '../raw'
import { describe, expect, it } from 'bun:test'

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

    it('should return column name without alias when no alias set', () => {
      expect(col('foo').toSql()).toBe('foo')
    })

    it('should chain multiple as() calls', () => {
      const result = col('x').as('y').as('z')
      expect(result.toSql()).toBe('x AS z')
    })

    it('should handle column names with dots', () => {
      expect(col('t.column').toSql()).toBe('t.column')
    })

    it('should handle column names with underscores', () => {
      expect(col('my_column_name').toSql()).toBe('my_column_name')
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

    it('should preserve custom alias in quantity', () => {
      expect(col('rows').as('row_count').quantity().toSql()).toBe(
        'formatReadableQuantity(rows) AS row_count'
      )
    })

    it('should preserve custom alias in timeDelta', () => {
      expect(col('elapsed').as('duration').timeDelta().toSql()).toBe(
        'formatReadableTimeDelta(elapsed) AS duration'
      )
    })

    it('should auto-generate alias for readable', () => {
      const result = col('memory').readable()
      expect(result.toSql()).toContain('AS readable_memory')
    })

    it('should auto-generate alias for quantity', () => {
      const result = col('total').quantity()
      expect(result.toSql()).toContain('AS readable_total')
    })

    it('should auto-generate alias for timeDelta', () => {
      const result = col('time_spent').timeDelta()
      expect(result.toSql()).toContain('AS readable_time_spent')
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

    it('should calculate pct of max with zero precision', () => {
      expect(col('count').pctOfMax(0).toSql()).toBe(
        'round(100 * count / max(count) OVER (), 0) AS pct_count'
      )
    })

    it('should calculate pct of max with high precision', () => {
      expect(col('value').pctOfMax(6).toSql()).toBe(
        'round(100 * value / max(value) OVER (), 6) AS pct_value'
      )
    })

    it('should auto-generate alias for pctOfMax', () => {
      const result = col('memory').pctOfMax()
      expect(result.toSql()).toContain('AS pct_memory')
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

    it('should work with expression from readable + over', () => {
      const result = col('bytes').readable().over({ partitionBy: 'host' })
      expect(result.toSql()).toBe(
        'formatReadableSize(bytes) OVER (PARTITION BY host) AS readable_bytes'
      )
    })

    it('should work with empty over and alias', () => {
      const result = col('x').over({}).as('y')
      expect(result.toSql()).toBe('x OVER () AS y')
    })

    it('should handle partition by with three columns', () => {
      const result = col('val').over({ partitionBy: ['a', 'b', 'c'] })
      expect(result.toSql()).toBe('val OVER (PARTITION BY a, b, c)')
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

    it('should concatenate with RawSql parts', () => {
      expect(
        col.concat(new RawSql('database'), '.', new RawSql('table')).toSql()
      ).toBe("concat(database, '.', table)")
    })

    it('should escape single quotes in concat', () => {
      const result = col.concat("it's", ' ', 'test').toSql()
      expect(result).toBe("concat('it''s', ' ', 'test')")
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

    it('should create count with alias', () => {
      expect(col.count().as('total').toSql()).toBe('count() AS total')
    })

    it('should create avg', () => {
      expect(col.avg('duration').toSql()).toBe('avg(duration)')
    })

    it('should create avg with alias', () => {
      expect(col.avg('duration').as('avg_dur').toSql()).toBe(
        'avg(duration) AS avg_dur'
      )
    })

    it('should create max', () => {
      expect(col.max('bytes').toSql()).toBe('max(bytes)')
    })

    it('should create max with alias', () => {
      expect(col.max('bytes').as('peak').toSql()).toBe('max(bytes) AS peak')
    })

    it('should create min', () => {
      expect(col.min('bytes').toSql()).toBe('min(bytes)')
    })

    it('should create min with alias', () => {
      expect(col.min('bytes').as('lowest').toSql()).toBe('min(bytes) AS lowest')
    })
  })

  describe('chaining operations', () => {
    it('should chain readable and alias', () => {
      expect(col('bytes').readable().as('size').toSql()).toBe(
        'formatReadableSize(bytes) AS size'
      )
    })

    it('should chain window and pctOfMax', () => {
      const result = col('elapsed').pctOfMax()
      expect(result.toSql()).toBe(
        'round(100 * elapsed / max(elapsed) OVER (), 2) AS pct_elapsed'
      )
    })

    it('should chain quantity then alias', () => {
      expect(col('items').quantity().as('item_count').toSql()).toBe(
        'formatReadableQuantity(items) AS item_count'
      )
    })

    it('should chain timeDelta then alias', () => {
      expect(col('uptime').timeDelta().as('uptime_str').toSql()).toBe(
        'formatReadableTimeDelta(uptime) AS uptime_str'
      )
    })

    it('should allow re-aliasing after readable', () => {
      const first = col('bytes').readable().as('first')
      const second = first.as('second')
      expect(second.toSql()).toBe('formatReadableSize(bytes) AS second')
    })

    it('should allow readable after readable (overwrites expression)', () => {
      // Calling readable() on an already-readable column re-applies formatReadableSize
      const result = col('bytes').readable()
      expect(result.toSql()).toBe('formatReadableSize(bytes) AS readable_bytes')
    })
  })

  describe('edge cases', () => {
    it('should handle column named like a keyword', () => {
      expect(col('select').toSql()).toBe('select')
    })

    it('should handle column with numbers', () => {
      expect(col('col123').toSql()).toBe('col123')
    })

    it('should handle empty string column name', () => {
      expect(col('').toSql()).toBe('')
    })

    it('should produce correct SQL for complex column name', () => {
      expect(col('`my.column`').toSql()).toBe('`my.column`')
    })
  })
})
