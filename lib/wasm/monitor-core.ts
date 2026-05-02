type MonitorCoreModule = typeof import('./generated/monitor_core.js')

let modulePromise: Promise<MonitorCoreModule> | null = null

function isNodeRuntime(): boolean {
  return (
    typeof process !== 'undefined' &&
    typeof process.versions?.node === 'string' &&
    typeof process.versions?.bun === 'undefined'
  )
}

async function initMonitorCore(mod: MonitorCoreModule): Promise<void> {
  if (!isNodeRuntime()) {
    await mod.default()
    return
  }

  const [{ readFile }, { fileURLToPath }] = await Promise.all([
    import('node:fs/promises'),
    import('node:url'),
  ])
  const wasmUrl = new URL('./generated/monitor_core_bg.wasm', import.meta.url)
  const wasmBytes = await readFile(fileURLToPath(wasmUrl))

  await mod.default({ module_or_path: wasmBytes })
}

async function loadMonitorCore(): Promise<MonitorCoreModule> {
  if (!modulePromise) {
    modulePromise = import('./generated/monitor_core.js').then(async (mod) => {
      await initMonitorCore(mod)
      return mod
    })
  }

  return modulePromise
}

function toPlainObjects(value: unknown): unknown {
  if (
    value instanceof Map ||
    Object.prototype.toString.call(value) === '[object Map]'
  ) {
    const map = value as Map<unknown, unknown>
    return Object.fromEntries(
      [...map.entries()].map(([key, entry]) => [key, toPlainObjects(entry)])
    )
  }

  if (Array.isArray(value)) {
    return value.map(toPlainObjects)
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, toPlainObjects(entry)])
    )
  }

  return value
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

export async function transformClickHouseDataWasm<
  T extends Record<string, unknown>,
>(input: T[]): Promise<T[]> {
  const jsonEachRow = input.map((row) => JSON.stringify(row)).join('\n')
  return transformClickHouseJsonEachRowWasm<T>(jsonEachRow)
}

export async function transformUserEventCountsWasm<
  T extends string = 'event_time',
>(input: readonly Record<string, unknown>[], timeField: T = 'event_time' as T) {
  const mod = await loadMonitorCore()
  return toPlainObjects(
    mod.transform_user_event_counts_v3(input, timeField)
  ) as {
    data: Record<T, Record<string, number>>
    users: string[]
    chartData: Array<Record<T, string> & Record<string, number>>
  }
}
