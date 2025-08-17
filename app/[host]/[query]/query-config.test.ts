import { beforeAll, expect, test } from '@jest/globals'

import { fetchData } from '@/lib/clickhouse'
import { QueryConfig } from '@/types/query-config'
import { queries } from './clickhouse-queries'

describe('query config', () => {
  it('should have more than 1 config', () => {
    expect(queries.length).toBeGreaterThan(0)
  })

  const namedConfig = queries.map((config) => {
    return { name: config.name, config }
  })

  beforeAll(async () => {
    try {
      console.log('prepare data for system.error_log')
      await fetchData({
        query: 'SELECT * FROM not_found_table_will_fail',
        hostId: 0,
      })
      await fetchData({
        query: 'INSERT INTO not_found',
        hostId: 0,
      })
    } catch (e) {
      console.log('generated a record in system.error_log', e)
    }

    try {
      console.log('prepare data for system.backup_log')
      await fetchData({
        query: "BACKUP DATABASE default TO File('/tmp/backup')",
        hostId: 0,
      })
      console.log('generated a record in system.backup_log')
    } catch (e) {
      console.log('generated a record in system.backup_log', e)
      console.log(`
        Although the backup can be failed, it will generate a record in system.backup_log
        DB::Exception: Path '/tmp/backup' is not allowed for backups,
        see the 'backups.allowed_path' configuration parameter`)
    }
  })

  test.each(namedConfig)(
    'check if valid sql for $name config',
    async ({ name, config }: { name: string; config: QueryConfig }) => {
      expect(config.sql).toBeDefined()
      if (config.disableSqlValidation) {
        console.log(`[${name}] SQL validation is disabled`)
        return
      }

      console.log(`Testing config ${name} query:`, config.sql)
      console.log('with default params:', config.defaultParams || {})

      try {
        const { data, metadata } = await fetchData({
          query: config.sql,
          query_params: config.defaultParams || {},
          format: 'JSONEachRow',
          hostId: 0,
        })

        console.log('Response:', data)
        console.log('Metadata:', metadata)

        expect(data).toBeDefined()
        expect(metadata).toBeDefined()
      } catch (e) {
        if (config.optional) {
          console.log(
            'Query is marked optional, that mean can be failed due to missing table for example'
          )
          expect(e).toHaveProperty('type', 'UNKNOWN_TABLE')
          return
        }

        console.error(e)
        throw e
      }
    }
  )
})
