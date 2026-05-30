/**
 * Compact a duration in seconds as a `{value, unit}` pair, e.g. `28.1 s`,
 * `4.2 m`, `1.3 h`.
 */
export function formatDuration(seconds: number): {
  value: string
  unit: string
} {
  if (!Number.isFinite(seconds) || seconds < 0)
    return { value: '0.0', unit: 's' }
  if (seconds < 60) return { value: seconds.toFixed(1), unit: 's' }
  if (seconds < 3600) return { value: (seconds / 60).toFixed(1), unit: 'm' }
  return { value: (seconds / 3600).toFixed(1), unit: 'h' }
}
