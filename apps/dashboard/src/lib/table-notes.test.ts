import {
  BACKUP_LOG,
  PART_LOG,
  QUERY_CACHE,
  QUERY_LOG,
  ZOOKEEPER,
} from './table-notes'
import { describe, expect, it } from 'bun:test'

describe('table-notes constants', () => {
  describe('QUERY_LOG', () => {
    it('is a non-empty string', () => {
      expect(typeof QUERY_LOG).toBe('string')
      expect(QUERY_LOG.length).toBeGreaterThan(0)
    })

    it('mentions the query_log table name', () => {
      expect(QUERY_LOG).toContain('query_log')
    })

    it('includes a ClickHouse documentation URL', () => {
      expect(QUERY_LOG).toContain('https://clickhouse.com/docs')
    })

    it('contains both query_log doc links', () => {
      expect(QUERY_LOG).toContain('query-log')
      expect(QUERY_LOG).toContain('system-tables/query_log')
    })
  })

  describe('QUERY_CACHE', () => {
    it('is a non-empty string', () => {
      expect(typeof QUERY_CACHE).toBe('string')
      expect(QUERY_CACHE.length).toBeGreaterThan(0)
    })

    it('mentions the query_cache table name', () => {
      expect(QUERY_CACHE).toContain('query_cache')
    })

    it('includes a ClickHouse documentation URL', () => {
      expect(QUERY_CACHE).toContain('https://clickhouse.com/docs')
    })

    it('links to the query-cache documentation', () => {
      expect(QUERY_CACHE).toContain('operations/query-cache')
    })
  })

  describe('PART_LOG', () => {
    it('is a non-empty string', () => {
      expect(typeof PART_LOG).toBe('string')
      expect(PART_LOG.length).toBeGreaterThan(0)
    })

    it('mentions the part_log table name', () => {
      expect(PART_LOG).toContain('part_log')
    })

    it('includes a ClickHouse documentation URL', () => {
      expect(PART_LOG).toContain('https://clickhouse.com/docs')
    })

    it('links to the part-log setting documentation', () => {
      expect(PART_LOG).toContain('part-log')
    })
  })

  describe('BACKUP_LOG', () => {
    it('is a non-empty string', () => {
      expect(typeof BACKUP_LOG).toBe('string')
      expect(BACKUP_LOG.length).toBeGreaterThan(0)
    })

    it('mentions the backup_log table name', () => {
      expect(BACKUP_LOG).toContain('backup_log')
    })

    it('includes a ClickHouse documentation URL', () => {
      expect(BACKUP_LOG).toContain('https://clickhouse.com/docs')
    })

    it('mentions that a backup is required for the table to appear', () => {
      expect(BACKUP_LOG).toContain('backup')
    })

    it('links to the backup_log setting documentation', () => {
      expect(BACKUP_LOG).toContain('backup_log')
    })
  })

  describe('ZOOKEEPER', () => {
    it('is a non-empty string', () => {
      expect(typeof ZOOKEEPER).toBe('string')
      expect(ZOOKEEPER.length).toBeGreaterThan(0)
    })

    it('mentions ZooKeeper', () => {
      expect(ZOOKEEPER).toContain('ZooKeeper')
    })

    it('mentions clickhouse-keeper as an alternative', () => {
      expect(ZOOKEEPER).toContain('clickhouse-keeper')
    })

    it('includes a ClickHouse documentation URL', () => {
      expect(ZOOKEEPER).toContain('https://clickhouse.com/docs')
    })

    it('links to the zookeeper server settings documentation', () => {
      expect(ZOOKEEPER).toContain('server-settings_zookeeper')
    })
  })

  describe('all constants are distinct', () => {
    const all = [QUERY_LOG, QUERY_CACHE, PART_LOG, BACKUP_LOG, ZOOKEEPER]

    it('each constant has a unique value', () => {
      const unique = new Set(all)
      expect(unique.size).toBe(all.length)
    })
  })
})
