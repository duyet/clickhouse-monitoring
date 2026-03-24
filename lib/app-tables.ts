/**
 * Centralized application database and table name configuration.
 *
 * Every app-specific table (monitoring events, custom dashboards, etc.) should
 * be referenced through the exports below so that the target database can be
 * changed in one place via the CLICKHOUSE_DATABASE env var.
 *
 * ClickHouse *system* tables (query_log, parts, ...) are NOT affected -- those
 * are intrinsic to ClickHouse and always live in the "system" database.
 *
 * Environment variables:
 *   CLICKHOUSE_DATABASE  - database for app-owned tables (default: "system")
 *   EVENTS_TABLE_NAME    - full override for the events table
 */

export const APP_DATABASE = process.env.CLICKHOUSE_DATABASE || 'system'

// Bare table identifiers (without database prefix).
export const EVENTS_TABLE_SHORT = 'monitoring_events'
export const DASHBOARD_CHARTS_TABLE_SHORT =
  'clickhouse_monitoring_custom_dashboard'
export const DASHBOARD_SETTINGS_TABLE_SHORT =
  'clickhouse_monitoring_custom_dashboard_settings'

// Fully-qualified "database.table" names used in SQL.
export const EVENTS_TABLE =
  process.env.EVENTS_TABLE_NAME || `${APP_DATABASE}.${EVENTS_TABLE_SHORT}`

export const DASHBOARD_CHARTS_TABLE = `${APP_DATABASE}.${DASHBOARD_CHARTS_TABLE_SHORT}`

export const DASHBOARD_SETTINGS_TABLE = `${APP_DATABASE}.${DASHBOARD_SETTINGS_TABLE_SHORT}`
