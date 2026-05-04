/**
 * Smoke Test for ClickHouse Monitor deployment
 *
 * Tests all chart API endpoints on all configured hosts.
 * Run: bun scripts/smoke-test.ts [--base-url URL] [--fix]
 *
 * Exit codes:
 *   0 - All tests pass
 *   1 - Some tests failed (print summary)
 *
 * Flags:
 *   --base-url URL  Target deployment (default: https://clickhouse.duyet.net)
 *   --fix           Attempt to auto-fix known issues
 *   --json          Output results as JSON
 *   --verbose       Print per-chart details for passing tests too
 */

const args = process.argv.slice(2)
const BASE_URL =
  args.find((a) => a.startsWith('--base-url='))?.split('=')[1] ||
  (args.indexOf('--base-url') !== -1
    ? args[args.indexOf('--base-url') + 1]
    : undefined) ||
  'https://clickhouse.duyet.net'
const JSON_OUTPUT = args.includes('--json')
const VERBOSE = args.includes('--verbose')

interface TestResult {
  chart: string
  hostId: number
  success: boolean
  rows: number
  error?: string
  durationMs: number
}

async function fetchJSON(url: string): Promise<any> {
  const res = await fetch(url, { signal: AbortSignal.timeout(30_000) })
  return res.json()
}

async function getHostCount(): Promise<number> {
  const d = await fetchJSON(`${BASE_URL}/api/v1/hosts`)
  if (d.success && Array.isArray(d.data)) return d.data.length
  // Fallback: try data API with incrementing hostId
  for (let i = 0; i < 10; i++) {
    try {
      const r = await fetchJSON(
        `${BASE_URL}/api/v1/data?hostId=${i}&sql=SELECT+1`
      )
      if (!r.success) return i
    } catch {
      return i
    }
  }
  return 2
}

async function getChartList(): Promise<string[]> {
  const d = await fetchJSON(`${BASE_URL}/api/v1/charts/nonexistent?hostId=0`)
  const list = d?.error?.details?.availableCharts as string
  if (!list) throw new Error('Could not fetch chart list from API')
  return list.split(', ').map((s: string) => s.trim())
}

async function testChart(chart: string, hostId: number): Promise<TestResult> {
  const start = Date.now()
  try {
    const d = await fetchJSON(
      `${BASE_URL}/api/v1/charts/${chart}?hostId=${hostId}`
    )
    return {
      chart,
      hostId,
      success: d.success === true,
      rows: d.metadata?.rows ?? 0,
      error: d.success ? undefined : d.error?.message?.slice(0, 120),
      durationMs: Date.now() - start,
    }
  } catch (err: any) {
    return {
      chart,
      hostId,
      success: false,
      rows: 0,
      error: err.message?.slice(0, 120) ?? String(err),
      durationMs: Date.now() - start,
    }
  }
}

// Known issues that are expected on certain hosts (not actionable)
const KNOWN_ISSUES: Record<string, string> = {
  'system.crash_log':
    'crash_log table not enabled in ClickHouse config (expected)',
}

function isKnownIssue(error?: string): string | null {
  if (!error) return null
  for (const [pattern, reason] of Object.entries(KNOWN_ISSUES)) {
    if (error.includes(pattern)) return reason
  }
  return null
}

async function main() {
  if (!JSON_OUTPUT) {
    console.log(`Smoke Test: ${BASE_URL}`)
    console.log('─'.repeat(60))
  }

  const [hostCount, charts] = await Promise.all([
    getHostCount(),
    getChartList(),
  ])

  if (!JSON_OUTPUT) {
    console.log(`Hosts: ${hostCount} | Charts: ${charts.length}`)
    console.log('─'.repeat(60))
  }

  const results: TestResult[] = []

  // Run all chart tests across all hosts
  const promises: Promise<TestResult>[] = []
  for (let hostId = 0; hostId < hostCount; hostId++) {
    for (const chart of charts) {
      promises.push(testChart(chart, hostId))
    }
  }
  results.push(...(await Promise.all(promises)))

  // Categorize results
  const passed = results.filter((r) => r.success)
  const failed = results.filter((r) => !r.success && !isKnownIssue(r.error))
  const knownFailures = results.filter(
    (r) => !r.success && isKnownIssue(r.error)
  )

  // Print results
  if (JSON_OUTPUT) {
    console.log(
      JSON.stringify(
        {
          baseUrl: BASE_URL,
          hostCount,
          chartCount: charts.length,
          totalTests: results.length,
          passed: passed.length,
          failed: failed.length,
          knownFailures: knownFailures.length,
          results,
        },
        null,
        2
      )
    )
  } else {
    // Print failures
    if (failed.length > 0) {
      console.log(`\nFAILURES (${failed.length}):`)
      for (const r of failed) {
        console.log(`  ❌ H${r.hostId} ${r.chart}: ${r.error}`)
      }
    }

    if (knownFailures.length > 0) {
      console.log(`\nKNOWN ISSUES (${knownFailures.length}):`)
      for (const r of knownFailures) {
        console.log(`  ⚠️  H${r.hostId} ${r.chart}: ${isKnownIssue(r.error)}`)
      }
    }

    if (VERBOSE && passed.length > 0) {
      console.log(`\nPASSED (${passed.length}):`)
      for (const r of passed) {
        console.log(`  ✅ H${r.hostId} ${r.chart} (${r.rows} rows)`)
      }
    }

    console.log('\n' + '─'.repeat(60))
    console.log(
      `Total: ${results.length} | ✅ Pass: ${passed.length} | ❌ Fail: ${failed.length} | ⚠️  Known: ${knownFailures.length}`
    )

    if (failed.length === 0) {
      console.log('All charts operational on all hosts.')
    }
  }

  process.exit(failed.length > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error('Smoke test failed:', err)
  process.exit(2)
})
