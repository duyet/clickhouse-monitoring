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
