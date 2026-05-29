/**
 * SQL Functions Tests
 */

import { fn } from '../functions'
import { describe, expect, it } from 'bun:test'

describe('fn (SQL Functions)', () => {
  describe('formatting functions', () => {
    it('should format readable size', () => {
      expect(fn.readableSize('bytes')).toBe('formatReadableSize(bytes)')
    })

    it('should format readable quantity', () => {
      expect(fn.readableQuantity('rows')).toBe('formatReadableQuantity(rows)')
    })

    it('should format readable time delta', () => {
      expect(fn.readableTimeDelta('elapsed')).toBe(
        'formatReadableTimeDelta(elapsed)'
      )
    })

    it('should handle column names with table prefix', () => {
      expect(fn.readableSize('t.bytes')).toBe('formatReadableSize(t.bytes)')
    })

    it('should handle column names with function calls', () => {
      expect(fn.readableSize('sum(bytes)')).toBe(
        'formatReadableSize(sum(bytes))'
      )
    })

    it('should handle column with database.table prefix', () => {
      expect(fn.readableQuantity('db.table.rows')).toBe(
        'formatReadableQuantity(db.table.rows)'
      )
    })
  })

  describe('aggregate functions', () => {
    it('should create sum', () => {
      expect(fn.sum('bytes')).toBe('sum(bytes)')
    })

    it('should create count without column', () => {
      expect(fn.count()).toBe('count()')
    })

    it('should create count with column', () => {
      expect(fn.count('user_id')).toBe('count(user_id)')
    })

    it('should create avg', () => {
      expect(fn.avg('duration')).toBe('avg(duration)')
    })

    it('should create max', () => {
      expect(fn.max('bytes')).toBe('max(bytes)')
    })

    it('should create min', () => {
      expect(fn.min('bytes')).toBe('min(bytes)')
    })

    it('should create sum with complex expression', () => {
      expect(fn.sum('read_bytes + write_bytes')).toBe(
        'sum(read_bytes + write_bytes)'
      )
    })

    it('should create count with complex expression', () => {
      expect(fn.count('DISTINCT user_id')).toBe('count(DISTINCT user_id)')
    })

    it('should create avg with expression', () => {
      expect(fn.avg('query_duration_ms / 1000')).toBe(
        'avg(query_duration_ms / 1000)'
      )
    })

    it('should create max with expression', () => {
      expect(fn.max('memory_usage / 1024')).toBe('max(memory_usage / 1024)')
    })

    it('should create min with expression', () => {
      expect(fn.min('query_duration_ms')).toBe('min(query_duration_ms)')
    })
  })

  describe('window functions', () => {
    it('should create pctOfMax with default precision', () => {
      expect(fn.pctOfMax('elapsed')).toBe(
        'round(100 * elapsed / max(elapsed) OVER (), 2)'
      )
    })

    it('should create pctOfMax with custom precision', () => {
      expect(fn.pctOfMax('bytes', 1)).toBe(
        'round(100 * bytes / max(bytes) OVER (), 1)'
      )
    })

    it('should create pctOfMax with zero precision', () => {
      expect(fn.pctOfMax('count', 0)).toBe(
        'round(100 * count / max(count) OVER (), 0)'
      )
    })

    it('should create pctOfMax with high precision', () => {
      expect(fn.pctOfMax('value', 6)).toBe(
        'round(100 * value / max(value) OVER (), 6)'
      )
    })

    it('should create pctOfMax with column containing dots', () => {
      expect(fn.pctOfMax('t.elapsed')).toBe(
        'round(100 * t.elapsed / max(t.elapsed) OVER (), 2)'
      )
    })
  })

  describe('ClickHouse specific functions', () => {
    it('should create profile event accessor', () => {
      expect(fn.profileEvent('MemoryUsage')).toBe(
        "ProfileEvents['MemoryUsage']"
      )
    })

    it('should create profile event with special chars', () => {
      expect(fn.profileEvent('Query.SelectQueries')).toBe(
        "ProfileEvents['Query.SelectQueries']"
      )
    })

    it('should create profile event with dots', () => {
      expect(fn.profileEvent('OSReadBytes')).toBe(
        "ProfileEvents['OSReadBytes']"
      )
    })

    it('should create profile event with numbers', () => {
      expect(fn.profileEvent('UserPartitionsScanned')).toBe(
        "ProfileEvents['UserPartitionsScanned']"
      )
    })

    it('should create profile event with spaces', () => {
      expect(fn.profileEvent('FailedQuery')).toBe(
        "ProfileEvents['FailedQuery']"
      )
    })

    it('should create profile event with empty string', () => {
      expect(fn.profileEvent('')).toBe("ProfileEvents['']")
    })
  })

  describe('date/time functions', () => {
    it('should convert to date', () => {
      expect(fn.toDate('event_time')).toBe('toDate(event_time)')
    })

    it('should convert to datetime', () => {
      expect(fn.toDateTime('event_time')).toBe('toDateTime(event_time)')
    })

    it('should get today', () => {
      expect(fn.today()).toBe('today()')
    })

    it('should get now', () => {
      expect(fn.now()).toBe('now()')
    })

    it('should handle toDate with expression', () => {
      expect(fn.toDate('toDate(timestamp)')).toBe('toDate(toDate(timestamp))')
    })

    it('should handle toDateTime with expression', () => {
      expect(fn.toDateTime('now() - INTERVAL 1 DAY')).toBe(
        'toDateTime(now() - INTERVAL 1 DAY)'
      )
    })

    it('today should return consistent results', () => {
      expect(fn.today()).toBe(fn.today())
    })

    it('now should return consistent results', () => {
      expect(fn.now()).toBe(fn.now())
    })
  })

  describe('return types', () => {
    it('should return strings from all functions', () => {
      expect(typeof fn.readableSize('x')).toBe('string')
      expect(typeof fn.readableQuantity('x')).toBe('string')
      expect(typeof fn.readableTimeDelta('x')).toBe('string')
      expect(typeof fn.sum('x')).toBe('string')
      expect(typeof fn.count()).toBe('string')
      expect(typeof fn.count('x')).toBe('string')
      expect(typeof fn.avg('x')).toBe('string')
      expect(typeof fn.max('x')).toBe('string')
      expect(typeof fn.min('x')).toBe('string')
      expect(typeof fn.pctOfMax('x')).toBe('string')
      expect(typeof fn.profileEvent('x')).toBe('string')
      expect(typeof fn.toDate('x')).toBe('string')
      expect(typeof fn.toDateTime('x')).toBe('string')
      expect(typeof fn.today()).toBe('string')
      expect(typeof fn.now()).toBe('string')
    })
  })

  describe('composition', () => {
    it('should compose sum inside readableSize', () => {
      const result = fn.readableSize(fn.sum('bytes'))
      expect(result).toBe('formatReadableSize(sum(bytes))')
    })

    it('should compose count inside readableQuantity', () => {
      const result = fn.readableQuantity(fn.count('user_id'))
      expect(result).toBe('formatReadableQuantity(count(user_id))')
    })

    it('should compose max inside readableSize', () => {
      const result = fn.readableSize(fn.max('memory_usage'))
      expect(result).toBe('formatReadableSize(max(memory_usage))')
    })

    it('should use pctOfMax in larger expression', () => {
      const pctExpr = fn.pctOfMax('elapsed')
      const fullExpr = `${pctExpr} AS pct_elapsed`
      expect(fullExpr).toBe(
        'round(100 * elapsed / max(elapsed) OVER (), 2) AS pct_elapsed'
      )
    })
  })

  describe('fn object structure', () => {
    it('should have all expected methods', () => {
      expect(typeof fn.readableSize).toBe('function')
      expect(typeof fn.readableQuantity).toBe('function')
      expect(typeof fn.readableTimeDelta).toBe('function')
      expect(typeof fn.sum).toBe('function')
      expect(typeof fn.count).toBe('function')
      expect(typeof fn.avg).toBe('function')
      expect(typeof fn.max).toBe('function')
      expect(typeof fn.min).toBe('function')
      expect(typeof fn.pctOfMax).toBe('function')
      expect(typeof fn.profileEvent).toBe('function')
      expect(typeof fn.toDate).toBe('function')
      expect(typeof fn.toDateTime).toBe('function')
      expect(typeof fn.today).toBe('function')
      expect(typeof fn.now).toBe('function')
    })
  })
})
