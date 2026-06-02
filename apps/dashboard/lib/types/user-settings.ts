export interface UserSettings {
  timezone: string // IANA timezone identifier (e.g., 'America/New_York')
  theme: 'light' | 'dark' | 'system'
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  timezone: Intl?.DateTimeFormat()?.resolvedOptions()?.timeZone || 'UTC',
  theme: 'system',
}

export const USER_SETTINGS_STORAGE_KEY = 'clickhouse-monitor-user-settings'
