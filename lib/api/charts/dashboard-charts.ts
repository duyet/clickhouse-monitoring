/**
 * Dashboard Charts
 * Charts for custom dashboard configuration and settings
 */

import type { ChartQueryBuilder } from './types'

export const dashboardCharts: Record<string, ChartQueryBuilder> = {
  'dashboard-charts': () => ({
    query: `
      SELECT * FROM system.clickhouse_monitoring_custom_dashboard FINAL
      ORDER BY ordering ASC
    `,
    optional: true,
    tableCheck: 'system.clickhouse_monitoring_custom_dashboard',
  }),

  'dashboard-settings': () => ({
    query: `
      SELECT * FROM system.clickhouse_monitoring_custom_dashboard_settings FINAL
    `,
    optional: true,
    tableCheck: 'system.clickhouse_monitoring_custom_dashboard_settings',
  }),
}
