import { describe, expect, test } from 'bun:test'
import { buildAgentGreeting } from '@/lib/hooks/use-agent-greeting'

const at = (hour: number) =>
  new Date(`2026-05-23T${String(hour).padStart(2, '0')}:00:00Z`)

describe('buildAgentGreeting', () => {
  test('uses an alert heading when the cluster has an issue', () => {
    const result = buildAgentGreeting({
      firstName: 'Duyet',
      hasClusterIssue: true,
      now: at(10),
    })

    expect(result.tone).toBe('alert')
    expect(result.heading).toContain('Duyet')
  })

  test('returns a morning greeting before noon (local time)', () => {
    const result = buildAgentGreeting({
      firstName: 'Duyet',
      // Use a local Date so the test follows the same clock as the helper.
      now: new Date(2026, 4, 23, 9, 0, 0),
    })

    expect(result.tone).toBe('default')
    expect(result.heading.toLowerCase()).toContain('morning')
    expect(result.heading).toContain('Duyet')
  })

  test('falls back to a generic greeting when no name is given', () => {
    const result = buildAgentGreeting({
      now: new Date(2026, 4, 23, 9, 0, 0),
    })

    expect(result.heading).not.toMatch(/, ,/)
    expect(result.heading.length).toBeGreaterThan(0)
  })

  test('uses an evening greeting in the late afternoon', () => {
    const result = buildAgentGreeting({
      now: new Date(2026, 4, 23, 19, 0, 0),
    })

    expect(result.heading.toLowerCase()).toContain('evening')
  })
})
