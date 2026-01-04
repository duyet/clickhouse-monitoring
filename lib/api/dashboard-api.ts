/**
 * Dashboard API constants and types
 * Provides table names and DDL for custom dashboards
 */

export const DATABASE = 'system'

export type TableChartsRow = {
  kind: 'area' | 'bar' | 'calendar'
  title: string
  query: string
  ordering: number
  created_at: string
  updated_at: string
}

export type TableSettingsRow = {
  key: string
  value: string
  updated_at: string
}

export const TABLE_CHARTS = `${DATABASE}.clickhouse_monitoring_custom_dashboard`
export const TABLE_CHARTS_DDL = `
  CREATE TABLE IF NOT EXISTS ${TABLE_CHARTS} (
    kind Enum('area' = 1, 'bar' = 2, 'calendar' = 3),
    title String,
    query String,
    ordering UInt16,
    created_at DateTime DEFAULT now(),
    updated_at DateTime DEFAULT now()
  ) ENGINE = ReplacingMergeTree()
  ORDER BY (title)
  SETTINGS clean_deleted_rows = 'Always'
`

export const TABLE_SETTINGS = `${DATABASE}.clickhouse_monitoring_custom_dashboard_settings`
export const TABLE_SETTINGS_DDL = `
  CREATE TABLE IF NOT EXISTS ${TABLE_SETTINGS} (
    key String,
    value String,
    updated_at DateTime DEFAULT now()
  ) ENGINE = ReplacingMergeTree()
  ORDER BY (key)
  SETTINGS clean_deleted_rows = 'Always'
`
