import type { CapabilityDiff } from './capabilities'

import { diffCapabilities, normalizeCapabilities } from './capabilities'
import {
  formatCapabilityDiff,
  hasCapabilityChanges,
  summarizeCapabilityDiff,
} from './capabilities-report'
import { describe, expect, it } from 'bun:test'

// A diff with no structural changes and no version change.
const EMPTY_DIFF: CapabilityDiff = {
  addedTables: [],
  removedTables: [],
  addedColumns: {},
  removedColumns: {},
  versionChanged: false,
}

// Build a realistic diff via the real harness: baseline (24.3) → next (24.8)
// adds a table + a column and removes a table + a column.
function realisticDiff(): CapabilityDiff {
  const baseline = normalizeCapabilities({
    version: '24.3.1.1',
    tables: [
      { database: 'system', name: 'query_log' },
      { database: 'system', name: 'old_table' },
    ],
    columns: [
      { database: 'system', table: 'query_log', name: 'event_time' },
      { database: 'system', table: 'query_log', name: 'legacy_col' },
    ],
  })
  const next = normalizeCapabilities({
    version: '24.8.1.1',
    tables: [
      { database: 'system', name: 'query_log' },
      { database: 'system', name: 'new_table' },
    ],
    columns: [
      { database: 'system', table: 'query_log', name: 'event_time' },
      { database: 'system', table: 'query_log', name: 'shiny_col' },
    ],
  })
  return diffCapabilities(baseline, next)
}

// ---------------------------------------------------------------------------
// hasCapabilityChanges
// ---------------------------------------------------------------------------

describe('hasCapabilityChanges', () => {
  it('is false for an empty diff', () => {
    expect(hasCapabilityChanges(EMPTY_DIFF)).toBe(false)
  })

  it('is false when only the version changed (no structural change)', () => {
    expect(hasCapabilityChanges({ ...EMPTY_DIFF, versionChanged: true })).toBe(
      false
    )
  })

  it('is true when a table is added', () => {
    expect(
      hasCapabilityChanges({ ...EMPTY_DIFF, addedTables: ['system.x'] })
    ).toBe(true)
  })

  it('is true when a column is removed', () => {
    expect(
      hasCapabilityChanges({
        ...EMPTY_DIFF,
        removedColumns: { 'system.query_log': ['legacy_col'] },
      })
    ).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// summarizeCapabilityDiff
// ---------------------------------------------------------------------------

describe('summarizeCapabilityDiff', () => {
  it('reports no changes for an empty diff', () => {
    expect(summarizeCapabilityDiff(EMPTY_DIFF)).toBe('no capability changes')
  })

  it('notes a version change even with no structural changes', () => {
    expect(
      summarizeCapabilityDiff({ ...EMPTY_DIFF, versionChanged: true })
    ).toBe('no capability changes (version changed)')
  })

  it('uses singular/plural correctly and orders parts tables→columns', () => {
    const diff: CapabilityDiff = {
      addedTables: ['system.a', 'system.b'],
      removedTables: ['system.c'],
      addedColumns: { 'system.query_log': ['x', 'y'] },
      removedColumns: { 'system.query_log': ['z'] },
      versionChanged: true,
    }
    expect(summarizeCapabilityDiff(diff)).toBe(
      '+2 tables, -1 table, +2 columns, -1 column (version changed)'
    )
  })

  it('summarizes a realistic harness-produced diff', () => {
    expect(summarizeCapabilityDiff(realisticDiff())).toBe(
      '+1 table, -1 table, +1 column, -1 column (version changed)'
    )
  })
})

// ---------------------------------------------------------------------------
// formatCapabilityDiff
// ---------------------------------------------------------------------------

describe('formatCapabilityDiff', () => {
  it('renders a no-changes report with a plain heading', () => {
    const out = formatCapabilityDiff(EMPTY_DIFF)
    expect(out).toContain('# Capability diff')
    expect(out).toContain('_no capability changes_')
    expect(out).toContain('No structural changes detected.')
    // No section headers when nothing changed.
    expect(out).not.toContain('## Tables added')
  })

  it('uses a baseline→next heading and version line when labels are given', () => {
    const out = formatCapabilityDiff(realisticDiff(), {
      baselineLabel: '24.3',
      nextLabel: '24.8',
    })
    expect(out).toContain('# Capability diff: 24.3 → 24.8')
    expect(out).toContain('Version changed: `24.3` → `24.8`.')
  })

  it('renders every section with backticked, sorted entries', () => {
    const out = formatCapabilityDiff(realisticDiff(), {
      baselineLabel: '24.3',
      nextLabel: '24.8',
    })
    expect(out).toContain('## Tables added\n- `system.new_table`')
    expect(out).toContain('## Tables removed\n- `system.old_table`')
    expect(out).toContain('## Columns added\n- `system.query_log`: `shiny_col`')
    expect(out).toContain(
      '## Columns removed\n- `system.query_log`: `legacy_col`'
    )
  })

  it('is deterministic regardless of object key insertion order', () => {
    const a: CapabilityDiff = {
      addedTables: [],
      removedTables: [],
      addedColumns: { 'system.b': ['c2'], 'system.a': ['c1'] },
      removedColumns: {},
      versionChanged: false,
    }
    const b: CapabilityDiff = {
      addedTables: [],
      removedTables: [],
      addedColumns: { 'system.a': ['c1'], 'system.b': ['c2'] },
      removedColumns: {},
      versionChanged: false,
    }
    expect(formatCapabilityDiff(a)).toBe(formatCapabilityDiff(b))
  })
})
