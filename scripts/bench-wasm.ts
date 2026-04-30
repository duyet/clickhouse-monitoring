import { performance } from 'node:perf_hooks'
import { transformClickHouseData } from '@/lib/api/transform-data'
import { transformUserEventCounts } from '@/lib/chart-data-transforms'
import { parseTableFromSQL } from '@/lib/table-validator'
import {
  parseTablesFromSqlWasm,
  transformClickHouseDataWasm,
  transformUserEventCountsWasm,
} from '@/lib/wasm/monitor-core'

const PROMOTION_THRESHOLD = 1.2

type BenchResult = {
  name: string
  size: string
  tsMs: number
  wasmMs: number
  speedup: number
}

function timeSync(iterations: number, fn: () => void): number {
  const start = performance.now()
  for (let i = 0; i < iterations; i += 1) {
    fn()
  }
  return performance.now() - start
}

async function timeAsync(iterations: number, fn: () => Promise<void>) {
  const start = performance.now()
  for (let i = 0; i < iterations; i += 1) {
    await fn()
  }
  return performance.now() - start
}

function makeClickHouseRows(size: number) {
  return Array.from({ length: size }, (_, index) => ({
    event_time: `2026-01-01 ${String(index % 24).padStart(2, '0')}:00:00`,
    query_count: String(index * 13),
    memory_usage: String(1024 * 1024 * (index + 1)),
    max_uint64: '18446744073709551615',
    nested: {
      read_rows: String(index * 100),
      ratio: String((index % 100) / 10),
    },
    values: [String(index), String(index + 1), 'text'],
  }))
}

function makeUserEvents(size: number) {
  const users = ['alice', 'bob', 'carol', 'dave', '']
  return Array.from({ length: size }, (_, index) => ({
    event_time: `2026-01-${String((index % 28) + 1).padStart(2, '0')} ${String(
      index % 24
    ).padStart(2, '0')}:00:00`,
    user: users[index % users.length],
    count: String((index % 100) + 1),
  }))
}

function makeSql(repetitions: number) {
  return Array.from(
    { length: repetitions },
    (_, index) => `
      WITH q_${index} AS (
        SELECT * FROM system.query_log WHERE type = 'QueryFinish'
      )
      SELECT *
      FROM system.tables t
      LEFT JOIN system.parts p ON p.database = t.database AND p.table = t.name
      WHERE EXISTS (SELECT 1 FROM system.backup_log b WHERE b.name = t.name)
    `
  ).join('\nUNION ALL\n')
}

async function benchClickHouseTransform(
  sizeLabel: string,
  size: number,
  iterations: number
): Promise<BenchResult> {
  const data = makeClickHouseRows(size)
  const tsMs = timeSync(iterations, () => {
    transformClickHouseData(data)
  })
  const wasmMs = await timeAsync(iterations, async () => {
    await transformClickHouseDataWasm(data)
  })

  return result('clickhouse-data-transform', sizeLabel, tsMs, wasmMs)
}

async function benchUserEvents(
  sizeLabel: string,
  size: number,
  iterations: number
): Promise<BenchResult> {
  const data = makeUserEvents(size)
  const tsMs = timeSync(iterations, () => {
    transformUserEventCounts(data)
  })
  const wasmMs = await timeAsync(iterations, async () => {
    await transformUserEventCountsWasm(data)
  })

  return result('user-event-transform', sizeLabel, tsMs, wasmMs)
}

async function benchSqlParser(
  sizeLabel: string,
  repetitions: number,
  iterations: number
): Promise<BenchResult> {
  const sql = makeSql(repetitions)
  const tsMs = timeSync(iterations, () => {
    parseTableFromSQL(sql)
  })
  const wasmMs = await timeAsync(iterations, async () => {
    await parseTablesFromSqlWasm(sql)
  })

  return result('sql-table-extraction', sizeLabel, tsMs, wasmMs)
}

function result(
  name: string,
  size: string,
  tsMs: number,
  wasmMs: number
): BenchResult {
  return {
    name,
    size,
    tsMs,
    wasmMs,
    speedup: tsMs / wasmMs,
  }
}

const results = [
  await benchClickHouseTransform('small', 100, 100),
  await benchClickHouseTransform('medium', 2_500, 25),
  await benchClickHouseTransform('large', 25_000, 5),
  await benchUserEvents('small', 100, 100),
  await benchUserEvents('medium', 2_500, 25),
  await benchUserEvents('large', 25_000, 5),
  await benchSqlParser('small', 5, 250),
  await benchSqlParser('medium', 50, 100),
  await benchSqlParser('large', 500, 10),
]

console.table(
  results.map((item) => ({
    name: item.name,
    size: item.size,
    'ts ms': item.tsMs.toFixed(2),
    'wasm ms': item.wasmMs.toFixed(2),
    speedup: `${item.speedup.toFixed(2)}x`,
    promote: item.speedup >= PROMOTION_THRESHOLD ? 'yes' : 'no',
  }))
)

const promotable = results.filter((item) => item.speedup >= PROMOTION_THRESHOLD)
if (promotable.length === 0) {
  console.log(
    `No WASM candidate cleared the ${PROMOTION_THRESHOLD.toFixed(
      1
    )}x promotion threshold. Runtime TypeScript paths remain unchanged.`
  )
}
