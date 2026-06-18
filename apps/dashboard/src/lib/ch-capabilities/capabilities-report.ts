/**
 * ClickHouse Capability Diff — human-readable reporting
 *
 * Turns the structured `CapabilityDiff` produced by `diffCapabilities()` into
 * deterministic, human-readable output: a one-line summary, a boolean
 * "anything changed?" predicate, and a full Markdown report.
 *
 * Seeds Plan 10:
 *   10a — capabilities.ts (pure diff harness)
 *   10c — this file (offline diff reporting; consumed by the 10b CI matrix and
 *         by anyone comparing two discovered snapshots)
 *
 * Pure + tested. No live ClickHouse, no I/O — input is two already-computed
 * snapshots' diff, output is a string.
 */

import type { CapabilityDiff } from './capabilities'

// ---------------------------------------------------------------------------
// Predicates
// ---------------------------------------------------------------------------

/**
 * True when the diff contains any structural change — a table or column added
 * or removed. A version string change alone does NOT count as a structural
 * change (use `diff.versionChanged` directly for that), since a version bump
 * with an identical capability surface is "no drift" for compatibility
 * purposes.
 */
export function hasCapabilityChanges(diff: CapabilityDiff): boolean {
  return (
    diff.addedTables.length > 0 ||
    diff.removedTables.length > 0 ||
    Object.keys(diff.addedColumns).length > 0 ||
    Object.keys(diff.removedColumns).length > 0
  )
}

/** Sum of every column listed across all tables in a per-table column map. */
function countColumns(map: Record<string, string[]>): number {
  let total = 0
  for (const cols of Object.values(map)) {
    total += cols.length
  }
  return total
}

// ---------------------------------------------------------------------------
// Summary (one line)
// ---------------------------------------------------------------------------

/**
 * A compact one-line summary suitable for CI logs / status checks.
 *
 * Examples:
 *   "no capability changes"
 *   "+2 tables, -1 table, +3 columns (version changed)"
 */
export function summarizeCapabilityDiff(diff: CapabilityDiff): string {
  const parts: string[] = []

  const pluralTables = (n: number) => (n === 1 ? 'table' : 'tables')
  const pluralColumns = (n: number) => (n === 1 ? 'column' : 'columns')

  if (diff.addedTables.length > 0) {
    parts.push(
      `+${diff.addedTables.length} ${pluralTables(diff.addedTables.length)}`
    )
  }
  if (diff.removedTables.length > 0) {
    parts.push(
      `-${diff.removedTables.length} ${pluralTables(diff.removedTables.length)}`
    )
  }

  const addedCols = countColumns(diff.addedColumns)
  const removedCols = countColumns(diff.removedColumns)
  if (addedCols > 0) {
    parts.push(`+${addedCols} ${pluralColumns(addedCols)}`)
  }
  if (removedCols > 0) {
    parts.push(`-${removedCols} ${pluralColumns(removedCols)}`)
  }

  if (parts.length === 0) {
    return diff.versionChanged
      ? 'no capability changes (version changed)'
      : 'no capability changes'
  }

  const summary = parts.join(', ')
  return diff.versionChanged ? `${summary} (version changed)` : summary
}

// ---------------------------------------------------------------------------
// Full Markdown report
// ---------------------------------------------------------------------------

export interface CapabilityReportOptions {
  /** Label for the baseline snapshot (e.g. a version like "24.3"). */
  baselineLabel?: string
  /** Label for the next snapshot (e.g. a version like "24.8"). */
  nextLabel?: string
}

/** Render a `table: [colA, colB]` map as sorted Markdown list items. */
function renderColumnMap(map: Record<string, string[]>): string[] {
  const lines: string[] = []
  for (const table of Object.keys(map).sort()) {
    lines.push(
      `- \`${table}\`: ${map[table].map((c) => `\`${c}\``).join(', ')}`
    )
  }
  return lines
}

/**
 * Render a full Markdown drift report for a capability diff.
 *
 * Output is deterministic: tables and columns are already sorted by
 * `diffCapabilities`, and object keys are re-sorted here for stability
 * regardless of insertion order. Safe to commit as a CI artifact or paste into
 * an issue.
 */
export function formatCapabilityDiff(
  diff: CapabilityDiff,
  options: CapabilityReportOptions = {}
): string {
  const { baselineLabel, nextLabel } = options

  const heading =
    baselineLabel && nextLabel
      ? `# Capability diff: ${baselineLabel} → ${nextLabel}`
      : '# Capability diff'

  const lines: string[] = [heading, '', `_${summarizeCapabilityDiff(diff)}_`]

  if (diff.versionChanged && baselineLabel && nextLabel) {
    lines.push('', `Version changed: \`${baselineLabel}\` → \`${nextLabel}\`.`)
  }

  if (!hasCapabilityChanges(diff)) {
    lines.push('', 'No structural changes detected.')
    return lines.join('\n')
  }

  if (diff.addedTables.length > 0) {
    lines.push('', '## Tables added')
    for (const t of diff.addedTables) {
      lines.push(`- \`${t}\``)
    }
  }

  if (diff.removedTables.length > 0) {
    lines.push('', '## Tables removed')
    for (const t of diff.removedTables) {
      lines.push(`- \`${t}\``)
    }
  }

  if (Object.keys(diff.addedColumns).length > 0) {
    lines.push('', '## Columns added')
    lines.push(...renderColumnMap(diff.addedColumns))
  }

  if (Object.keys(diff.removedColumns).length > 0) {
    lines.push('', '## Columns removed')
    lines.push(...renderColumnMap(diff.removedColumns))
  }

  return lines.join('\n')
}
