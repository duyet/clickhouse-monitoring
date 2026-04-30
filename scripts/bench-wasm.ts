import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { performance } from 'node:perf_hooks'
import { transformClickHouseData } from '@/lib/api/transform-data'
import { transformUserEventCounts } from '@/lib/chart-data-transforms'
import { parseTableFromSQL } from '@/lib/table-validator'
import {
  parseTablesFromSqlWasm,
  transformClickHouseDataWasm,
  transformClickHouseJsonEachRowWasm,
  transformClickHouseJsonEachRowWasmJson,
  transformUserEventCountsWasm,
} from '@/lib/wasm/monitor-core'

const PROMOTION_THRESHOLD = 1.2
const monitorCoreBinary = resolve(
  import.meta.dir,
  '../rust/monitor-core/target/release/monitor-core'
)

type BenchResult = {
  name: string
  size: string
  tsMs: number
  candidateMs: number
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

function makeClickHouseJsonEachRow(size: number) {
  return makeClickHouseRows(size)
    .map((row) => JSON.stringify(row))
    .join('\n')
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
  const ctes = Array.from(
    { length: repetitions },
    (_, index) => `q_${index} AS (
      SELECT * FROM system.query_log WHERE type = 'QueryFinish'
    )`
  )

  const selects = Array.from(
    { length: repetitions },
    (_, index) => `
      SELECT *
      FROM system.tables t
      LEFT JOIN system.parts p ON p.database = t.database AND p.table = t.name
      WHERE EXISTS (SELECT 1 FROM q_${index} q)
        AND EXISTS (SELECT 1 FROM system.backup_log b WHERE b.name = t.name)
    `
  )

  return `WITH ${ctes.join(',\n')}\n${selects.join('\nUNION ALL\n')}`
}

function parseAndTransformClickHouseJsonEachRow(input: string) {
  return transformClickHouseData(
    input
      .split('\n')
      .filter((line) => line.trim().length > 0)
      .map((line) => JSON.parse(line))
  )
}

function transformClickHouseJsonEachRowRustCli(inputPath: string) {
  const result = Bun.spawnSync(
    [monitorCoreBinary, 'normalize-json-each-row', inputPath],
    {
      stdout: 'pipe',
      stderr: 'pipe',
    }
  )

  if (!result.success) {
    throw new Error(result.stderr.toString())
  }

  return result.stdout.toString()
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

async function benchClickHouseJsonEachRowTransform(
  sizeLabel: string,
  size: number,
  iterations: number
): Promise<BenchResult> {
  const data = makeClickHouseJsonEachRow(size)
  const tsMs = timeSync(iterations, () => {
    parseAndTransformClickHouseJsonEachRow(data)
  })
  const wasmMs = await timeAsync(iterations, async () => {
    await transformClickHouseJsonEachRowWasm(data)
  })

  return result('clickhouse-jsoneachrow-to-objects', sizeLabel, tsMs, wasmMs)
}

async function benchClickHouseJsonEachRowCliTransform(
  sizeLabel: string,
  size: number,
  iterations: number
): Promise<BenchResult> {
  const data = makeClickHouseJsonEachRow(size)
  const tsMs = timeSync(iterations, () => {
    JSON.stringify(parseAndTransformClickHouseJsonEachRow(data))
  })
  const wasmMs = await timeAsync(iterations, async () => {
    await transformClickHouseJsonEachRowWasmJson(data)
  })

  return result('clickhouse-jsoneachrow-to-json', sizeLabel, tsMs, wasmMs)
}

function benchClickHouseJsonEachRowNativeCliTransform(
  sizeLabel: string,
  size: number,
  iterations: number
): BenchResult {
  const data = makeClickHouseJsonEachRow(size)
  const tempDir = mkdtempSync(resolve(tmpdir(), 'monitor-core-bench-'))
  const inputPath = resolve(tempDir, 'input.jsonl')
  writeFileSync(inputPath, data)

  try {
    const tsMs = timeSync(iterations, () => {
      JSON.stringify(parseAndTransformClickHouseJsonEachRow(data))
    })
    const candidateMs = timeSync(iterations, () => {
      transformClickHouseJsonEachRowRustCli(inputPath)
    })

    return result(
      'clickhouse-jsoneachrow-native-cli',
      sizeLabel,
      tsMs,
      candidateMs
    )
  } finally {
    rmSync(tempDir, { recursive: true, force: true })
  }
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
  candidateMs: number
): BenchResult {
  return {
    name,
    size,
    tsMs,
    candidateMs,
    speedup: tsMs / candidateMs,
  }
}

await transformClickHouseDataWasm(makeClickHouseRows(1))
await transformClickHouseJsonEachRowWasm(makeClickHouseJsonEachRow(1))
await transformClickHouseJsonEachRowWasmJson(makeClickHouseJsonEachRow(1))
await transformUserEventCountsWasm(makeUserEvents(1))
await parseTablesFromSqlWasm(makeSql(1))

const results = [
  await benchClickHouseTransform('small', 100, 100),
  await benchClickHouseTransform('medium', 2_500, 25),
  await benchClickHouseTransform('large', 25_000, 5),
  await benchClickHouseJsonEachRowTransform('small', 100, 100),
  await benchClickHouseJsonEachRowTransform('medium', 2_500, 25),
  await benchClickHouseJsonEachRowTransform('large', 25_000, 5),
  await benchClickHouseJsonEachRowCliTransform('small', 100, 100),
  await benchClickHouseJsonEachRowCliTransform('medium', 2_500, 25),
  await benchClickHouseJsonEachRowCliTransform('large', 25_000, 5),
  benchClickHouseJsonEachRowNativeCliTransform('small', 100, 100),
  benchClickHouseJsonEachRowNativeCliTransform('medium', 2_500, 25),
  benchClickHouseJsonEachRowNativeCliTransform('large', 25_000, 5),
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
    'candidate ms': item.candidateMs.toFixed(2),
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
} else {
  console.log(
    `Promotable candidate(s): ${promotable
      .map((item) => `${item.name}/${item.size} ${item.speedup.toFixed(2)}x`)
      .join(', ')}`
  )
}
