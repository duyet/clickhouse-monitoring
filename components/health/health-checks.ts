import type { Thresholds } from '@/lib/health/thresholds-storage'

export interface HealthCheckDef {
  id: string
  title: string
  chartName: string
  /** Field on first data row to read the numeric value from. */
  valueKey: string
  /** Default warning/critical thresholds. */
  defaults: Thresholds
  /** Human-readable label for the value (lowercase). */
  unit?: string
  /** Format the displayed label. */
  formatLabel?: (value: number | null) => string
  /** Format the displayed value (defaults to toLocaleString). */
  formatValue?: (value: number | null) => string
}

const fmtCount = (singular: string, plural?: string) => (v: number | null) => {
  const n = v ?? 0
  return `${n.toLocaleString()} ${n === 1 ? singular : (plural ?? `${singular}s`)}`
}

export const HEALTH_CHECKS: readonly HealthCheckDef[] = [
  {
    id: 'readonly-replicas',
    title: 'Readonly Replicas',
    chartName: 'health-readonly-replicas',
    valueKey: 'readonly_count',
    defaults: { warning: 1, critical: 3 },
    formatLabel: fmtCount('readonly replica'),
  },
  {
    id: 'delayed-inserts',
    title: 'Delayed Inserts',
    chartName: 'health-delayed-inserts',
    valueKey: 'delayed_inserts',
    defaults: { warning: 1, critical: 5 },
    formatLabel: fmtCount('delayed insert'),
  },
  {
    id: 'max-parts',
    title: 'Max Parts / Partition',
    chartName: 'health-max-part-count',
    valueKey: 'part_count',
    defaults: { warning: 150, critical: 300 },
    formatLabel: (v) => `${(v ?? 0).toLocaleString()} parts (max partition)`,
  },
  {
    id: 'long-running-queries',
    title: 'Long-Running Queries',
    chartName: 'health-long-running-queries',
    valueKey: 'long_running',
    defaults: { warning: 1, critical: 5 },
    formatLabel: (v) => `${(v ?? 0).toLocaleString()} queries > 60s`,
  },
  {
    id: 'oom-killed',
    title: 'OOM-Killed Queries (1h)',
    chartName: 'health-oom-killed-recent',
    valueKey: 'oom_count',
    defaults: { warning: 1, critical: 10 },
    formatLabel: (v) => `${(v ?? 0).toLocaleString()} OOM kills in last hour`,
  },
  {
    id: 'failed-queries',
    title: 'Failed Queries (1h)',
    chartName: 'health-failed-queries-recent',
    valueKey: 'failed_count',
    defaults: { warning: 10, critical: 100 },
    formatLabel: (v) =>
      `${(v ?? 0).toLocaleString()} failed queries in last hour`,
  },
  {
    id: 'replication-lag',
    title: 'Replication Lag',
    chartName: 'health-replication-lag',
    valueKey: 'max_lag',
    defaults: { warning: 30, critical: 300 },
    formatLabel: (v) => `${(v ?? 0).toLocaleString()}s max delay`,
  },
  {
    id: 'keeper-exceptions',
    title: 'Keeper Exceptions (1h)',
    chartName: 'health-keeper-exceptions-recent',
    valueKey: 'exception_count',
    defaults: { warning: 1, critical: 20 },
    formatLabel: (v) => `${(v ?? 0).toLocaleString()} exceptions in last hour`,
  },
  {
    id: 'memory-percent',
    title: 'Memory Usage',
    chartName: 'health-memory-percent',
    valueKey: 'memory_percent',
    defaults: { warning: 80, critical: 95 },
    formatLabel: (v) => `${v ?? 0}% of OS memory`,
    formatValue: (v) => (v == null ? '—' : `${v}%`),
  },
  {
    id: 'disk-percent',
    title: 'Disk Usage',
    chartName: 'health-disk-percent',
    valueKey: 'disk_percent',
    defaults: { warning: 80, critical: 95 },
    formatLabel: (v) => `${v ?? 0}% used (worst disk)`,
    formatValue: (v) => (v == null ? '—' : `${v}%`),
  },
] as const
