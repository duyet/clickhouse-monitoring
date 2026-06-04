import type { HealthCheckDef } from '@/components/health/health-checks'
import type {
  AuditPromptInput,
  AuditPromptOptions,
} from '@/lib/health/audit-prompt'

import { describe, expect, test } from 'bun:test'
import {
  buildAuditPrompt,
  DEFAULT_AUDIT_PROMPT_OPTIONS,
  estimateTokens,
} from '@/lib/health/audit-prompt'

// ---------------------------------------------------------------------------
// Minimal fixtures
// ---------------------------------------------------------------------------

const minimalCheck: HealthCheckDef = {
  id: 'test-check',
  title: 'Test Check',
}

const fullCheck: HealthCheckDef = {
  id: 'merge-queue-depth',
  title: 'Merge Queue Depth',
  description: 'Number of parts waiting to be merged.',
  sql: 'SELECT count() FROM system.merges',
  systemTables: ['system.merges', 'system.parts'],
  commonCauses: ['Too many inserts', 'Slow merges'],
  relatedLinks: [
    { label: 'Merges', href: '/merges' },
    { label: 'Running Queries', href: '/running-queries?tab=merges' },
  ],
  docsLinks: [
    {
      label: 'Merges docs',
      url: 'https://clickhouse.com/docs/operations/system-tables/merges',
    },
  ],
}

function makeInput(
  overrides: Partial<AuditPromptInput> = {}
): AuditPromptInput {
  return {
    check: minimalCheck,
    value: 42,
    thresholds: { warning: 10, critical: 50 },
    status: 'warning',
    hostId: 0,
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// estimateTokens
// ---------------------------------------------------------------------------

describe('estimateTokens', () => {
  test('returns 0 for empty string', () => {
    expect(estimateTokens('')).toBe(0)
  })

  test('returns ceil(length / 4)', () => {
    expect(estimateTokens('abcd')).toBe(1)
    expect(estimateTokens('abcde')).toBe(2)
    expect(estimateTokens('a'.repeat(400))).toBe(100)
  })

  test('estimate grows with prompt length', () => {
    const short = buildAuditPrompt(makeInput())
    const withAll = buildAuditPrompt(makeInput({ check: fullCheck }))
    expect(estimateTokens(withAll)).toBeGreaterThan(estimateTokens(short))
  })
})

// ---------------------------------------------------------------------------
// DEFAULT_AUDIT_PROMPT_OPTIONS
// ---------------------------------------------------------------------------

describe('DEFAULT_AUDIT_PROMPT_OPTIONS', () => {
  test('all sections are enabled by default', () => {
    const keys: (keyof Required<AuditPromptOptions>)[] = [
      'sql',
      'rawData',
      'systemTables',
      'commonCauses',
      'relatedLinks',
      'docsLinks',
      'docsMarkdown',
    ]
    for (const k of keys) {
      expect(DEFAULT_AUDIT_PROMPT_OPTIONS[k]).toBe(true)
    }
  })
})

// ---------------------------------------------------------------------------
// buildAuditPrompt — header / observation (always present)
// ---------------------------------------------------------------------------

describe('buildAuditPrompt — header', () => {
  test('contains the check title in the H1', () => {
    const out = buildAuditPrompt(makeInput())
    expect(out).toContain('# ClickHouse Health Audit — Test Check')
  })

  test('contains the status in uppercase in the intro paragraph', () => {
    const out = buildAuditPrompt(makeInput({ status: 'critical' }))
    expect(out).toContain('**CRITICAL**')
  })

  test('contains the check id in the observation', () => {
    const out = buildAuditPrompt(makeInput())
    expect(out).toContain('`test-check`')
  })

  test('contains the numeric value', () => {
    const out = buildAuditPrompt(makeInput({ value: 99 }))
    expect(out).toContain('99')
  })

  test('shows "unavailable" when value is null', () => {
    const out = buildAuditPrompt(makeInput({ value: null }))
    expect(out).toContain('unavailable')
  })

  test('uses formatValue when provided', () => {
    const check: HealthCheckDef = {
      ...minimalCheck,
      formatValue: (v) => `${v}ms`,
    }
    const out = buildAuditPrompt(makeInput({ check, value: 123 }))
    expect(out).toContain('123ms')
  })

  test('contains warning and critical thresholds', () => {
    const out = buildAuditPrompt(
      makeInput({ thresholds: { warning: 5, critical: 20 } })
    )
    expect(out).toContain('`5`')
    expect(out).toContain('`20`')
  })

  test('contains the host id', () => {
    const out = buildAuditPrompt(makeInput({ hostId: 3 }))
    expect(out).toContain('`3`')
  })

  test('shows clickhouse version when provided', () => {
    const out = buildAuditPrompt(makeInput({ clickhouseVersion: '24.3.1' }))
    expect(out).toContain('`24.3.1`')
  })

  test('shows _unknown_ when version is absent', () => {
    const out = buildAuditPrompt(makeInput())
    expect(out).toContain('_unknown_')
  })
})

// ---------------------------------------------------------------------------
// buildAuditPrompt — description section
// ---------------------------------------------------------------------------

describe('buildAuditPrompt — description section', () => {
  test('included when check has a description', () => {
    const check: HealthCheckDef = {
      ...minimalCheck,
      description: 'Parts waiting to merge.',
    }
    const out = buildAuditPrompt(makeInput({ check }))
    expect(out).toContain('## Description')
    expect(out).toContain('Parts waiting to merge.')
  })

  test('omitted when check has no description', () => {
    const out = buildAuditPrompt(makeInput())
    expect(out).not.toContain('## Description')
  })
})

// ---------------------------------------------------------------------------
// buildAuditPrompt — SQL section
// ---------------------------------------------------------------------------

describe('buildAuditPrompt — SQL section', () => {
  test('included when check.sql is set and opts.sql is true', () => {
    const out = buildAuditPrompt(makeInput({ check: fullCheck }))
    expect(out).toContain('## Metric query (how this value is computed)')
    expect(out).toContain('SELECT count() FROM system.merges')
  })

  test('omitted when opts.sql = false', () => {
    const out = buildAuditPrompt(makeInput({ check: fullCheck }), {
      sql: false,
    })
    expect(out).not.toContain('## Metric query')
  })

  test('omitted when check has no sql', () => {
    const out = buildAuditPrompt(makeInput())
    expect(out).not.toContain('## Metric query')
  })
})

// ---------------------------------------------------------------------------
// buildAuditPrompt — raw data section
// ---------------------------------------------------------------------------

describe('buildAuditPrompt — raw data section', () => {
  test('included when row has entries and opts.rawData is true', () => {
    const out = buildAuditPrompt(
      makeInput({ row: { parts: 7, database: 'default' } })
    )
    expect(out).toContain('## Raw data row')
    expect(out).toContain('`parts`')
    expect(out).toContain('`7`')
  })

  test('omitted when row is undefined', () => {
    const out = buildAuditPrompt(makeInput())
    expect(out).not.toContain('## Raw data row')
  })

  test('omitted when row is empty object', () => {
    const out = buildAuditPrompt(makeInput({ row: {} }))
    expect(out).not.toContain('## Raw data row')
  })

  test('omitted when opts.rawData = false', () => {
    const out = buildAuditPrompt(makeInput({ row: { parts: 7 } }), {
      rawData: false,
    })
    expect(out).not.toContain('## Raw data row')
  })
})

// ---------------------------------------------------------------------------
// buildAuditPrompt — system tables section
// ---------------------------------------------------------------------------

describe('buildAuditPrompt — system tables section', () => {
  test('included when check.systemTables is non-empty', () => {
    const out = buildAuditPrompt(makeInput({ check: fullCheck }))
    expect(out).toContain('## Relevant ClickHouse system tables')
    expect(out).toContain('`system.merges`')
    expect(out).toContain('`system.parts`')
  })

  test('omitted when check has no systemTables', () => {
    const out = buildAuditPrompt(makeInput())
    expect(out).not.toContain('## Relevant ClickHouse system tables')
  })

  test('omitted when opts.systemTables = false', () => {
    const out = buildAuditPrompt(makeInput({ check: fullCheck }), {
      systemTables: false,
    })
    expect(out).not.toContain('## Relevant ClickHouse system tables')
  })
})

// ---------------------------------------------------------------------------
// buildAuditPrompt — common causes section
// ---------------------------------------------------------------------------

describe('buildAuditPrompt — common causes section', () => {
  test('included when check.commonCauses is non-empty', () => {
    const out = buildAuditPrompt(makeInput({ check: fullCheck }))
    expect(out).toContain('## Common causes to consider')
    expect(out).toContain('Too many inserts')
    expect(out).toContain('Slow merges')
  })

  test('omitted when check has no commonCauses', () => {
    const out = buildAuditPrompt(makeInput())
    expect(out).not.toContain('## Common causes to consider')
  })

  test('omitted when opts.commonCauses = false', () => {
    const out = buildAuditPrompt(makeInput({ check: fullCheck }), {
      commonCauses: false,
    })
    expect(out).not.toContain('## Common causes to consider')
  })
})

// ---------------------------------------------------------------------------
// buildAuditPrompt — related links section
// ---------------------------------------------------------------------------

describe('buildAuditPrompt — related links section', () => {
  test('included when check.relatedLinks is non-empty', () => {
    const out = buildAuditPrompt(makeInput({ check: fullCheck, hostId: 2 }))
    expect(out).toContain('## Related dashboards (this monitor)')
    expect(out).toContain('[Merges]')
    // host query param appended
    expect(out).toContain('host=2')
  })

  test('appends ?host= to links without existing query string', () => {
    const out = buildAuditPrompt(makeInput({ check: fullCheck, hostId: 1 }))
    expect(out).toContain('/merges?host=1')
  })

  test('appends &host= to links that already have a query string', () => {
    const out = buildAuditPrompt(makeInput({ check: fullCheck, hostId: 0 }))
    expect(out).toContain('/running-queries?tab=merges&host=0')
  })

  test('omitted when check has no relatedLinks', () => {
    const out = buildAuditPrompt(makeInput())
    expect(out).not.toContain('## Related dashboards')
  })

  test('omitted when opts.relatedLinks = false', () => {
    const out = buildAuditPrompt(makeInput({ check: fullCheck }), {
      relatedLinks: false,
    })
    expect(out).not.toContain('## Related dashboards')
  })
})

// ---------------------------------------------------------------------------
// buildAuditPrompt — docs links section
// ---------------------------------------------------------------------------

describe('buildAuditPrompt — docs links section', () => {
  test('included when check.docsLinks is non-empty', () => {
    const out = buildAuditPrompt(makeInput({ check: fullCheck }))
    expect(out).toContain('## Documentation')
    expect(out).toContain('[Merges docs]')
    expect(out).toContain(
      'https://clickhouse.com/docs/operations/system-tables/merges'
    )
  })

  test('includes raw markdown URL when docsMarkdown = true (default)', () => {
    const out = buildAuditPrompt(makeInput({ check: fullCheck }))
    expect(out).toContain('raw.githubusercontent.com')
    expect(out).toContain('merges.md')
  })

  test('omits raw markdown URL when docsMarkdown = false', () => {
    const out = buildAuditPrompt(makeInput({ check: fullCheck }), {
      docsMarkdown: false,
    })
    expect(out).toContain('## Documentation')
    expect(out).not.toContain('raw.githubusercontent.com')
  })

  test('omitted when opts.docsLinks = false', () => {
    const out = buildAuditPrompt(makeInput({ check: fullCheck }), {
      docsLinks: false,
    })
    expect(out).not.toContain('## Documentation')
  })

  test('omitted when check has no docsLinks', () => {
    const out = buildAuditPrompt(makeInput())
    expect(out).not.toContain('## Documentation')
  })

  test('non-clickhouse.com URLs produce no markdown link', () => {
    const check: HealthCheckDef = {
      ...minimalCheck,
      docsLinks: [
        { label: 'External', url: 'https://example.com/docs/something' },
      ],
    }
    const out = buildAuditPrompt(makeInput({ check }))
    expect(out).toContain('[External]')
    expect(out).not.toContain('raw.githubusercontent.com')
    expect(out).not.toContain('— raw markdown:')
  })
})

// ---------------------------------------------------------------------------
// buildAuditPrompt — requested output section (always present)
// ---------------------------------------------------------------------------

describe('buildAuditPrompt — requested output section', () => {
  test('always present', () => {
    const out = buildAuditPrompt(makeInput())
    expect(out).toContain('## Requested output')
  })

  test('lists five numbered items', () => {
    const out = buildAuditPrompt(makeInput())
    for (let i = 1; i <= 5; i++) {
      expect(out).toContain(`${i}.`)
    }
  })
})

// ---------------------------------------------------------------------------
// buildAuditPrompt — option merging
// ---------------------------------------------------------------------------

describe('buildAuditPrompt — option merging', () => {
  test('partial options override only the specified fields', () => {
    const out = buildAuditPrompt(makeInput({ check: fullCheck }), {
      sql: false,
    })
    // sql is off, but everything else should remain
    expect(out).not.toContain('## Metric query')
    expect(out).toContain('## Relevant ClickHouse system tables')
    expect(out).toContain('## Common causes to consider')
  })

  test('all sections off produces minimal prompt with just header+observation+requested', () => {
    const allOff: AuditPromptOptions = {
      sql: false,
      rawData: false,
      systemTables: false,
      commonCauses: false,
      relatedLinks: false,
      docsLinks: false,
      docsMarkdown: false,
    }
    const out = buildAuditPrompt(makeInput({ check: fullCheck }), allOff)
    expect(out).toContain('# ClickHouse Health Audit')
    expect(out).toContain('## Observation')
    expect(out).toContain('## Requested output')
    expect(out).not.toContain('## Metric query')
    expect(out).not.toContain('## Relevant ClickHouse system tables')
    expect(out).not.toContain('## Documentation')
  })
})
