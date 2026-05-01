/**
 * Benchmark: TS vs WASM v1 (JSON string) vs WASM v2 (serde-wasm-bindgen JsValue)
 *
 * Tests whether eliminating the JSON string intermediate improves performance.
 */
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// --- TS Transform (inline) ---
function transformUserEventCountsTS(rows, timeField) {
  const userSet = new Set()
  const nested = new Map()

  for (const row of rows) {
    const eventTime = row.event_time ?? ''
    const rawUser = row.user ?? ''
    const user = rawUser.trim() === '' ? '(empty)' : rawUser
    const count = Number(row.count) || 0

    userSet.add(user)
    if (!nested.has(eventTime)) nested.set(eventTime, new Map())
    nested.get(eventTime).set(user, count)
  }

  const users = [...userSet].sort()
  const chartData = []
  for (const [time, counts] of nested) {
    const entry = { [timeField]: time }
    for (const [u, c] of counts) entry[u] = c
    chartData.push(entry)
  }

  return {
    data: Object.fromEntries([...nested].map(([k, v]) => [k, Object.fromEntries(v)])),
    users,
    chart_data: chartData,
  }
}

// --- Generate test data ---
function generateData(size) {
  const users = ['alice', 'bob', 'charlie', 'dave', 'eve', 'frank', 'grace', 'heidi', '', 'ivan']
  const rows = []
  for (let i = 0; i < size; i++) {
    rows.push({
      event_time: `2026-01-${String(Math.floor(i / 10) + 1).padStart(2, '0')} ${String(Math.floor(i / 60)).padStart(2, '0')}:00:00`,
      user: users[i % users.length],
      count: Math.floor(Math.random() * 100),
    })
  }
  return rows
}

// --- WASM Loader ---
async function loadWasm() {
  const wasmPath = join(__dirname, '../../lib/wasm/generated/monitor_core_bg.wasm')
  const jsPath = join(__dirname, '../../lib/wasm/generated/monitor_core.js')
  const mod = await import(jsPath)
  const wasmBytes = readFileSync(wasmPath)
  await mod.default({ module_or_path: wasmBytes })
  return mod
}

// --- Benchmark runner ---
function bench(name, fn, iterations = 50) {
  // Warmup
  for (let i = 0; i < 5; i++) fn()

  const times = []
  for (let i = 0; i < iterations; i++) {
    const start = performance.now()
    fn()
    times.push(performance.now() - start)
  }

  times.sort((a, b) => a - b)
  const avg = times.reduce((s, t) => s + t, 0) / times.length
  const p50 = times[Math.floor(times.length * 0.5)]
  const p99 = times[Math.floor(times.length * 0.99)]
  return { name, avg, p50, p99, min: times[0], max: times[times.length - 1] }
}

async function main() {
  const wasm = await loadWasm()

  const sizes = [5000, 20000, 50000]

  console.log('# WASM v2 Benchmark: TS vs WASM v1 (JSON string) vs WASM v2 (JsValue direct)\n')

  for (const size of sizes) {
    const rows = generateData(size)
    const jsonInput = JSON.stringify(rows)

    console.log(`## ${size.toLocaleString()} rows\n`)

    const tsResult = bench('TypeScript', () => transformUserEventCountsTS(rows, 'event_time'))

    const wasmV1Result = bench('WASM v1 (JSON string)', () => {
      const str = wasm.transform_user_event_counts_json(jsonInput, 'event_time')
      JSON.parse(str)
    })

    const wasmV2Result = bench('WASM v2 (JsValue direct)', () => {
      wasm.transform_user_event_counts_v2(jsonInput, 'event_time')
    })

    const wasmV3Result = bench('WASM v3 (JsValue in+out)', () => {
      wasm.transform_user_event_counts_v3(rows, 'event_time')
    })

    const table = [
      ['Engine', 'Avg (ms)', 'p50 (ms)', 'p99 (ms)', 'vs TS'],
      [tsResult.name, tsResult.avg.toFixed(2), tsResult.p50.toFixed(2), tsResult.p99.toFixed(2), '1.00x'],
      [wasmV1Result.name, wasmV1Result.avg.toFixed(2), wasmV1Result.p50.toFixed(2), wasmV1Result.p99.toFixed(2), `${(tsResult.avg / wasmV1Result.avg).toFixed(2)}x`],
      [wasmV2Result.name, wasmV2Result.avg.toFixed(2), wasmV2Result.p50.toFixed(2), wasmV2Result.p99.toFixed(2), `${(tsResult.avg / wasmV2Result.avg).toFixed(2)}x`],
      [wasmV3Result.name, wasmV3Result.avg.toFixed(2), wasmV3Result.p50.toFixed(2), wasmV3Result.p99.toFixed(2), `${(tsResult.avg / wasmV3Result.avg).toFixed(2)}x`],
    ]

    const colWidths = table[0].map((_, i) => Math.max(...table.map(row => row[i].length)) + 2)
    for (const row of table) {
      console.log('| ' + row.map((cell, i) => cell.padEnd(colWidths[i])).join('| ') + '|')
    }
    console.log()
  }
}

main().catch(console.error)
