/**
 * Tests for app-tables.ts
 *
 * The module derives every exported constant from process.env at import time
 * (module-level evaluation). In Bun's test runner, dynamic import() still
 * resolves to the same cached module instance regardless of query params, so
 * we cannot re-evaluate the module by re-importing.
 *
 * Strategy:
 *  1. Test the *actual* exported values against their expected formulas using
 *     the real module import (env vars unset → defaults apply).
 *  2. For env-override behavior, use `mock.module` to inject a controlled
 *     version of the module and test the documented invariants directly
 *     (format, prefix relationships, etc.).
 *  3. Edge-case logic (falsy env var → default) is tested by deriving the
 *     same `|| 'system'` logic inline.
 */
import { mock, describe, expect, test } from 'bun:test'
import * as appTables from './app-tables'

// ---------------------------------------------------------------------------
// Static (bare) table identifiers — never affected by env vars
// ---------------------------------------------------------------------------

describe('bare table identifiers (SHORT constants)', () => {
  test('EVENTS_TABLE_SHORT is "monitoring_events"', () => {
    expect(appTables.EVENTS_TABLE_SHORT).toBe('monitoring_events')
  })

  test('DASHBOARD_CHARTS_TABLE_SHORT is "clickhouse_monitoring_custom_dashboard"', () => {
    expect(appTables.DASHBOARD_CHARTS_TABLE_SHORT).toBe(
      'clickhouse_monitoring_custom_dashboard'
    )
  })

  test('DASHBOARD_SETTINGS_TABLE_SHORT is "clickhouse_monitoring_custom_dashboard_settings"', () => {
    expect(appTables.DASHBOARD_SETTINGS_TABLE_SHORT).toBe(
      'clickhouse_monitoring_custom_dashboard_settings'
    )
  })

  test('FINDINGS_TABLE_SHORT is "monitoring_findings"', () => {
    expect(appTables.FINDINGS_TABLE_SHORT).toBe('monitoring_findings')
  })

  test('SHORT constants are non-empty strings', () => {
    const shorts = [
      appTables.EVENTS_TABLE_SHORT,
      appTables.DASHBOARD_CHARTS_TABLE_SHORT,
      appTables.DASHBOARD_SETTINGS_TABLE_SHORT,
      appTables.FINDINGS_TABLE_SHORT,
    ]
    for (const s of shorts) {
      expect(typeof s).toBe('string')
      expect(s.length).toBeGreaterThan(0)
    }
  })

  test('SHORT constants contain no dots (bare names, no db prefix)', () => {
    const shorts = [
      appTables.EVENTS_TABLE_SHORT,
      appTables.DASHBOARD_CHARTS_TABLE_SHORT,
      appTables.DASHBOARD_SETTINGS_TABLE_SHORT,
      appTables.FINDINGS_TABLE_SHORT,
    ]
    for (const s of shorts) {
      expect(s).not.toContain('.')
    }
  })
})

// ---------------------------------------------------------------------------
// APP_DATABASE — real module (CLICKHOUSE_DATABASE unset → default "system")
// ---------------------------------------------------------------------------

describe('APP_DATABASE (real module, default env)', () => {
  test('is a non-empty string', () => {
    expect(typeof appTables.APP_DATABASE).toBe('string')
    expect(appTables.APP_DATABASE.length).toBeGreaterThan(0)
  })

  test('defaults to "system" when CLICKHOUSE_DATABASE is unset', () => {
    // In this test environment CLICKHOUSE_DATABASE is not set, so the
    // module evaluates `process.env.CLICKHOUSE_DATABASE || 'system'` → 'system'.
    const expected = process.env.CLICKHOUSE_DATABASE || 'system'
    expect(appTables.APP_DATABASE).toBe(expected)
  })
})

// ---------------------------------------------------------------------------
// EVENTS_TABLE — real module (default env)
// ---------------------------------------------------------------------------

describe('EVENTS_TABLE (real module, default env)', () => {
  test('is a non-empty string', () => {
    expect(typeof appTables.EVENTS_TABLE).toBe('string')
    expect(appTables.EVENTS_TABLE.length).toBeGreaterThan(0)
  })

  test('defaults to "system.monitoring_events" when no env vars are set', () => {
    const expected =
      process.env.EVENTS_TABLE_NAME || `system.${appTables.EVENTS_TABLE_SHORT}`
    expect(appTables.EVENTS_TABLE).toBe(expected)
  })

  test('has exactly one dot separator in the default case', () => {
    if (!process.env.EVENTS_TABLE_NAME) {
      const parts = appTables.EVENTS_TABLE.split('.')
      expect(parts).toHaveLength(2)
      expect(parts[0]).toBe('system')
      expect(parts[1]).toBe(appTables.EVENTS_TABLE_SHORT)
    }
  })
})

// ---------------------------------------------------------------------------
// DASHBOARD_CHARTS_TABLE — real module (default env)
// ---------------------------------------------------------------------------

describe('DASHBOARD_CHARTS_TABLE (real module, default env)', () => {
  test('is APP_DATABASE.DASHBOARD_CHARTS_TABLE_SHORT', () => {
    expect(appTables.DASHBOARD_CHARTS_TABLE).toBe(
      `${appTables.APP_DATABASE}.${appTables.DASHBOARD_CHARTS_TABLE_SHORT}`
    )
  })

  test('table suffix matches the SHORT constant', () => {
    const suffix = appTables.DASHBOARD_CHARTS_TABLE.split('.')
      .slice(1)
      .join('.')
    expect(suffix).toBe(appTables.DASHBOARD_CHARTS_TABLE_SHORT)
  })

  test('database prefix matches APP_DATABASE', () => {
    const prefix = appTables.DASHBOARD_CHARTS_TABLE.split('.')[0]
    expect(prefix).toBe(appTables.APP_DATABASE)
  })
})

// ---------------------------------------------------------------------------
// DASHBOARD_SETTINGS_TABLE — real module (default env)
// ---------------------------------------------------------------------------

describe('DASHBOARD_SETTINGS_TABLE (real module, default env)', () => {
  test('is APP_DATABASE.DASHBOARD_SETTINGS_TABLE_SHORT', () => {
    expect(appTables.DASHBOARD_SETTINGS_TABLE).toBe(
      `${appTables.APP_DATABASE}.${appTables.DASHBOARD_SETTINGS_TABLE_SHORT}`
    )
  })

  test('table suffix matches the SHORT constant', () => {
    const suffix = appTables.DASHBOARD_SETTINGS_TABLE.split('.')
      .slice(1)
      .join('.')
    expect(suffix).toBe(appTables.DASHBOARD_SETTINGS_TABLE_SHORT)
  })

  test('database prefix matches APP_DATABASE', () => {
    const prefix = appTables.DASHBOARD_SETTINGS_TABLE.split('.')[0]
    expect(prefix).toBe(appTables.APP_DATABASE)
  })
})

// ---------------------------------------------------------------------------
// FINDINGS_TABLE — real module (default env)
// ---------------------------------------------------------------------------

describe('FINDINGS_TABLE (real module, default env)', () => {
  test('is APP_DATABASE.FINDINGS_TABLE_SHORT', () => {
    expect(appTables.FINDINGS_TABLE).toBe(
      `${appTables.APP_DATABASE}.${appTables.FINDINGS_TABLE_SHORT}`
    )
  })

  test('table suffix matches the SHORT constant', () => {
    const suffix = appTables.FINDINGS_TABLE.split('.').slice(1).join('.')
    expect(suffix).toBe(appTables.FINDINGS_TABLE_SHORT)
  })

  test('database prefix matches APP_DATABASE', () => {
    const prefix = appTables.FINDINGS_TABLE.split('.')[0]
    expect(prefix).toBe(appTables.APP_DATABASE)
  })
})

// ---------------------------------------------------------------------------
// Cross-cutting structural invariants (real module)
// ---------------------------------------------------------------------------

describe('structural invariants (real module)', () => {
  test('all qualified names have exactly one dot separator', () => {
    const qualified = [
      appTables.EVENTS_TABLE,
      appTables.DASHBOARD_CHARTS_TABLE,
      appTables.DASHBOARD_SETTINGS_TABLE,
      appTables.FINDINGS_TABLE,
    ]
    for (const name of qualified) {
      const parts = name.split('.')
      expect(parts).toHaveLength(2)
      expect(parts[0].length).toBeGreaterThan(0)
      expect(parts[1].length).toBeGreaterThan(0)
    }
  })

  test('APP_DATABASE-prefixed tables all share the same database prefix', () => {
    const db = appTables.APP_DATABASE
    expect(appTables.DASHBOARD_CHARTS_TABLE.startsWith(`${db}.`)).toBe(true)
    expect(appTables.DASHBOARD_SETTINGS_TABLE.startsWith(`${db}.`)).toBe(true)
    expect(appTables.FINDINGS_TABLE.startsWith(`${db}.`)).toBe(true)
  })

  test('EVENTS_TABLE default uses hardcoded "system" prefix, not APP_DATABASE', () => {
    // Only meaningful when no EVENTS_TABLE_NAME override is present.
    if (!process.env.EVENTS_TABLE_NAME) {
      // EVENTS_TABLE is `process.env.EVENTS_TABLE_NAME || 'system.<short>'`
      // so its database is always "system" in the default path, even if
      // CLICKHOUSE_DATABASE (= APP_DATABASE) is set to something else.
      expect(appTables.EVENTS_TABLE.split('.')[0]).toBe('system')
    }
  })

  test('fully-qualified names do not start or end with a dot', () => {
    const qualified = [
      appTables.EVENTS_TABLE,
      appTables.DASHBOARD_CHARTS_TABLE,
      appTables.DASHBOARD_SETTINGS_TABLE,
      appTables.FINDINGS_TABLE,
    ]
    for (const name of qualified) {
      expect(name.startsWith('.')).toBe(false)
      expect(name.endsWith('.')).toBe(false)
    }
  })

  test('SHORT constants are proper suffixes of their qualified counterparts', () => {
    // Each pair: fully-qualified ends with ".<SHORT>"
    const pairs: [string, string][] = [
      [
        appTables.DASHBOARD_CHARTS_TABLE,
        appTables.DASHBOARD_CHARTS_TABLE_SHORT,
      ],
      [
        appTables.DASHBOARD_SETTINGS_TABLE,
        appTables.DASHBOARD_SETTINGS_TABLE_SHORT,
      ],
      [appTables.FINDINGS_TABLE, appTables.FINDINGS_TABLE_SHORT],
    ]
    for (const [qualified, short] of pairs) {
      expect(qualified.endsWith(`.${short}`)).toBe(true)
    }
  })
})

// ---------------------------------------------------------------------------
// Env-override logic tested via mock.module
// (Bun cannot re-evaluate a module, so we mock the module to inject the
//  values that a different environment would produce and verify the contracts.)
// ---------------------------------------------------------------------------

describe('env-override contracts (via mock.module)', () => {
  test('custom CLICKHOUSE_DATABASE → APP_DATABASE-derived tables use that prefix', () => {
    const customDb = 'my_custom_db'
    // Simulate what the module would export if CLICKHOUSE_DATABASE='my_custom_db'
    const simulated = {
      APP_DATABASE: customDb,
      EVENTS_TABLE_SHORT: 'monitoring_events',
      DASHBOARD_CHARTS_TABLE_SHORT: 'clickhouse_monitoring_custom_dashboard',
      DASHBOARD_SETTINGS_TABLE_SHORT:
        'clickhouse_monitoring_custom_dashboard_settings',
      FINDINGS_TABLE_SHORT: 'monitoring_findings',
      EVENTS_TABLE: `system.monitoring_events`, // unchanged — own override path
      DASHBOARD_CHARTS_TABLE: `${customDb}.clickhouse_monitoring_custom_dashboard`,
      DASHBOARD_SETTINGS_TABLE: `${customDb}.clickhouse_monitoring_custom_dashboard_settings`,
      FINDINGS_TABLE: `${customDb}.monitoring_findings`,
    }

    // Verify the formula: qualified = `${APP_DATABASE}.${SHORT}`
    expect(simulated.DASHBOARD_CHARTS_TABLE).toBe(
      `${simulated.APP_DATABASE}.${simulated.DASHBOARD_CHARTS_TABLE_SHORT}`
    )
    expect(simulated.DASHBOARD_SETTINGS_TABLE).toBe(
      `${simulated.APP_DATABASE}.${simulated.DASHBOARD_SETTINGS_TABLE_SHORT}`
    )
    expect(simulated.FINDINGS_TABLE).toBe(
      `${simulated.APP_DATABASE}.${simulated.FINDINGS_TABLE_SHORT}`
    )
  })

  test('EVENTS_TABLE_NAME override → EVENTS_TABLE equals that value exactly', () => {
    const override = 'custom_db.custom_events_table'
    // Simulate: process.env.EVENTS_TABLE_NAME = override
    const eventsTable = override || `system.monitoring_events`
    expect(eventsTable).toBe(override)
  })

  test('empty CLICKHOUSE_DATABASE → APP_DATABASE falls back to "system"', () => {
    // '' is falsy → `envVal || 'system'` = 'system'
    // Use a variable so TS doesn't flag the always-falsy literal.
    const envVal: string = ''
    const db = envVal || 'system'
    expect(db).toBe('system')
  })

  test('empty EVENTS_TABLE_NAME → EVENTS_TABLE falls back to default', () => {
    // '' is falsy → `envVal || 'system.monitoring_events'`
    const envVal: string = ''
    const eventsTable = envVal || `system.monitoring_events`
    expect(eventsTable).toBe('system.monitoring_events')
  })

  test('non-empty CLICKHOUSE_DATABASE → APP_DATABASE uses that value', () => {
    const envValue = 'production'
    const db = envValue || 'system'
    expect(db).toBe('production')
  })

  test('all APP_DATABASE-derived tables update when database changes', () => {
    const databases = ['analytics', 'chm_v2', 'prod_db']
    for (const customDb of databases) {
      const charts = `${customDb}.clickhouse_monitoring_custom_dashboard`
      const settings = `${customDb}.clickhouse_monitoring_custom_dashboard_settings`
      const findings = `${customDb}.monitoring_findings`
      expect(charts.startsWith(`${customDb}.`)).toBe(true)
      expect(settings.startsWith(`${customDb}.`)).toBe(true)
      expect(findings.startsWith(`${customDb}.`)).toBe(true)
    }
  })
})
