import type { ClickHouseSettings } from '@clickhouse/client'

import type { QueryConfig } from '@/types/query-config'

export const TABLE_RESULT_ROW_LIMIT = 1_000
export const TABLE_RESULT_OVERFLOW_MODE = 'break'

export type TableResultRowCap<T> = {
  data: T
  sourceRows?: number
  returnedRows?: number
  truncated: boolean
}

export type TableClickHouseSettings = ClickHouseSettings & {
  /** IANA timezone for ClickHouse session time conversion */
  session_timezone?: string
}

function resolveResultRowLimit(
  configuredLimit: ClickHouseSettings['max_result_rows'] | undefined
): number {
  const numericLimit = Number(configuredLimit)

  if (Number.isFinite(numericLimit) && numericLimit > 0) {
    return Math.min(numericLimit, TABLE_RESULT_ROW_LIMIT)
  }

  return TABLE_RESULT_ROW_LIMIT
}

export function getTableClickHouseSettings(
  config: QueryConfig | undefined,
  timezone: string | undefined
): TableClickHouseSettings {
  const configSettings = config?.clickhouseSettings ?? {}
  const maxResultRows = resolveResultRowLimit(configSettings.max_result_rows)

  return {
    ...configSettings,
    ...(timezone ? { session_timezone: timezone } : {}),
    max_result_rows: String(maxResultRows),
    result_overflow_mode: TABLE_RESULT_OVERFLOW_MODE,
  }
}

export function capTableResultRows<T>(
  data: T,
  rowLimit: number
): TableResultRowCap<T> {
  if (!Array.isArray(data)) {
    return { data, truncated: false }
  }

  const sourceRows = data.length

  if (sourceRows <= rowLimit) {
    return {
      data,
      sourceRows,
      returnedRows: sourceRows,
      truncated: false,
    }
  }

  return {
    data: data.slice(0, rowLimit) as T,
    sourceRows,
    returnedRows: rowLimit,
    truncated: true,
  }
}
