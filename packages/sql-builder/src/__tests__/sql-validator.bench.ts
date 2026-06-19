/**
 * SQL Validator benchmark
 *
 * Standalone throughput + ReDoS-safety benchmark for {@link validateSqlQuery}.
 * Run with: `bun run src/__tests__/sql-validator.bench.ts` (from this package).
 *
 * Not part of the test suite — it prints timings for manual inspection and
 * exits non-zero only if the adversarial case shows catastrophic backtracking,
 * so it can double as a coarse CI smoke check if wired up.
 */
import { validateSqlQuery } from '../sql-validator'

const LEGIT_CORPUS = [
  "SELECT replace(query, 'a', 'b') FROM system.query_log",
  "SELECT * FROM system.query_log WHERE type = 'ExceptionBeforeStart' OR type = 'ExceptionWhileProcessing'",
  'SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3',
  'WITH t AS (SELECT 1 AS x) SELECT * FROM t',
  "SELECT formatReadableSize(sum(bytes_on_disk)) FROM system.parts WHERE active AND database = 'default'",
  'SELECT count() FROM system.tables',
]

function bench(label: string, fn: () => void, iters: number): number {
  // warmup
  for (let i = 0; i < 1000; i++) fn()
  const start = performance.now()
  for (let i = 0; i < iters; i++) fn()
  const elapsed = performance.now() - start
  const perOp = (elapsed / iters) * 1000 // µs
  console.log(
    `${label.padEnd(28)} ${iters} ops in ${elapsed.toFixed(1)}ms  (${perOp.toFixed(3)} µs/op)`
  )
  return elapsed
}

console.log('=== validateSqlQuery benchmark ===\n')

bench(
  'legit corpus',
  () => {
    for (const sql of LEGIT_CORPUS) {
      try {
        validateSqlQuery(sql)
      } catch {
        /* ignore */
      }
    }
  },
  50_000
)

// ReDoS check: adversarial input that would explode under nested `.*` patterns.
const adversarial = `SELECT * FROM t WHERE x = '${"a' OR 'a".repeat(5000)}`
const adversarialMs = bench(
  'adversarial (ReDoS)',
  () => {
    try {
      validateSqlQuery(adversarial)
    } catch {
      /* ignore */
    }
  },
  100
)

const perAdversarial = adversarialMs / 100
console.log(`\nadversarial per-op: ${perAdversarial.toFixed(2)}ms`)
if (perAdversarial > 50) {
  console.error('FAIL: adversarial input shows super-linear behavior (ReDoS)')
  process.exit(1)
}
console.log('OK: no catastrophic backtracking detected')
