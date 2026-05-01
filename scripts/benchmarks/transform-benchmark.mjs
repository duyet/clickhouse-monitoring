import { performance } from 'node:perf_hooks'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const SIZES = [50_000, 200_000, 500_000]
const ITERATIONS = 8

function generateData(size = 200000, users = 120, times = 1440) {
  const rows = []
  for (let i = 0; i < size; i++) {
    const minute = String(i % times).padStart(4, '0')
    rows.push({
      event_time: `2026-01-01T${String(Math.floor((i % 1440) / 60)).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}:00Z-${minute}`,
      user: `user_${i % users}`,
      count: (i % 100) + 1,
    })
  }
  return rows
}

function transformUserEventCounts(data, timeField = 'event_time') {
  const userSet = new Set()
  const nestedData = data.reduce((acc, item) => {
    const event_time = String(item.event_time ?? '')
    const rawUser = String(item.user ?? '')
    const user = rawUser.trim() === '' ? '(empty)' : rawUser
    const count = Number(item.count ?? 0)
    userSet.add(user)
    if (acc[event_time] === undefined) acc[event_time] = {}
    acc[event_time][user] = count
    return acc
  }, {})
  const users = Array.from(userSet).sort()
  const chartData = Object.entries(nestedData).map(([time, userCounts]) => {
    const entry = { [timeField]: time }
    Object.entries(userCounts).forEach(([user, count]) => { entry[user] = count })
    return entry
  })
  return { data: nestedData, users, chartData }
}

function summarize(name, times) {
  const sorted = [...times].sort((a, b) => a - b)
  const avg = times.reduce((a, b) => a + b, 0) / times.length
  const p50 = sorted[Math.floor(sorted.length * 0.5)]
  const p95 = sorted[Math.floor(sorted.length * 0.95)]
  return { name, avg, p50, p95, min: sorted[0], max: sorted[sorted.length - 1] }
}

async function loadWasm() {
  const wasmPath = fileURLToPath(new URL('../../lib/wasm/generated/monitor_core_bg.wasm', import.meta.url))
  const wasmBytes = await readFile(wasmPath)
  const mod = await import('../../lib/wasm/generated/monitor_core.js')
  await mod.default({ module_or_path: wasmBytes })
  return mod
}

async function main() {
  const wasm = await loadWasm()

  console.log('TypeScript vs WASM Benchmark (in-process, no IPC overhead)')
  console.log(`Iterations per test: ${ITERATIONS}`)
  console.log('─'.repeat(90))

  const results = []

  for (const size of SIZES) {
    const data = generateData(size)
    const dataJson = JSON.stringify(data)

    // TS warmup + bench
    transformUserEventCounts(data)
    const tsTimes = []
    for (let i = 0; i < ITERATIONS; i++) {
      const start = performance.now()
      transformUserEventCounts(data)
      tsTimes.push(performance.now() - start)
    }

    // WASM warmup + bench
    wasm.transform_user_event_counts_json(dataJson, 'event_time')
    const wasmTimes = []
    for (let i = 0; i < ITERATIONS; i++) {
      const start = performance.now()
      wasm.transform_user_event_counts_json(dataJson, 'event_time')
      wasmTimes.push(performance.now() - start)
    }

    const tsSummary = summarize('TypeScript', tsTimes)
    const wasmSummary = summarize('WASM (Rust)', wasmTimes)
    const speedup = tsSummary.avg / wasmSummary.avg

    console.log(
      `${String(size).padEnd(10)} ` +
      `TS avg=${tsSummary.avg.toFixed(1)}ms`.padEnd(20) + ' ' +
      `WASM avg=${wasmSummary.avg.toFixed(1)}ms`.padEnd(20) + ' ' +
      `${speedup.toFixed(2)}x`
    )

    results.push({ size, ts: tsSummary, wasm: wasmSummary, speedup })
  }

  console.log('─'.repeat(90))

  const avgSpeedup = results.reduce((a, r) => a + r.speedup, 0) / results.length
  console.log(`\nAverage speedup: ${avgSpeedup.toFixed(2)}x`)

  // Detailed for largest
  const largest = results[results.length - 1]
  console.log(`\nDetailed (${largest.size.toLocaleString()} rows):`)
  for (const s of [largest.ts, largest.wasm]) {
    console.log(`  ${s.name}: avg=${s.avg.toFixed(2)}ms p50=${s.p50.toFixed(2)}ms p95=${s.p95.toFixed(2)}ms min=${s.min.toFixed(2)}ms max=${s.max.toFixed(2)}ms`)
  }

  // Also benchmark JSON normalization (the existing WASM function)
  console.log('\n─'.repeat(90))
  console.log('ClickHouse JSON Normalization (TS vs WASM):')
  const normData = generateData(200_000)
  const normInput = normData.map(row => JSON.stringify(row)).join('\n')

  // TS: JSON.parse each line
  const tsNormTimes = []
  for (let i = 0; i < 5; i++) {
    const start = performance.now()
    normInput.split('\n').map(line => JSON.parse(line))
    tsNormTimes.push(performance.now() - start)
  }

  // WASM: single call
  const wasmNormTimes = []
  for (let i = 0; i < 5; i++) {
    const start = performance.now()
    wasm.transform_clickhouse_json_each_row_json(normInput)
    wasmNormTimes.push(performance.now() - start)
  }

  const tsNorm = summarize('TS JSON.parse', tsNormTimes)
  const wasmNorm = summarize('WASM normalize', wasmNormTimes)
  console.log(`  ${tsNorm.name}: avg=${tsNorm.avg.toFixed(2)}ms`)
  console.log(`  ${wasmNorm.name}: avg=${wasmNorm.avg.toFixed(2)}ms`)
  console.log(`  Speedup: ${(tsNorm.avg / wasmNorm.avg).toFixed(2)}x`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
