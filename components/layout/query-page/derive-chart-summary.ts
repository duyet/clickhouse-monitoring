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

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function detectValueFields(row: ChartDataPoint): string[] {
  return Object.keys(row).filter((key) => {
    if (TIME_FIELDS.has(key)) return false
    return isFiniteNumber(row[key])
  })
}

function rowTotal(row: ChartDataPoint, fields: string[]): number | null {
  let total = 0
  let any = false
  for (const field of fields) {
    const v = row[field]
    if (isFiniteNumber(v)) {
      total += v
      any = true
    }
  }
  return any ? total : null
}

const SPARK_LENGTH = 20

export function deriveChartSummary(
  data: ChartDataPoint[] | undefined,
  valueField?: string
): ChartSummary {
  if (!data || data.length === 0) return EMPTY

  const fields = valueField ? [valueField] : detectValueFields(data[0])
  if (fields.length === 0) return EMPTY

  const series: number[] = []
  for (const row of data) {
    const total = rowTotal(row, fields)
    if (total !== null) series.push(total)
  }
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
