/**
 * Tests for table registry
 */

import {
  getAvailableTables,
  getTableConfig,
  getTableQuery,
  hasTable,
} from '../table-registry'

describe('table-registry', () => {
  describe('hasTable', () => {
    it('should return true for existing query configs', () => {
      expect(hasTable('tables-overview')).toBe(true)
      expect(hasTable('clusters')).toBe(true)
      expect(hasTable('disks')).toBe(true)
      expect(hasTable('running-queries')).toBe(true)
    })

    it('should return false for non-existent query configs', () => {
      expect(hasTable('non-existent-query')).toBe(false)
      expect(hasTable('')).toBe(false)
    })
  })

  describe('getAvailableTables', () => {
    it('should return an array of table names', () => {
      const tables = getAvailableTables()

      expect(Array.isArray(tables)).toBe(true)
      expect(tables.length).toBeGreaterThan(0)

      // Check for some known tables
      expect(tables).toContain('tables-overview')
      expect(tables).toContain('clusters')
      expect(tables).toContain('disks')
      expect(tables).toContain('running-queries')
    })

    it('should return sorted table names', () => {
      const tables = getAvailableTables()
      const sorted = [...tables].sort()

      expect(tables).toEqual(sorted)
    })
  })

  describe('getTableConfig', () => {
    it('should return query config for existing tables', () => {
      const config = getTableConfig('tables-overview')

      expect(config).toBeDefined()
      expect(config?.name).toBe('tables-overview')
      expect(config?.sql).toBeDefined()
      expect(config?.columns).toBeDefined()
      expect(Array.isArray(config?.columns)).toBe(true)
    })

    it('should return undefined for non-existent tables', () => {
      const config = getTableConfig('non-existent-query')

      expect(config).toBeUndefined()
    })
  })

  describe('getTableQuery', () => {
    it('should build query without parameters', () => {
      const result = getTableQuery('clusters', { hostId: 0 })

      expect(result).toBeDefined()
      expect(result?.query).toContain('SELECT')
      expect(result?.query).toContain('FROM system.clusters')
      expect(result?.queryConfig).toBeDefined()
      expect(result?.queryConfig.name).toBe('clusters')
    })

    it('should build query with search parameters', () => {
      const result = getTableQuery('columns', {
        hostId: 0,
        searchParams: {
          database: 'default',
          table: 'users',
        },
      })

      expect(result).toBeDefined()
      expect(result?.query).toContain('SELECT')
      expect(result?.queryParams).toEqual({
        database: 'default',
        table: 'users',
      })
    })

    it('should use default parameters from config', () => {
      // database-disk-usage-by-database has defaultParams: { database: 'default' }
      const result = getTableQuery('database-disk-usage-by-database', {
        hostId: 0,
      })

      expect(result).toBeDefined()
      expect(result?.queryParams).toEqual({
        database: 'default',
      })
    })

    it('should override default parameters with search params', () => {
      const result = getTableQuery('database-disk-usage-by-database', {
        hostId: 0,
        searchParams: {
          database: 'custom_db',
        },
      })

      expect(result).toBeDefined()
      expect(result?.queryParams).toEqual({
        database: 'custom_db',
      })
    })

    it('should return null for non-existent tables', () => {
      const result = getTableQuery('non-existent-query', { hostId: 0 })

      expect(result).toBeNull()
    })

    it('should include query config in result', () => {
      const result = getTableQuery('running-queries', { hostId: 0 })

      expect(result).toBeDefined()
      expect(result?.queryConfig).toBeDefined()
      expect(result?.queryConfig.name).toBe('running-queries')
      expect(result?.queryConfig.sql).toBe(result?.query)
    })

    it('should handle optional tables correctly', () => {
      // backups is marked as optional
      const result = getTableQuery('backups', { hostId: 0 })

      expect(result).toBeDefined()
      expect(result?.queryConfig.optional).toBe(true)
      expect(result?.queryConfig.tableCheck).toBeDefined()
    })
  })
})
