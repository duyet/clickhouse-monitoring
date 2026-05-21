import type { QueryConfig } from '@/types/query-config'

import { describe, expect, test } from 'bun:test'
import {
  capTableResultRows,
  getTableClickHouseSettings,
  TABLE_RESULT_OVERFLOW_MODE,
  TABLE_RESULT_ROW_LIMIT,
} from '@/lib/api/table-query-settings'

describe('getTableClickHouseSettings', () => {
  test('adds the table row cap and break overflow mode', () => {
    expect(getTableClickHouseSettings(undefined, undefined)).toEqual({
      max_result_rows: String(TABLE_RESULT_ROW_LIMIT),
      result_overflow_mode: TABLE_RESULT_OVERFLOW_MODE,
    })
  })

  test('preserves config settings and applies timezone', () => {
    const config: QueryConfig = {
      name: 'tables-overview',
      sql: 'SELECT 1',
      columns: ['one'],
      clickhouseSettings: {
        allow_experimental_analyzer: 0,
      },
    }

    expect(getTableClickHouseSettings(config, 'UTC')).toEqual({
      allow_experimental_analyzer: 0,
      session_timezone: 'UTC',
      max_result_rows: String(TABLE_RESULT_ROW_LIMIT),
      result_overflow_mode: TABLE_RESULT_OVERFLOW_MODE,
    })
  })

  test('does not raise a lower config result limit', () => {
    const config: QueryConfig = {
      name: 'small-result',
      sql: 'SELECT 1',
      columns: ['one'],
      clickhouseSettings: {
        max_result_rows: '25',
        result_overflow_mode: 'throw',
      },
    }

    expect(getTableClickHouseSettings(config, undefined)).toEqual({
      max_result_rows: '25',
      result_overflow_mode: TABLE_RESULT_OVERFLOW_MODE,
    })
  })
})

describe('capTableResultRows', () => {
  test('keeps array data at or below the cap unchanged', () => {
    const data = [{ id: 1 }, { id: 2 }]

    expect(capTableResultRows(data, 2)).toEqual({
      data,
      sourceRows: 2,
      returnedRows: 2,
      truncated: false,
    })
  })

  test('trims array data above the cap', () => {
    expect(capTableResultRows([{ id: 1 }, { id: 2 }, { id: 3 }], 2)).toEqual({
      data: [{ id: 1 }, { id: 2 }],
      sourceRows: 3,
      returnedRows: 2,
      truncated: true,
    })
  })

  test('leaves non-array data unchanged', () => {
    const data = { rows: 10 }

    expect(capTableResultRows(data, 2)).toEqual({
      data,
      truncated: false,
    })
  })
})
