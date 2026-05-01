import { spawnSync } from 'node:child_process'
import { performance } from 'node:perf_hooks'

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

// Inlined TypeScript transform (matches lib/chart-data-transforms/transforms/user-events.ts)
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

function benchTs(data, iterations = ITERATIONS) {
  transformUserEventCounts(data) // warmup
  const times = []
  for (let i = 0; i < iterations; i++) {
    const start = performance.now()
    transformUserEventCounts(data)
    times.push(performance.now() - start)
  }
  return times
}

function benchRustBinary(data, iterations = ITERATIONS) {
  const payload = JSON.stringify({ data, timeField: 'event_time' })
  const times = []
  for (let i = 0; i < iterations; i++) {
    const start = performance.now()
    const proc = spawnSync('./target/release/user-events-rs', [], {
      cwd: 'tools/user-events-rs',
      input: payload,
      encoding: 'utf8',
      maxBuffer: 50 * 1024 * 1024,
    })
    if (proc.status !== 0) {
      throw new Error(proc.stderr || 'Rust benchmark failed')
    }
    times.push(performance.now() - start)
  }
  return times
}

function summarize(name, times) {
  const sorted = [...times].sort((a, b) => a - b)
  const avg = times.reduce((a, b) => a + b, 0) / times.length
  const p50 = sorted[Math.floor(sorted.length * 0.5)]
  const p95 = sorted[Math.floor(sorted.length * 0.95)]
  return { name, avg, p50, p95, min: sorted[0], max: sorted[sorted.length - 1] }
}

// Build once
console.log('Building Rust binary...')
spawnSync('cargo', ['build', '--release', '--quiet'], { cwd: 'tools/user-events-rs', stdio: 'inherit' })

console.log(`\nIterations per test: ${ITERATIONS}`)
console.log('─'.repeat(90))
console.log(`${'Rows'.padEnd(10)} ${'TypeScript (ms)'.padEnd(22)} ${'Rust binary (ms)'.padEnd(22)} ${'Speedup'.padEnd(10)}`)
console.log('─'.repeat(90))

const results = []

for (const size of SIZES) {
  const data = generateData(size)
  const tsSummary = summarize('TypeScript', benchTs(data))
  const rustSummary = summarize('Rust binary', benchRustBinary(data))
  const speedup = tsSummary.avg / rustSummary.avg

  console.log(
    `${String(size).padEnd(10)} ` +
    `avg=${tsSummary.avg.toFixed(1)} p50=${tsSummary.p50.toFixed(1)}`.padEnd(22) + ' ' +
    `avg=${rustSummary.avg.toFixed(1)} p50=${rustSummary.p50.toFixed(1)}`.padEnd(22) + ' ' +
    `${speedup.toFixed(2)}x`
  )

  results.push({ size, ts: tsSummary, rust: rustSummary, speedup })
}

console.log('─'.repeat(90))

const avgSpeedup = results.reduce((a, r) => a + r.speedup, 0) / results.length
console.log(`\nAverage speedup across all sizes: ${avgSpeedup.toFixed(2)}x`)

const largest = results[results.length - 1]
console.log(`\nDetailed (${largest.size.toLocaleString()} rows):`)
for (const s of [largest.ts, largest.rust]) {
  console.log(`  ${s.name}: avg=${s.avg.toFixed(2)}ms p50=${s.p50.toFixed(2)}ms p95=${s.p95.toFixed(2)}ms min=${s.min.toFixed(2)}ms max=${s.max.toFixed(2)}ms`)
}
