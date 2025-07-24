import { type QueryConfig } from '@/types/query-config'
import {
  parseTableFromSQL,
  validateTableExistence,
} from './table-validator'

// Mock the table existence cache
jest.mock('./table-existence-cache', () => ({
  tableExistenceCache: {
    checkTableExists: jest.fn(),
  },
}))

describe('Table Validator', () => {
  describe('parseTableFromSQL', () => {
    it('should extract table names from SQL', () => {
      const sql =
        'SELECT * FROM system.backup_log WHERE status = "BACKUP_CREATED"'
      const result = parseTableFromSQL(sql)
      expect(result).toEqual(['system.backup_log'])
    })

    it('should extract multiple table names from SQL', () => {
      const sql =
        'SELECT * FROM system.backup_log JOIN system.error_log ON true'
      const result = parseTableFromSQL(sql)
      expect(result).toEqual(['system.backup_log', 'system.error_log'])
    })

    it('should handle empty SQL', () => {
      const sql = ''
      const result = parseTableFromSQL(sql)
      expect(result).toEqual([])
    })
  })


  describe('validateTableExistence', () => {
    beforeEach(() => {
      // Reset mocks before each test
      jest.clearAllMocks()
    })

    it('should return shouldProceed true when no tables to check', async () => {
      const config: QueryConfig = {
        name: 'test',
        sql: 'SELECT * FROM some_view', // No database.table pattern
        columns: ['name'],
        optional: false,
      }

      const result = await validateTableExistence(config, 0)
      expect(result.shouldProceed).toBe(true)
      expect(result.missingTables).toEqual([])
    })

    it('should use explicit tableCheck when provided', async () => {
      const { tableExistenceCache } = await import('./table-existence-cache')
      const mockCheckTableExists =
        tableExistenceCache.checkTableExists as jest.MockedFunction<
          typeof tableExistenceCache.checkTableExists
        >

      // Mock the table existence check to return false
      mockCheckTableExists.mockResolvedValue(false)

      const config: QueryConfig = {
        name: 'test',
        sql: 'SELECT * FROM system.backup_log',
        columns: ['name'],
        optional: true,
        tableCheck: 'system.backup_log',
      }

      const result = await validateTableExistence(config, 0)
      expect(result.shouldProceed).toBe(false)
      expect(result.missingTables).toEqual(['system.backup_log'])
      expect(mockCheckTableExists).toHaveBeenCalledWith(
        0,
        'system',
        'backup_log'
      )
    })

    it('should fallback to SQL parsing when tableCheck is not provided', async () => {
      const { tableExistenceCache } = await import('./table-existence-cache')
      const mockCheckTableExists =
        tableExistenceCache.checkTableExists as jest.MockedFunction<
          typeof tableExistenceCache.checkTableExists
        >

      // Mock the table existence check to return false
      mockCheckTableExists.mockResolvedValue(false)

      const config: QueryConfig = {
        name: 'test',
        sql: 'SELECT * FROM system.backup_log WHERE status = "BACKUP_CREATED"',
        columns: ['name'],
        optional: true,
        // No tableCheck provided - should use SQL parsing
      }

      const result = await validateTableExistence(config, 0)
      expect(result.shouldProceed).toBe(false)
      expect(result.missingTables).toEqual(['system.backup_log'])
      expect(mockCheckTableExists).toHaveBeenCalledWith(
        0,
        'system',
        'backup_log'
      )
    })
  })
})
