/**
 * Settings Constants
 *
 * Centralized constants for user settings options, defaults, and utilities.
 */

/**
 * Refresh interval options for data polling
 */
export const REFRESH_INTERVAL_OPTIONS = [
  {
    value: 15000,
    label: '15 seconds',
    description: 'Real-time data (high server load)',
  },
  {
    value: 30000,
    label: '30 seconds',
    description: 'Fast updates (recommended for critical metrics)',
  },
  {
    value: 60000,
    label: '1 minute',
    description: 'Balanced (default)',
  },
  {
    value: 120000,
    label: '2 minutes',
    description: 'Lower server load',
  },
  {
    value: 300000,
    label: '5 minutes',
    description: 'Minimal server load',
  },
] as const

/**
 * Table density presets
 */
export const TABLE_DENSITY_OPTIONS = [
  {
    value: 'compact',
    label: 'Compact',
    description: 'More rows visible, smaller padding',
    rowsPerPage: 200,
    className: 'text-xs',
  },
  {
    value: 'comfortable',
    label: 'Comfortable',
    description: 'Balanced spacing (default)',
    rowsPerPage: 100,
    className: 'text-sm',
  },
  {
    value: 'spacious',
    label: 'Spacious',
    description: 'More padding, fewer rows',
    rowsPerPage: 50,
    className: 'text-base',
  },
] as const

/**
 * Settings export/import version
 * Increment this when settings structure changes significantly
 */
export const SETTINGS_VERSION = 1

/**
 * Settings file name for export/import
 */
export const SETTINGS_FILENAME = 'clickhouse-monitor-settings.json'

/**
 * Type definitions
 */
export type RefreshIntervalValue =
  (typeof REFRESH_INTERVAL_OPTIONS)[number]['value']

export type TableDensityValue = (typeof TABLE_DENSITY_OPTIONS)[number]['value']

/**
 * Default settings values
 */
export const DEFAULT_SETTINGS_VALUES = {
  refreshInterval: 60000, // 1 minute
  tableDensity: 'comfortable' as const,
  compactMode: false,
  autoRefresh: true,
} as const
