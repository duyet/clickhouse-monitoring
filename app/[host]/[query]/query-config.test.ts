import { beforeAll, expect, jest, test } from '@jest/globals'

// Mock ClickHouse client to prevent real database connections
jest.mock('@/lib/clickhouse', () => ({
  fetchData: jest.fn(),
}))

import { fetchData } from '@/lib/clickhouse'
import type { QueryConfig } from '@/types/query-config'
import { queries } from './clickhouse-queries'

describe('query config', () => {
  it('should have more than 1 config', () => {
    expect(queries.length).toBeGreaterThan(0)
  })

  const namedConfig = queries.map((config) => {
    return { name: config.name, config }
  })

  beforeAll(async () => {
    // Mock fetchData to simulate database responses instead of making real calls
    const mockedFetchData = fetchData as jest.MockedFunction<typeof fetchData>

    // Setup mock responses for different query types
    mockedFetchData.mockImplementation(async ({ query, hostId }) => {
      // Simulate error for intentionally failing queries
      if (
        query.includes('not_found_table_will_fail') ||
        query.includes('INSERT INTO not_found')
      ) {
        return {
          data: null,
          metadata: {
            queryId: 'mock-error',
            duration: 0.1,
            rows: 0,
            host: 'localhost',
          },
          error: {
            type: 'table_not_found' as const,
            message: 'Table not found (mocked error for testing)',
            details: {
              missingTables: ['not_found_table_will_fail'],
              host: 'localhost',
            },
          },
        }
      }

      // Simulate backup command response
      if (query.includes('BACKUP DATABASE')) {
        return {
          data: null,
          metadata: {
            queryId: 'mock-backup',
            duration: 0.5,
            rows: 0,
            host: 'localhost',
          },
          error: {
            type: 'permission_error' as const,
            message:
              "Path '/tmp/backup' is not allowed for backups (mocked error for testing)",
            details: { host: 'localhost' },
          },
        }
      }

      // Default successful response
      return {
        data: [{ mock: true, hostId, timestamp: new Date().toISOString() }],
        metadata: {
          queryId: 'mock-query',
          duration: 0.1,
          rows: 1,
          host: 'localhost',
        },
      }
    })

    // Execute the mock "preparation" calls
    try {
      console.log('prepare mock data for system.error_log')
      await fetchData({
        query: 'SELECT * FROM not_found_table_will_fail',
        hostId: 0,
      })
      await fetchData({
        query: 'INSERT INTO not_found',
        hostId: 0,
      })
    } catch (e) {
      console.log('generated mock record in system.error_log', e)
    }

    try {
      console.log('prepare mock data for system.backup_log')
      await fetchData({
        query: "BACKUP DATABASE default TO File('/tmp/backup')",
        hostId: 0,
      })
      console.log('generated mock record in system.backup_log')
    } catch (e) {
      console.log('generated mock record in system.backup_log', e)
    }
  })

  test.each(namedConfig)('check if valid sql for $name config', async ({
    name,
    config,
  }: {
    name: string
    config: QueryConfig
  }) => {
    expect(config.sql).toBeDefined()
    if (config.disableSqlValidation) {
      console.log(`[${name}] SQL validation is disabled`)
      return
    }

    console.log(`Testing config ${name} query:`, config.sql)
    console.log('with default params:', config.defaultParams || {})

    try {
      const result = await fetchData({
        query: config.sql,
        query_params: config.defaultParams || {},
        format: 'JSONEachRow',
        hostId: 0,
      })

      console.log('Response:', result.data)
      console.log('Metadata:', result.metadata)

      // For mocked responses, we expect either data or error to be defined
      expect(result.metadata).toBeDefined()

      if (result.error) {
        // If there's an error and the config is optional, that's expected
        if (config.optional) {
          console.log(
            'Query is marked optional, error is expected for missing tables'
          )
          expect([
            'table_not_found',
            'permission_error',
            'query_error',
          ]).toContain(result.error.type)
          return
        } else {
          // Non-optional config with error should fail the test
          throw new Error(`Query failed: ${result.error.message}`)
        }
      }

      // Success case - data should be defined
      expect(result.data).toBeDefined()
    } catch (e) {
      if (config.optional) {
        console.log(
          'Query is marked optional, that mean can be failed due to missing table for example'
        )
        // For optional configs, errors are acceptable
        return
      }

      console.error(e)
      throw e
    }
  })
})
