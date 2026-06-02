export interface BrowserConnection {
  id: string // UUID
  hostId: number // negative integer (-1, -2, ...)
  name: string // display name
  host: string // full URL e.g. https://my.clickhouse.cloud:8443
  user: string
  password: string // stored in localStorage
  createdAt: string // ISO timestamp
  updatedAt: string
}

export const BROWSER_CONNECTIONS_STORAGE_KEY =
  'clickhouse-monitor-browser-connections'
