import { type QueryConfig } from '@/types/query-config'

export const rolesConfig: QueryConfig = {
  name: 'roles',
  description: 'Roles',
  sql: `
      SELECT *,
      FROM system.roles
      ORDER BY name
    `,
  columns: ['name', 'id', 'storage'],
  columnFormats: {},
}
