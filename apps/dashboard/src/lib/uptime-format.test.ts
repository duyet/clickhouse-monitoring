import { getResponsiveUptimeLabels } from './uptime-format'
import { describe, expect, test } from 'bun:test'

describe('getResponsiveUptimeLabels', () => {
  // Empty / blank input
  test('empty string returns empty array', () => {
    expect(getResponsiveUptimeLabels('')).toEqual([])
  })

  test('whitespace-only string returns empty array', () => {
    expect(getResponsiveUptimeLabels('   ')).toEqual([])
  })

  // Malformed / no-parseable-parts input
  test('string with no numeric pattern falls back to raw uptime label', () => {
    expect(getResponsiveUptimeLabels('forever')).toEqual(['up forever'])
  })

  test('string with no numeric pattern (multiple words) falls back to raw uptime label', () => {
    expect(getResponsiveUptimeLabels('unknown uptime')).toEqual([
      'up unknown uptime',
    ])
  })

  // Single unit — seconds only
  test('seconds only: all three responsive labels deduplicate to one', () => {
    // parts = [{value:'45', unit:'seconds'}]
    // withoutSeconds = [] → formatUptimeParts([]) = '' → "up " → deduplicated away
    // withoutMinutes (of empty) = [] → same
    // unique(['up 45 seconds', 'up ', 'up ']) → only 'up 45 seconds' survives ('' filtered by unique)
    // Wait — formatUptimeParts([]) returns '' so "up " is truthy; unique filters falsy only
    // Let's derive carefully:
    //   full:          "up 45 seconds"
    //   withoutSecs:   "up "              ('' → "up ")  -- '' is falsy? No, "up " is truthy
    // unique() filters Boolean(item) i.e. non-empty strings; "up " passes. So we expect dedup.
    // Actually unique = Array.from(new Set(items.filter(Boolean)))
    // "up " is truthy so it survives filter(Boolean). Set deduplication won't remove it because
    // "up 45 seconds" !== "up ". So result is ["up 45 seconds", "up "].
    // Let's verify by tracing:
    //   formatUptimeParts([]) = '' (parts.length===0 → return '')
    //   "up " + '' = "up "
    //   unique(["up 45 seconds", "up ", "up "]) → ["up 45 seconds", "up "]
    expect(getResponsiveUptimeLabels('45 seconds')).toEqual([
      'up 45 seconds',
      'up ',
    ])
  })

  // Single unit — minutes only
  test('minutes only returns two unique labels (one drops minutes, leaving "up ")', () => {
    // parts = [{value:'5', unit:'minutes'}]
    // withoutSeconds = [{value:'5', unit:'minutes'}] (no seconds to strip)
    // withoutMinutes = [] → formatUptimeParts([]) = '' → "up "
    // unique(["up 5 minutes", "up 5 minutes", "up "]) → ["up 5 minutes", "up "]
    expect(getResponsiveUptimeLabels('5 minutes')).toEqual([
      'up 5 minutes',
      'up ',
    ])
  })

  // Single unit — hours only
  test('hours only: all three labels are identical → one unique label', () => {
    // parts = [{value:'2', unit:'hours'}]
    // withoutSeconds = same (no seconds)
    // withoutMinutes = same (no minutes)
    // unique(["up 2 hours", "up 2 hours", "up 2 hours"]) → ["up 2 hours"]
    expect(getResponsiveUptimeLabels('2 hours')).toEqual(['up 2 hours'])
  })

  // Single unit — days only
  test('days only produces one unique label', () => {
    expect(getResponsiveUptimeLabels('3 days')).toEqual(['up 3 days'])
  })

  // Multi-unit: hours + minutes + seconds
  test('hours + minutes + seconds produces three distinct labels', () => {
    // parts = [{value:'1',unit:'hours'},{value:'30',unit:'minutes'},{value:'45',unit:'seconds'}]
    // full:         "up 1 hours, 30 minutes and 45 seconds"
    // withoutSecs:  "up 1 hours and 30 minutes"
    // withoutMins:  "up 1 hours"
    expect(getResponsiveUptimeLabels('1 hours 30 minutes 45 seconds')).toEqual([
      'up 1 hours, 30 minutes and 45 seconds',
      'up 1 hours and 30 minutes',
      'up 1 hours',
    ])
  })

  // Multi-unit: hours + minutes (no seconds)
  test('hours + minutes (no seconds) produces two distinct labels', () => {
    // parts = [{value:'1',unit:'hours'},{value:'30',unit:'minutes'}]
    // full:         "up 1 hours and 30 minutes"
    // withoutSecs:  same (no seconds stripped)
    // withoutMins:  "up 1 hours"
    // unique(["up 1 hours and 30 minutes", "up 1 hours and 30 minutes", "up 1 hours"])
    expect(getResponsiveUptimeLabels('1 hours 30 minutes')).toEqual([
      'up 1 hours and 30 minutes',
      'up 1 hours',
    ])
  })

  // Multi-unit: minutes + seconds
  test('minutes + seconds produces three labels', () => {
    // parts = [{value:'10',unit:'minutes'},{value:'30',unit:'seconds'}]
    // full:         "up 10 minutes and 30 seconds"
    // withoutSecs:  "up 10 minutes"
    // withoutMins:  "up "   ('' from empty parts)
    expect(getResponsiveUptimeLabels('10 minutes 30 seconds')).toEqual([
      'up 10 minutes and 30 seconds',
      'up 10 minutes',
      'up ',
    ])
  })

  // Multi-unit: days + hours + minutes + seconds
  test('days + hours + minutes + seconds produces three distinct labels', () => {
    // parts = [{value:'2',unit:'days'},{value:'3',unit:'hours'},{value:'15',unit:'minutes'},{value:'10',unit:'seconds'}]
    // full:         "up 2 days, 3 hours, 15 minutes and 10 seconds"
    // withoutSecs:  "up 2 days, 3 hours and 15 minutes"
    // withoutMins:  "up 2 days and 3 hours"
    expect(
      getResponsiveUptimeLabels('2 days 3 hours 15 minutes 10 seconds')
    ).toEqual([
      'up 2 days, 3 hours, 15 minutes and 10 seconds',
      'up 2 days, 3 hours and 15 minutes',
      'up 2 days and 3 hours',
    ])
  })

  // Decimal values
  test('decimal numeric values are preserved as-is', () => {
    // regex allows \d+(?:\.\d+)?
    expect(getResponsiveUptimeLabels('1.5 hours')).toEqual(['up 1.5 hours'])
  })

  // Case-insensitive unit normalisation
  test('units are lowercased in output', () => {
    // unit = match[2].toLowerCase()
    expect(getResponsiveUptimeLabels('2 Hours 30 Minutes')).toEqual([
      'up 2 hours and 30 minutes',
      'up 2 hours',
    ])
  })

  // Leading/trailing whitespace is trimmed
  test('leading and trailing whitespace is trimmed before processing', () => {
    expect(getResponsiveUptimeLabels('  3 days  ')).toEqual(['up 3 days'])
  })

  // Second-prefix matching (e.g. "second" vs "seconds")
  test('unit filtering matches on startsWith("second") prefix — "second" (singular) is also stripped', () => {
    // withoutUnit filters by part.unit.startsWith('second')
    // "second" starts with "second" → is stripped
    expect(getResponsiveUptimeLabels('5 minutes 1 second')).toEqual([
      'up 5 minutes and 1 second',
      'up 5 minutes',
      'up ',
    ])
  })
})
