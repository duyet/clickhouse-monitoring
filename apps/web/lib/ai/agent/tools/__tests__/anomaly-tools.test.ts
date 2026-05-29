import { describe, expect, mock, test } from 'bun:test'

mock.module('server-only', () => ({}))

let throwError = false

// Track how many times each pattern is queried
const queryValues: Record<string, number[]> = {}

mock.module('../helpers', () => ({
  readOnlyQuery: async ({ query }: { query: string }) => {
    if (throwError) throw new Error('Connection refused')

    // Match by distinctive substrings in order of specificity
    // IMPORTANT: Check BETWEEN patterns FIRST since they are more specific
    if (
      query.includes('BETWEEN now() - INTERVAL 25 HOUR') &&
      query.includes('asynchronous_metric_log')
    ) {
      // memory baseline
      const vals = queryValues['memoryBaseline']
      return vals?.length ? [{ value: vals[0] }] : []
    }
    if (
      query.includes('BETWEEN now() - INTERVAL 25 HOUR') &&
      query.includes('ExceptionWhileProcessing')
    ) {
      // error_rate baseline
      const vals = queryValues['errorRateBaseline']
      return vals?.length ? [{ value: vals[0] }] : []
    }
    if (
      query.includes('BETWEEN now() - INTERVAL 25 HOUR') &&
      query.includes('quantile')
    ) {
      // p95 baseline
      const vals = queryValues['p95Baseline']
      return vals?.length ? [{ value: vals[0] }] : []
    }
    if (
      query.includes('BETWEEN now() - INTERVAL 25 HOUR') &&
      query.includes('count() / 24.0')
    ) {
      // volume baseline
      const vals = queryValues['volumeBaseline']
      return vals?.length ? [{ value: vals[0] }] : []
    }
    if (query.includes('ExceptionWhileProcessing')) {
      // error_rate recent
      const vals = queryValues['errorRateRecent']
      return vals?.length ? [{ value: vals[0] }] : []
    }
    if (query.includes('quantile(0.95)')) {
      // p95 recent
      const vals = queryValues['p95Recent']
      return vals?.length ? [{ value: vals[0] }] : []
    }
    if (
      query.includes('event_time > now()') &&
      query.includes('QueryFinish') &&
      query.includes('count() as value')
    ) {
      // volume recent
      const vals = queryValues['volumeRecent']
      return vals?.length ? [{ value: vals[0] }] : []
    }
    if (query.includes('system.metrics') && query.includes('MemoryTracking')) {
      // memory recent
      const vals = queryValues['memoryRecent']
      return vals?.length ? [{ value: vals[0] }] : []
    }
    if (query.includes('system.parts WHERE active')) {
      // parts (both recent and baseline use same query)
      const vals = queryValues['partsCount']
      return vals?.length ? [{ value: vals[0] }] : []
    }

    return []
  },
  resolveHostId: (tool: number | undefined, def: number) => tool ?? def,
  hostIdSchema: {},
}))

const { createAnomalyTools } = await import('../anomaly-tools')

function setupMetrics(values: {
  errorRateRecent?: number
  errorRateBaseline?: number
  p95Recent?: number
  p95Baseline?: number
  volumeRecent?: number
  volumeBaseline?: number
  memoryRecent?: number
  memoryBaseline?: number
  partsCount?: number
}) {
  for (const k of Object.keys(queryValues)) delete queryValues[k]
  for (const [k, v] of Object.entries(values)) {
    if (v !== undefined) queryValues[k] = [v]
  }
}

describe('createAnomalyTools', () => {
  test('creates detect_anomalies tool', () => {
    const tools = createAnomalyTools(0)
    expect(tools.detect_anomalies).toBeDefined()
    expect(tools.detect_anomalies.description).toContain('anomalies')
  })

  test('returns no anomalies when all metrics are stable', async () => {
    throwError = false
    setupMetrics({
      errorRateRecent: 5,
      errorRateBaseline: 5,
      p95Recent: 100,
      p95Baseline: 100,
      volumeRecent: 100,
      volumeBaseline: 100,
      memoryRecent: 100,
      memoryBaseline: 100,
      partsCount: 50,
    })

    const tools = createAnomalyTools(0)
    const result = await tools.detect_anomalies.execute({})

    expect(result.anomalies_found).toBe(0)
    expect(result.total_checks).toBe(5)
    expect(result.summary).toContain('No anomalies')
  })

  test('detects critical error_rate anomaly', async () => {
    throwError = false
    // recent=20%, baseline=5% => 300% => critical (>100%)
    setupMetrics({
      errorRateRecent: 20,
      errorRateBaseline: 5,
      p95Recent: 100,
      p95Baseline: 100,
      volumeRecent: 100,
      volumeBaseline: 100,
      memoryRecent: 100,
      memoryBaseline: 100,
      partsCount: 50,
    })

    const tools = createAnomalyTools(0)
    const result = await tools.detect_anomalies.execute({})

    expect(result.anomalies_found).toBeGreaterThanOrEqual(1)
    const errorMetric = result.results.find(
      (r: { metric: string }) => r.metric === 'error_rate'
    )
    expect(errorMetric.severity).toBe('critical')
    expect(errorMetric.change_percent).toBeGreaterThan(100)
  })

  test('detects critical memory_usage anomaly', async () => {
    throwError = false
    // recent=200, baseline=100 => 100% => critical (>80%)
    setupMetrics({
      errorRateRecent: 5,
      errorRateBaseline: 5,
      p95Recent: 100,
      p95Baseline: 100,
      volumeRecent: 100,
      volumeBaseline: 100,
      memoryRecent: 200,
      memoryBaseline: 100,
      partsCount: 50,
    })

    const tools = createAnomalyTools(0)
    const result = await tools.detect_anomalies.execute({})

    const mem = result.results.find(
      (r: { metric: string }) => r.metric === 'memory_usage'
    )
    expect(mem.severity).toBe('critical')
  })

  test('detects warning memory_usage anomaly', async () => {
    throwError = false
    // recent=150, baseline=100 => 50% => warning (>40%, not >80%)
    setupMetrics({
      errorRateRecent: 5,
      errorRateBaseline: 5,
      p95Recent: 100,
      p95Baseline: 100,
      volumeRecent: 100,
      volumeBaseline: 100,
      memoryRecent: 150,
      memoryBaseline: 100,
      partsCount: 50,
    })

    const tools = createAnomalyTools(0)
    const result = await tools.detect_anomalies.execute({})

    const mem = result.results.find(
      (r: { metric: string }) => r.metric === 'memory_usage'
    )
    expect(mem.severity).toBe('warning')
  })

  test('detects critical generic anomaly for query_volume', async () => {
    throwError = false
    // recent=300, baseline=100 => 200% => critical (generic threshold >100%)
    setupMetrics({
      errorRateRecent: 5,
      errorRateBaseline: 5,
      p95Recent: 100,
      p95Baseline: 100,
      volumeRecent: 300,
      volumeBaseline: 100,
      memoryRecent: 100,
      memoryBaseline: 100,
      partsCount: 50,
    })

    const tools = createAnomalyTools(0)
    const result = await tools.detect_anomalies.execute({})

    const vol = result.results.find(
      (r: { metric: string }) => r.metric === 'query_volume'
    )
    expect(vol.severity).toBe('critical')
  })

  test('handles empty results gracefully', async () => {
    throwError = false
    for (const k of Object.keys(queryValues)) delete queryValues[k]

    const tools = createAnomalyTools(0)
    const result = await tools.detect_anomalies.execute({})

    expect(result.total_checks).toBe(5)
    expect(result.anomalies_found).toBe(0)
    for (const r of result.results) {
      expect(r.status).toBe('insufficient_data')
    }
  })

  test('handles query errors gracefully', async () => {
    throwError = true

    const tools = createAnomalyTools(0)
    const result = await tools.detect_anomalies.execute({})

    expect(result.total_checks).toBe(5)
    for (const r of result.results) {
      expect(r.status).toBe('error')
      expect(r.error).toBe('Connection refused')
    }

    throwError = false
  })

  test('resolves hostId from input', async () => {
    throwError = false
    for (const k of Object.keys(queryValues)) delete queryValues[k]

    const tools = createAnomalyTools(0)
    const result = await tools.detect_anomalies.execute({ hostId: 2 })
    expect(result.total_checks).toBe(5)
  })
})
