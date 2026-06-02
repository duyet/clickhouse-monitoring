import type { HealthCheckDef } from '@/components/health/health-checks'

import {
  type AuditPromptInput,
  buildAuditPrompt,
  estimateTokens,
} from './audit-prompt'
import { describe, expect, it } from 'bun:test'

const check: HealthCheckDef = {
  id: 'demo',
  title: 'Demo Check',
  chartName: 'demo-chart',
  valueKey: 'demo_value',
  defaults: { warning: 1, critical: 3 },
  description: 'A demo check.',
  systemTables: ['system.replicas'],
  commonCauses: ['Cause one'],
  relatedLinks: [{ label: 'Replicas', href: '/replicas' }],
  docsLinks: [
    {
      label: 'system.replicas',
      url: 'https://clickhouse.com/docs/en/operations/system-tables/replicas',
    },
  ],
  sql: 'SELECT count() AS readonly_count\nFROM system.replicas\nWHERE is_readonly = 1',
}

const input: AuditPromptInput = {
  check,
  value: 2,
  thresholds: { warning: 1, critical: 3 },
  status: 'warning',
  row: { readonly_count: 2 },
  hostId: 0,
}

describe('buildAuditPrompt', () => {
  it('includes every optional section by default', () => {
    const prompt = buildAuditPrompt(input)
    expect(prompt).toContain('## Metric query')
    expect(prompt).toContain('```sql')
    expect(prompt).toContain('## Raw data row')
    expect(prompt).toContain('## Relevant ClickHouse system tables')
    expect(prompt).toContain('## Common causes to consider')
    expect(prompt).toContain('## Related dashboards')
    expect(prompt).toContain('## Documentation')
  })

  it('omits a section when its toggle is off', () => {
    const prompt = buildAuditPrompt(input, { sql: false, rawData: false })
    expect(prompt).not.toContain('## Metric query')
    expect(prompt).not.toContain('## Raw data row')
    // Untouched sections remain.
    expect(prompt).toContain('## Common causes to consider')
  })

  it('appends raw-markdown doc URLs when docsMarkdown is on', () => {
    const prompt = buildAuditPrompt(input, { docsMarkdown: true })
    expect(prompt).toContain('raw markdown: https://raw.githubusercontent.com/')
    expect(prompt).toContain('operations/system-tables/replicas.md')
  })

  it('omits raw-markdown doc URLs when docsMarkdown is off', () => {
    const prompt = buildAuditPrompt(input, { docsMarkdown: false })
    expect(prompt).not.toContain('raw markdown:')
    // The HTML doc link itself is still present.
    expect(prompt).toContain('## Documentation')
  })

  it('always keeps the core observation and requested-output sections', () => {
    const prompt = buildAuditPrompt(input, {
      sql: false,
      rawData: false,
      systemTables: false,
      commonCauses: false,
      relatedLinks: false,
      docsLinks: false,
    })
    expect(prompt).toContain('## Observation')
    expect(prompt).toContain('## Requested output')
  })
})

describe('estimateTokens', () => {
  it('approximates ~4 chars per token', () => {
    expect(estimateTokens('')).toBe(0)
    expect(estimateTokens('abcd')).toBe(1)
    expect(estimateTokens('abcdefgh')).toBe(2)
    expect(estimateTokens('abcde')).toBe(2) // rounds up
  })
})
