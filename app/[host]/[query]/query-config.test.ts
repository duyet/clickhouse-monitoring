import { fetchData } from '@/lib/clickhouse'
import { expect, test } from '@jest/globals'
import { queries } from './clickhouse-queries'

describe('query config', () => {
  it('should have more than 1 config', () => {
    expect(queries.length).toBeGreaterThan(0)
  })

  const namedConfig = queries.map((config) => {
    return { name: config.name, config }
  })

  test.each(namedConfig)(
    'check if valid sql for $name config',
    async ({ name, config }) => {
      expect(config.sql).toBeDefined()
      console.log(`Testing config ${name} query:`, config.sql)
      console.log('with default params:', config.defaultParams)

      try {
        const { data, metadata } = await fetchData({
          query: config.sql,
          query_params: config.defaultParams,
          format: 'JSONEachRow',
        })

        expect(data).toBeDefined()
        expect(metadata).toBeDefined()
      } catch (e) {
        console.error(e)
        throw e
      }
    }
  )
})
