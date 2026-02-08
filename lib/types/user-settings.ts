import type {
  RefreshIntervalValue,
  TableDensityValue,
} from '@/lib/constants/settings'

export interface UserSettings {
  timezone: string // IANA timezone identifier (e.g., 'America/New_York')
  theme: 'light' | 'dark' | 'system'
  // Data refresh settings
  refreshInterval: RefreshIntervalValue // Data refresh interval in milliseconds
  autoRefresh: boolean // Enable automatic data refresh
  // Display settings
  tableDensity: TableDensityValue // Table row density preset
  compactMode: boolean // Compact UI mode
}

/**
 * Get browser timezone using Intl API
 * Returns UTC if timezone detection fails or not available
 */
function getBrowserTimezone(): string {
  if (typeof Intl === 'undefined' || !Intl.DateTimeFormat) {
    return 'UTC'
  }
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  timezone: 'UTC', // Will be overridden by browser timezone on client-side
  theme: 'system',
  refreshInterval: 60000, // 1 minute default
  autoRefresh: true,
  tableDensity: 'comfortable',
  compactMode: false,
}

export { getBrowserTimezone }

export const USER_SETTINGS_STORAGE_KEY = 'clickhouse-monitor-user-settings'
