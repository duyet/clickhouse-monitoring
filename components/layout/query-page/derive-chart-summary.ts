import type { ChartDataPoint } from '@/types/chart-data'

export interface ChartSummary {
  latest: number | null
  prev: number | null
  spark: number[]
  deltaPct: number | null
  trend: 'up' | 'down' | 'flat' | null
}

const EMPTY: ChartSummary = {
  latest: null,
  prev: null,
  spark: [],
  deltaPct: null,
  trend: null,
}

const TIME_FIELDS = new Set([
  'event_time',
  'event_date',
  'bucket',
  't',
  'time',
  'timestamp',
  'date',
])

const IGNORED_FIELD_PATTERNS = [
  /^pct_/i,
  /_pct$/i,
  /^percent_/i,
  /_percent$/i,
  /^readable_/i,
  /_readable$/i,
]

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isIgnoredField(key: string): boolean {
  return IGNORED_FIELD_PATTERNS.some((pattern) => pattern.test(key))
}

function detectValueField(data: ChartDataPoint[]): string | null {
  for (const row of data) {
    for (const key of Object.keys(row)) {
      if (TIME_FIELDS.has(key) || isIgnoredField(key)) continue
      if (isFiniteNumber(row[key])) return key
    }
  }
  return null
}

function detectTimeField(data: ChartDataPoint[]): string | null {
  for (const row of data) {
    for (const key of Object.keys(row)) {
      if (TIME_FIELDS.has(key)) return key
    }
  }
  return null
}

/**
 * Build the time-ordered numeric series for a chart.
 *
 * If a time field is present, multiple rows sharing the same time bucket
 * are summed (e.g. `query-count-by-user` returns one row per user per
 * bucket — we collapse to a per-bucket total). Otherwise rows are taken
 * as-is, one point per row.
 */
function buildSeries(
  data: ChartDataPoint[],
  valueField: string,
  timeField: string | null
): number[] {
  if (!timeField) {
    const series: number[] = []
    for (const row of data) {
      const v = row[valueField]
      if (isFiniteNumber(v)) series.push(v)
    }
    return series
  }

  const buckets = new Map<string, number>()
  const order: string[] = []
  for (const row of data) {
    const v = row[valueField]
    if (!isFiniteNumber(v)) continue
    const key = String(row[timeField] ?? '')
    if (!buckets.has(key)) {
      buckets.set(key, 0)
      order.push(key)
    }
    buckets.set(key, (buckets.get(key) ?? 0) + v)
  }
  return order.map((k) => buckets.get(k) ?? 0)
}

const SPARK_LENGTH = 20

export function deriveChartSummary(
  data: ChartDataPoint[] | undefined,
  valueField?: string
): ChartSummary {
  if (!data || data.length === 0) return EMPTY

  const field = valueField ?? detectValueField(data)
  if (!field) return EMPTY

  const timeField = detectTimeField(data)
  const series = buildSeries(data, field, timeField)
  if (series.length === 0) return EMPTY

  const latest = series[series.length - 1]
  const prev = series.length > 1 ? series[series.length - 2] : null
  const spark = series.slice(-SPARK_LENGTH)

  let deltaPct: number | null = null
  let trend: ChartSummary['trend'] = null
  if (prev !== null && prev !== 0) {
    deltaPct = ((latest - prev) / Math.abs(prev)) * 100
    if (Math.abs(deltaPct) < 0.5) trend = 'flat'
    else trend = deltaPct > 0 ? 'up' : 'down'
  } else if (prev !== null) {
    trend = latest > 0 ? 'up' : 'flat'
  }

  return { latest, prev, spark, deltaPct, trend }
}
