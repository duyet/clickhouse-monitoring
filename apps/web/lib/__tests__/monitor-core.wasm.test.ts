import {
  transformClickHouseDataWasm,
  transformClickHouseJsonEachRowWasm,
  transformUserEventCountsWasm,
} from '@chm/clickhouse-client/wasm/monitor-core'
import { transformClickHouseData } from '@/lib/api/transform-data'
import { transformUserEventCounts } from '@/lib/chart-data-transforms'

describe('monitor-core wasm bindings', () => {
  it('matches TypeScript ClickHouse JSONEachRow normalization', async () => {
    const input = [
      {
        query_count: '12345',
        memory_usage: '5368709120',
        max_uint64: '18446744073709551615',
        nested: { value: '-42' },
        list: ['1', '2.5', 'text'],
      },
      {
        query_count: '67890',
        memory_usage: '10737418240',
        max_uint64: '9007199254740992',
        nested: { value: '7' },
        list: ['3', '4.5', 'text'],
      },
    ]
    const jsonEachRow = input.map((row) => JSON.stringify(row)).join('\n')

    expect(await transformClickHouseJsonEachRowWasm(jsonEachRow)).toEqual(
      transformClickHouseData(input)
    )
  })

  it('matches TypeScript ClickHouse object normalization', async () => {
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
      { event_time: '2026-01-01 01:00:00', user: 'alice', count: 7 },
      { event_time: '2026-01-01 00:00:00', user: 'alice', count: 5 },
      { event_time: '2026-01-01 00:00:00', user: 'alice', count: 4 },
      { event_time: '2026-01-01 00:00:00', user: '', count: 3 },
      { event_time: '2026-01-01 01:00:00', user: 'bob', count: '2' },
    ]

    expect(await transformUserEventCountsWasm(input)).toEqual(
      transformUserEventCounts(input)
    )
  })
})
