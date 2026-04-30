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

export async function transformClickHouseJsonEachRowWasmJson(
  input: string
): Promise<string> {
  const mod = await loadMonitorCore()
  return mod.transform_clickhouse_json_each_row_json(input)
}

export async function transformClickHouseJsonEachRowWasm<
  T extends Record<string, unknown>,
>(input: string): Promise<T[]> {
  return JSON.parse(await transformClickHouseJsonEachRowWasmJson(input)) as T[]
}
