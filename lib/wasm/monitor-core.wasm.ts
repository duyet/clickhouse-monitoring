import {
  parseTablesFromSqlWasm,
  transformClickHouseDataWasm,
  transformUserEventCountsWasm,
} from './monitor-core'
import { transformClickHouseData } from '@/lib/api/transform-data'
import { transformUserEventCounts } from '@/lib/chart-data-transforms'
import { parseTableFromSQL } from '@/lib/table-validator'

describe('monitor-core wasm bindings', () => {
  it('matches TypeScript SQL table extraction', async () => {
    const sql = `
      WITH recent_backups AS (
        SELECT * FROM system.backup_log WHERE start_time > now() - INTERVAL 1 DAY
      )
      SELECT * FROM recent_backups rb
      LEFT JOIN system.tables t ON rb.name = t.name
      WHERE EXISTS (
        SELECT 1 FROM system.parts p
        WHERE p.database = t.database AND p.table = t.name
      )
    `

    expect(await parseTablesFromSqlWasm(sql)).toEqual(parseTableFromSQL(sql))
  })

  it('matches TypeScript ClickHouse numeric normalization', async () => {
    const input = [
      {
        query_count: '12345',
        memory_usage: '5368709120',
        max_uint64: '18446744073709551615',
        nested: { value: '-42' },
        list: ['1', '2.5', 'text'],
      },
    ]

    expect(await transformClickHouseDataWasm(input)).toEqual(
      transformClickHouseData(input)
    )
  })

  it('matches TypeScript user event transforms', async () => {
    const input = [
      { event_time: '2026-01-01 00:00:00', user: 'alice', count: 5 },
      { event_time: '2026-01-01 00:00:00', user: '', count: 3 },
      { event_time: '2026-01-01 01:00:00', user: 'alice', count: 7 },
      { event_time: '2026-01-01 01:00:00', user: 'bob', count: '2' },
    ]

    expect(await transformUserEventCountsWasm(input)).toEqual(
      transformUserEventCounts(input)
    )
  })
})
