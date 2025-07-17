import { type QueryConfig } from '@/types/query-config'
import {
  parseTableFromSQL,
  parseTableName,
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

  describe('parseTableName', () => {
    it('should parse valid table name', () => {
      const result = parseTableName('system.backup_log')
      expect(result).toEqual({ database: 'system', table: 'backup_log' })
    })

    it('should throw error for invalid table name', () => {
      expect(() => parseTableName('invalid_table')).toThrow(
        'Invalid table name format'
      )
    })
  })

  describe('validateTableExistence', () => {
    beforeEach(() => {
      // Reset mocks before each test
      jest.clearAllMocks()
    })

    it('should return shouldProceed true for non-optional queries', async () => {
      const config: QueryConfig = {
        name: 'test',
        sql: 'SELECT * FROM system.tables',
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
  })
})
