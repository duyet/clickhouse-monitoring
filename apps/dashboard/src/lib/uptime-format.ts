const UPTIME_PART_PATTERN = /(\d+(?:\.\d+)?)\s+([a-zA-Z]+)/g

type UptimePart = {
  value: string
  unit: string
}

function parseUptimeParts(uptime: string): UptimePart[] {
  return Array.from(uptime.matchAll(UPTIME_PART_PATTERN), (match) => ({
    value: match[1],
    unit: match[2].toLowerCase(),
  }))
}

function formatUptimeParts(parts: UptimePart[]): string {
  if (parts.length === 0) return ''

  const labels = parts.map(({ value, unit }) => `${value} ${unit}`)

  if (labels.length === 1) return labels[0]
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`

  return `${labels.slice(0, -1).join(', ')} and ${labels.at(-1)}`
}

function withoutUnit(parts: UptimePart[], unitPrefix: string): UptimePart[] {
  return parts.filter((part) => !part.unit.startsWith(unitPrefix))
}

function unique(items: string[]): string[] {
  return Array.from(new Set(items.filter(Boolean)))
}

export function getResponsiveUptimeLabels(uptime: string): string[] {
  const trimmed = uptime.trim()
  if (!trimmed) return []

  const parts = parseUptimeParts(trimmed)
  if (parts.length === 0) return [`up ${trimmed}`]

  const withoutSeconds = withoutUnit(parts, 'second')
  const withoutMinutes = withoutUnit(withoutSeconds, 'minute')

  return unique([
    `up ${formatUptimeParts(parts)}`,
    `up ${formatUptimeParts(withoutSeconds)}`,
    `up ${formatUptimeParts(withoutMinutes)}`,
  ])
}
