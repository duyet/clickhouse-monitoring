import type { QueryConfig } from '@/types/query-config'

export const warningsConfig: QueryConfig = {
  name: 'warnings',
  description:
    'Server-side warnings about potential configuration or operational issues',
  // system.warnings may not exist on every server / ClickHouse version
  optional: true,
  tableCheck: 'system.warnings',
  refreshInterval: 30_000,
  sql: `SELECT message FROM system.warnings`,
  columns: ['message'],
}
