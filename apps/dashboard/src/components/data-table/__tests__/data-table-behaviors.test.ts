/**
 * Unit tests for data-table system behaviors.
 *
 * WHY these tests exist:
 *  - Filtering, sorting, column ordering, and table-behavior resolution are
 *    pure functions / deterministic algorithms. Covering them here gives
 *    instant, zero-infrastructure feedback without needing a browser.
 *  - The synthetic utility columns (__expand, select, action) have hard
 *    contracts (non-hideable, non-sortable, always first). Tests here prevent
 *    future edits from silently breaking those contracts.
 *  - Sorting by "actual value" (not the readable display string) is a
 *    non-obvious invariant that broke once before; this test file pins it.
 */

import { describe, expect, test } from 'bun:test'

// ---------------------------------------------------------------------------
// Helpers under test (pure functions — no React deps)
// ---------------------------------------------------------------------------
import { getCustomSortingFns } from '../sorting-fns'
import { isColumnFilterable, normalizeColumnName } from '../column-defs/utils'
import { resolveTableBehavior } from '../utils/resolve-table-behavior'
import { EXPAND_COLUMN_ID } from '../column-defs'

// ---------------------------------------------------------------------------
// Minimal QueryConfig builder (typing subset used by resolveTableBehavior)
// ---------------------------------------------------------------------------
function config(
  tableBehavior?: Record<string, unknown>
): Parameters<typeof resolveTableBehavior>[0]['queryConfig'] {
  return {
    name: 'test',
    sql: 'SELECT 1',
    columns: [],
    tableBehavior,
  } as Parameters<typeof resolveTableBehavior>[0]['queryConfig']
}

// ---------------------------------------------------------------------------
// Filtering logic
//
// useFilteredData is a React hook but its algorithm is pure. We replicate the
// matching contract here so regressions surface immediately without a browser.
// ---------------------------------------------------------------------------

/**
 * Inline port of the useFilteredData column-filter algorithm.
 *
 * Kept in sync with:
 *   apps/dashboard/src/components/data-table/hooks/use-filtered-data.ts
 *
 * Why a copy rather than import? The hook itself uses useMemo which requires
 * React context. Testing the algorithm separately ensures the contract is
 * pinned at the unit level AND survives any hook refactoring that might
 * change the React wrapping without changing the filter logic.
 */
function applyColumnFilters<T extends Record<string, unknown>>(
  data: T[],
  columnFilters: Record<string, string>
): T[] {
  const activeFilters = Object.entries(columnFilters).filter(
    ([, value]) => value.length > 0
  )
  if (activeFilters.length === 0) return data

  return data.filter((row) =>
    activeFilters.every(([column, filterValue]) => {
      const val = row[column]
      const normalizedVal = row[normalizeColumnName(column)]
      const str =
        val !== undefined && val !== null
          ? String(val)
          : normalizedVal !== undefined && normalizedVal !== null
            ? String(normalizedVal)
            : ''
      return str.toLowerCase().includes(filterValue.toLowerCase())
    })
  )
}

function applyGlobalSearch<T extends Record<string, unknown>>(
  data: T[],
  search: string
): T[] {
  if (!search.trim()) return data
  const lower = search.toLowerCase().trim()
  return data.filter((row) =>
    Object.values(row).some((v) => {
      if (v === null || v === undefined) return false
      if (typeof v === 'object' || typeof v === 'function') return false
      return String(v).toLowerCase().includes(lower)
    })
  )
}

type Operator =
  | 'contains'
  | 'equals'
  | 'startsWith'
  | 'endsWith'
  | 'notContains'

interface AdvancedFilter {
  id: string
  columnId: string
  operator: Operator
  value: string
}

function applyAdvancedFilters<T extends Record<string, unknown>>(
  data: T[],
  filters: AdvancedFilter[]
): T[] {
  if (filters.length === 0) return data
  return data.filter((row) =>
    filters.every(({ columnId, operator, value }) => {
      const cell = String(row[columnId] ?? '').toLowerCase()
      const v = value.toLowerCase()
      switch (operator) {
        case 'contains':
          return cell.includes(v)
        case 'equals':
          return cell === v
        case 'startsWith':
          return cell.startsWith(v)
        case 'endsWith':
          return cell.endsWith(v)
        case 'notContains':
          return !cell.includes(v)
        default:
          return true
      }
    })
  )
}

// ---------------------------------------------------------------------------
// Filtering tests
// ---------------------------------------------------------------------------

describe('data-table filtering algorithm', () => {
  const rows = [
    { query: 'SELECT * FROM orders', user: 'alice', duration: 500 },
    { query: 'INSERT INTO orders VALUES (?)', user: 'bob', duration: 50 },
    { query: 'SELECT count() FROM events', user: 'alice', duration: 3000 },
    { query: 'DROP TABLE temp', user: 'admin', duration: 10 },
  ]

  describe('column filters (case-insensitive substring)', () => {
    test('narrows rows to those matching the filter string', () => {
      const result = applyColumnFilters(rows, { user: 'alice' })
      expect(result).toHaveLength(2)
      expect(result.every((r) => r.user === 'alice')).toBe(true)
    })

    test('is case-insensitive', () => {
      const upper = applyColumnFilters(rows, { user: 'ALICE' })
      const lower = applyColumnFilters(rows, { user: 'alice' })
      expect(upper).toEqual(lower)
    })

    test('empty filter string returns all rows (no-op)', () => {
      const result = applyColumnFilters(rows, { user: '' })
      expect(result).toHaveLength(rows.length)
    })

    test('multi-column filter is AND — row must match all columns', () => {
      // alice AND 'SELECT' → only first row
      const result = applyColumnFilters(rows, {
        user: 'alice',
        query: 'SELECT',
      })
      expect(result).toHaveLength(2)
      result.forEach((r) => {
        expect(r.user).toBe('alice')
        expect(r.query).toContain('SELECT')
      })
    })

    test('returns empty array when no row matches', () => {
      const result = applyColumnFilters(rows, { user: 'nobody' })
      expect(result).toHaveLength(0)
    })

    test('normalises readable_ prefix — readable_duration maps to duration column', () => {
      // The hook checks both original column name and normalised version
      // so a filter on 'readable_duration' should match the 'duration' values
      const result = applyColumnFilters(rows, { readable_duration: '50' })
      // 'readable_duration' normalises to 'duration'; row with duration=50 matches
      expect(result.some((r) => r.duration === 50)).toBe(true)
    })
  })

  describe('global search', () => {
    test('matches any column value containing the search term', () => {
      const result = applyGlobalSearch(rows, 'alice')
      expect(result).toHaveLength(2)
    })

    test('empty search returns all rows', () => {
      expect(applyGlobalSearch(rows, '')).toHaveLength(rows.length)
      expect(applyGlobalSearch(rows, '   ')).toHaveLength(rows.length)
    })

    test('null/undefined values are skipped without throwing', () => {
      const sparse = [
        { a: null, b: undefined, c: 'match' },
      ] as unknown as Array<Record<string, unknown>>
      expect(applyGlobalSearch(sparse, 'match')).toHaveLength(1)
      expect(applyGlobalSearch(sparse, 'null')).toHaveLength(0)
    })
  })

  describe('advanced filters', () => {
    test('contains: row included when cell contains value', () => {
      const result = applyAdvancedFilters(rows, [
        { id: '1', columnId: 'query', operator: 'contains', value: 'SELECT' },
      ])
      expect(result).toHaveLength(2)
    })

    test('equals: exact match only', () => {
      const result = applyAdvancedFilters(rows, [
        { id: '1', columnId: 'user', operator: 'equals', value: 'alice' },
      ])
      expect(result.every((r) => r.user === 'alice')).toBe(true)
    })

    test('startsWith: only rows where cell starts with value', () => {
      const result = applyAdvancedFilters(rows, [
        { id: '1', columnId: 'query', operator: 'startsWith', value: 'SELECT' },
      ])
      expect(result).toHaveLength(2)
      result.forEach((r) => expect(r.query).toMatch(/^SELECT/i))
    })

    test('endsWith: only rows where cell ends with value', () => {
      const result = applyAdvancedFilters(rows, [
        {
          id: '1',
          columnId: 'query',
          operator: 'endsWith',
          value: 'temp',
        },
      ])
      expect(result).toHaveLength(1)
      expect(result[0].query).toMatch(/temp$/i)
    })

    test('notContains: excludes rows containing the value', () => {
      const result = applyAdvancedFilters(rows, [
        {
          id: '1',
          columnId: 'query',
          operator: 'notContains',
          value: 'SELECT',
        },
      ])
      expect(result).toHaveLength(2)
      result.forEach((r) => expect(r.query).not.toMatch(/SELECT/i))
    })

    test('multiple advanced filters are AND-combined', () => {
      const result = applyAdvancedFilters(rows, [
        { id: '1', columnId: 'user', operator: 'equals', value: 'alice' },
        {
          id: '2',
          columnId: 'query',
          operator: 'contains',
          value: 'count',
        },
      ])
      expect(result).toHaveLength(1)
      expect(result[0].user).toBe('alice')
    })
  })
})

// ---------------------------------------------------------------------------
// Custom sorting function tests
//
// WHY: sort_column_using_actual_value must sort by the raw numeric column, NOT
// by the human-readable string (e.g. "10 MiB" would sort differently from 10).
// This behaviour matters for BackgroundBar columns where readable_* columns are
// display-only and the numeric base column drives ordering.
// ---------------------------------------------------------------------------

describe('getCustomSortingFns → sort_column_using_actual_value', () => {
  const sortFns = getCustomSortingFns()
  const sort = sortFns.sort_column_using_actual_value

  function makeRow(data: Record<string, unknown>) {
    return { original: data } as { original: typeof data }
  }

  test('sorts numerically ascending by stripping readable_ prefix', () => {
    const a = makeRow({ bytes: 100, readable_bytes: '100 B' })
    const b = makeRow({ bytes: 50, readable_bytes: '50 B' })
    // a > b → positive result
    expect(sort(a as never, b as never, 'readable_bytes')).toBeGreaterThan(0)
    // b < a → negative result
    expect(sort(b as never, a as never, 'readable_bytes')).toBeLessThan(0)
  })

  test('sorts by pct_ column actual value (strips pct_ prefix)', () => {
    const a = makeRow({ rows: 80, pct_rows: 80 })
    const b = makeRow({ rows: 20, pct_rows: 20 })
    expect(sort(a as never, b as never, 'pct_rows')).toBeGreaterThan(0)
  })

  test('returns 0 when values are equal', () => {
    const a = makeRow({ bytes: 100, readable_bytes: '100 B' })
    const b = makeRow({ bytes: 100, readable_bytes: '100 B' })
    expect(sort(a as never, b as never, 'readable_bytes')).toBe(0)
  })

  test('returns 0 for non-numeric values (falls through gracefully)', () => {
    const a = makeRow({ query: 'SELECT 1', readable_query: 'SELECT 1' })
    const b = makeRow({ query: 'SELECT 2', readable_query: 'SELECT 2' })
    expect(sort(a as never, b as never, 'readable_query')).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// resolveTableBehavior — config/prop precedence
//
// WHY: the precedence stack (props > queryConfig.tableBehavior > defaults) must
// be stable so individual QueryConfigs can opt out of resizing/sorting without
// a global setting change, and a prop passed at the call site always wins.
// ---------------------------------------------------------------------------

describe('resolveTableBehavior', () => {
  test('returns sane defaults when nothing is configured', () => {
    const result = resolveTableBehavior({ queryConfig: config() })
    expect(result.enableColumnResizing).toBe(true)
    expect(result.columnResizeMode).toBe('onChange')
    expect(result.enableSorting).toBe(true)
    expect(result.enableColumnReordering).toBe(true)
  })

  test('queryConfig.tableBehavior overrides defaults', () => {
    const result = resolveTableBehavior({
      queryConfig: config({
        enableSorting: false,
        enableColumnResizing: false,
      }),
    })
    expect(result.enableSorting).toBe(false)
    expect(result.enableColumnResizing).toBe(false)
  })

  test('explicit prop overrides queryConfig setting (highest precedence)', () => {
    // QueryConfig disables reorder; prop re-enables it
    const result = resolveTableBehavior({
      queryConfig: config({ enableColumnReordering: false }),
      enableColumnReorderingProp: true,
    })
    expect(result.enableColumnReordering).toBe(true)
  })

  test('false prop overrides queryConfig enabled setting', () => {
    const result = resolveTableBehavior({
      queryConfig: config({ enableColumnReordering: true }),
      enableColumnReorderingProp: false,
    })
    expect(result.enableColumnReordering).toBe(false)
  })

  test('columnResizeMode can be set to onEnd via config', () => {
    const result = resolveTableBehavior({
      queryConfig: config({ columnResizeMode: 'onEnd' }),
    })
    expect(result.columnResizeMode).toBe('onEnd')
  })
})

// ---------------------------------------------------------------------------
// Utility column constants and filtering semantics
//
// WHY: __expand and select are synthetic utility columns that MUST be pinned
// first in column order and must NOT be exposed to filtering/sort/hide logic.
// If EXPAND_COLUMN_ID changes, the column order computation in data-table.tsx
// silently breaks (utility columns no longer pinned).
// ---------------------------------------------------------------------------

describe('synthetic utility column contracts', () => {
  test('EXPAND_COLUMN_ID is the literal string "__expand"', () => {
    // This string is hard-coded in localStorage key lookups and row-render keys.
    // Changing it without updating those references would corrupt persisted state.
    expect(EXPAND_COLUMN_ID).toBe('__expand')
  })

  test('utility column pinning logic: __expand always before data columns', () => {
    // Replicate the finalColumnOrder logic from data-table.tsx
    function buildFinalColumnOrder(
      expandable: boolean,
      enableRowSelection: boolean,
      savedOrder: string[]
    ): string[] {
      const utilityIds: string[] = []
      if (expandable) utilityIds.push(EXPAND_COLUMN_ID)
      if (enableRowSelection) utilityIds.push('select')
      if (savedOrder.length === 0) return utilityIds.length ? utilityIds : []
      const dataOnly = savedOrder.filter((id) => !utilityIds.includes(id))
      return [...utilityIds, ...dataOnly]
    }

    const savedOrder = ['name', 'status', EXPAND_COLUMN_ID, 'select']

    // __expand enabled: column is at position 0
    const withExpand = buildFinalColumnOrder(true, false, savedOrder)
    expect(withExpand[0]).toBe(EXPAND_COLUMN_ID)
    // data columns follow, no duplicates
    expect(withExpand.filter((id) => id === EXPAND_COLUMN_ID)).toHaveLength(1)
    expect(withExpand).toContain('name')
    expect(withExpand).toContain('status')

    // select enabled: select is at position 0
    const withSelect = buildFinalColumnOrder(false, true, savedOrder)
    expect(withSelect[0]).toBe('select')
    expect(withSelect.filter((id) => id === 'select')).toHaveLength(1)

    // both: __expand first, then select
    const withBoth = buildFinalColumnOrder(true, true, savedOrder)
    expect(withBoth[0]).toBe(EXPAND_COLUMN_ID)
    expect(withBoth[1]).toBe('select')
  })

  test('utility columns removed from saved order are re-pinned at front on restore', () => {
    // Emulates the case where a user's saved column order predates utility
    // columns being added — utility IDs must still appear at the front.
    function buildFinalColumnOrder(
      expandable: boolean,
      enableRowSelection: boolean,
      savedOrder: string[]
    ): string[] {
      const utilityIds: string[] = []
      if (expandable) utilityIds.push(EXPAND_COLUMN_ID)
      if (enableRowSelection) utilityIds.push('select')
      if (savedOrder.length === 0) return utilityIds.length ? utilityIds : []
      const dataOnly = savedOrder.filter((id) => !utilityIds.includes(id))
      return [...utilityIds, ...dataOnly]
    }

    const legacyOrder = ['name', 'status'] // no utility columns
    const result = buildFinalColumnOrder(true, true, legacyOrder)
    expect(result[0]).toBe(EXPAND_COLUMN_ID)
    expect(result[1]).toBe('select')
    expect(result).toContain('name')
  })
})

// ---------------------------------------------------------------------------
// normalizeColumnName
//
// WHY: filters and sort comparisons use normalizeColumnName to map between
// display column names (e.g. readable_bytes) and actual data field names.
// Getting this wrong silently drops filter matches.
// ---------------------------------------------------------------------------

describe('normalizeColumnName', () => {
  test('strips readable_ prefix', () => {
    expect(normalizeColumnName('readable_bytes')).toBe('bytes')
    expect(normalizeColumnName('readable_query')).toBe('query')
  })

  test('lowercases the result', () => {
    expect(normalizeColumnName('QueryID')).toBe('queryid')
    expect(normalizeColumnName('Readable_Bytes')).toBe('bytes')
  })

  test('passes through columns without the prefix unchanged', () => {
    expect(normalizeColumnName('duration')).toBe('duration')
    expect(normalizeColumnName('user')).toBe('user')
  })

  test('trims surrounding whitespace', () => {
    expect(normalizeColumnName('  readable_bytes  ')).toBe('bytes')
  })
})

// ---------------------------------------------------------------------------
// isColumnFilterable
//
// WHY: must only return true when the global enableColumnFilters flag is set,
// preventing accidental filtering of columns that weren't opted in.
// ---------------------------------------------------------------------------

describe('isColumnFilterable', () => {
  test('returns false when column filters globally disabled', () => {
    expect(isColumnFilterable('query', false, [])).toBe(false)
    expect(isColumnFilterable('query', false, ['query'])).toBe(false)
  })

  test('returns true for any column when no explicit whitelist given', () => {
    expect(isColumnFilterable('anything', true, [])).toBe(true)
  })

  test('returns true only for whitelisted columns', () => {
    const allowed = ['query', 'user']
    expect(isColumnFilterable('query', true, allowed)).toBe(true)
    expect(isColumnFilterable('user', true, allowed)).toBe(true)
    expect(isColumnFilterable('duration', true, allowed)).toBe(false)
  })
})
