import { spawnSync } from 'node:child_process'
import { performance } from 'node:perf_hooks'
import { transformUserEventCounts } from '../../lib/chart-data-transforms/transforms/user-events'

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

function benchTs(data, iterations = 8) {
  const times = []
  for (let i = 0; i < iterations; i++) {
    const start = performance.now()
    transformUserEventCounts(data)
    times.push(performance.now() - start)
  }
  return times
}

function benchRust(data, iterations = 8) {
  const payload = JSON.stringify({ data, timeField: 'event_time' })
  const times = []
  for (let i = 0; i < iterations; i++) {
    const start = performance.now()
    const proc = spawnSync('cargo', ['run', '--release', '--quiet'], {
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

const data = generateData()
console.log(`Dataset rows: ${data.length}`)

// warmup
transformUserEventCounts(data)
spawnSync('cargo', ['build', '--release', '--quiet'], { cwd: 'tools/user-events-rs', stdio: 'inherit' })

const tsSummary = summarize('TypeScript', benchTs(data))
const rustSummary = summarize('Rust CLI', benchRust(data))

for (const s of [tsSummary, rustSummary]) {
  console.log(`${s.name}: avg=${s.avg.toFixed(2)}ms p50=${s.p50.toFixed(2)}ms p95=${s.p95.toFixed(2)}ms min=${s.min.toFixed(2)}ms max=${s.max.toFixed(2)}ms`)
}

console.log(`Speedup (TS/Rust avg): ${(tsSummary.avg / rustSummary.avg).toFixed(2)}x`)
