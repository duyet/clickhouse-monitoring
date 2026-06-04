/**
 * Registry-completeness regression guard.
 *
 * The TanStack port stubbed several registries as empty maps with
 * "fan-out later" TODOs that were never completed. Each failed CLOSED or SOFT
 * — the API chart registry 404'd every chart (#1441), the client component
 * registry rendered "Unknown chart" for every chart (#1443), and the table
 * registry's filterSchema path silently dropped filters (#1444). All three
 * shipped GREEN because nothing asserted the registries were populated.
 *
 * These tests fail LOUD at PR time if any registry is empty / collapses, and
 * spot-check that the charts/tables the overview + query pages depend on are
 * actually registered in BOTH the data (API) and component (client) layers.
 *
 * Floors are deliberately conservative — they catch "the registry got wiped"
 * without breaking when charts are legitimately added. Bump them up, never
 * down, when the real counts grow.
 */
import { describe, expect, test } from 'bun:test'
import {
  getRegisteredChartNames,
  hasChart as hasChartComponent,
} from '@/components/charts/registry'
import {
  getAvailableCharts,
  hasChart as hasChartQuery,
} from '@/lib/api/chart-registry'
import { getAvailableTables, hasTable } from '@/lib/api/table-registry'

// Charts rendered through <DynamicChart> (the client component registry). These
// need BOTH a SQL builder (API) and a lazy React component (client) to render —
// exactly the names that 404'd (#1441) / "Unknown chart"-ed (#1443).
const DYNAMIC_CHARTS = [
  'query-count',
  'memory-usage',
  'query-duration',
  'query-count-by-user',
  'failed-query-count',
  'top-query-fingerprints',
] as const

// Overview KPI charts fetched as data but rendered by bespoke KPI cards, NOT via
// <DynamicChart>. They live ONLY in the API registry by design (see
// registry/chart-imports.ts). They still must have a SQL builder or the overview
// page's cards break (the #1441 failure).
const API_ONLY_CHARTS = [
  'query-count-today',
  'running-queries-count',
  'database-count',
  'table-count',
  'disk-size-single',
] as const

// All charts that must resolve in the API/data layer.
const CRITICAL_CHARTS = [...DYNAMIC_CHARTS, ...API_ONLY_CHARTS] as const

// Table configs backing core pages.
const CRITICAL_TABLES = [
  'history-queries',
  'running-queries',
  'failed-queries',
  'tables-overview',
] as const

describe('API chart registry (lib/api/chart-registry)', () => {
  test('is populated (never an empty registry)', () => {
    const charts = getAvailableCharts()
    expect(charts.length).toBeGreaterThan(0)
    // 122 registered as of the 15-module fan-out (#1441); floor well below.
    expect(charts.length).toBeGreaterThanOrEqual(100)
  })

  test('resolves every critical chart', () => {
    const missing = CRITICAL_CHARTS.filter((name) => !hasChartQuery(name))
    expect(missing).toEqual([])
  })
})

describe('Client chart component registry (components/charts/registry)', () => {
  test('is populated (never an empty registry)', () => {
    const names = getRegisteredChartNames()
    expect(names.length).toBeGreaterThan(0)
    // 71 lazy components as of the import-map fan-out (#1443); floor below.
    expect(names.length).toBeGreaterThanOrEqual(60)
  })

  test('resolves every dynamic chart to a component', () => {
    // Only DYNAMIC_CHARTS go through <DynamicChart> and need a client component.
    // API_ONLY_CHARTS (overview KPIs) are data-only by design.
    const missing = DYNAMIC_CHARTS.filter((name) => !hasChartComponent(name))
    expect(missing).toEqual([])
  })
})

describe('Table registry (lib/api/table-registry)', () => {
  test('is populated (never an empty registry)', () => {
    const tables = getAvailableTables()
    expect(tables.length).toBeGreaterThan(0)
    // 86 configs as of the aggregate seed; floor below.
    expect(tables.length).toBeGreaterThanOrEqual(50)
  })

  test('resolves every critical table config', () => {
    const missing = CRITICAL_TABLES.filter((name) => !hasTable(name))
    expect(missing).toEqual([])
  })
})

describe('cross-layer parity (data ↔ component)', () => {
  test('every dynamic chart exists in BOTH the API and component registries', () => {
    // Only DYNAMIC_CHARTS need both layers — API_ONLY charts are data-only.
    // A dynamic chart needs a SQL builder (API) AND a React component (client)
    // to render — the #1441 vs #1443 split proved either alone is not enough.
    const brokenPairs = DYNAMIC_CHARTS.filter(
      (name) => hasChartQuery(name) !== hasChartComponent(name)
    )
    expect(brokenPairs).toEqual([])
  })
})
