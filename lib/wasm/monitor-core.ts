type MonitorCoreModule = typeof import('./generated/monitor_core.js')

let modulePromise: Promise<MonitorCoreModule> | null = null

async function loadMonitorCore(): Promise<MonitorCoreModule> {
  if (!modulePromise) {
    modulePromise = import('./generated/monitor_core.js').then(async (mod) => {
      await mod.default()
      return mod
    })
  }

  return modulePromise
}

export async function parseTablesFromSqlWasm(sql: string): Promise<string[]> {
  const mod = await loadMonitorCore()
  return JSON.parse(mod.parse_tables_from_sql_json(sql)) as string[]
}

export async function transformClickHouseDataWasm<
  T extends Record<string, unknown>,
>(data: T[]): Promise<T[]> {
  const mod = await loadMonitorCore()
  return JSON.parse(
    mod.transform_clickhouse_data_json(JSON.stringify(data))
  ) as T[]
}

export async function transformUserEventCountsWasm<
  T extends string = 'event_time',
>(
  data: readonly Record<string, unknown>[],
  timeField: T = 'event_time' as T
): Promise<{
  data: Record<T, Record<string, number>>
  users: string[]
  chartData: Array<Record<T, string> & Record<string, number>>
}> {
  const mod = await loadMonitorCore()
  return JSON.parse(
    mod.transform_user_event_counts_json(JSON.stringify(data), timeField)
  ) as {
    data: Record<T, Record<string, number>>
    users: string[]
    chartData: Array<Record<T, string> & Record<string, number>>
  }
}
