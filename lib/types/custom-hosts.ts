export type CustomHost = {
  id: string // UUID
  name: string // Display name
  host: string // e.g. https://my-clickhouse:8443
  user: string
  password: string
  createdAt: string // ISO string
  updatedAt: string // ISO string
}

export type CustomHostInput = Omit<CustomHost, 'id' | 'createdAt' | 'updatedAt'>

export const CUSTOM_HOSTS_STORAGE_KEY = 'clickhouse-custom-hosts'
